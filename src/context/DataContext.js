import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "./AuthContext";

// All clients, invoices, receipts and payments live in your Supabase database.
// Row Level Security makes sure each logged-in user can only read and write THEIR OWN rows.

const DataContext = createContext(null);

// The database uses snake_case names (client_id); our pages use camelCase (clientId).
// These functions translate one database row into the object shape the pages expect.
function toClient(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    address: row.address,
  };
}

function toItems(rows) {
  return [...(rows || [])]
    .sort((a, b) => a.position - b.position)
    .map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
    }));
}

function toInvoice(row) {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id,
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: toItems(row.invoice_items),
    discount: Number(row.discount),
    tax: Number(row.tax),
    notes: row.notes,
    terms: row.terms,
    saved: row.status, // 'draft' or 'sent'
  };
}

function toReceipt(row) {
  return {
    id: row.id,
    number: row.number,
    clientId: row.client_id, // can be null for walk-in customers
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    date: row.receipt_date,
    method: row.payment_method,
    items: toItems(row.receipt_items),
    discount: Number(row.discount),
    tax: Number(row.tax),
    notes: row.notes,
  };
}

function toPayment(row) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    amount: Number(row.amount),
    date: row.paid_on,
    method: row.method,
    note: row.note,
  };
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const userId = user ? user.id : null;

  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loadedFor, setLoadedFor] = useState(null); // the user id whose data has finished loading
  const [dataError, setDataError] = useState("");
  const [toast, setToast] = useState(null);
  const latestRequest = useRef(0);

  // True from the moment someone logs in until their data has arrived
  const dataLoading = Boolean(userId) && loadedFor !== userId;

  // ----- Loading -----
  async function loadAll() {
    const requestId = ++latestRequest.current;
    setDataError("");

    // Four requests at the same time. Invoices and receipts come with their line items.
    const [clientsResult, invoicesResult, paymentsResult, receiptsResult] =
      await Promise.all([
        supabase.from("clients").select("*").order("created_at"),
        supabase
          .from("invoices")
          .select("*, invoice_items(*)")
          .order("created_at"),
        supabase.from("payments").select("*").order("created_at"),
        supabase
          .from("receipts")
          .select("*, receipt_items(*)")
          .order("created_at"),
      ]);

    // If a newer load started while we were waiting, ignore this older answer
    if (requestId !== latestRequest.current) return;

    const failure =
      clientsResult.error ||
      invoicesResult.error ||
      paymentsResult.error ||
      receiptsResult.error;
    if (failure) {
      console.error("Could not load data", failure);
      setDataError(failure.message);
    } else {
      setClients(clientsResult.data.map(toClient));
      setInvoices(invoicesResult.data.map(toInvoice));
      setPayments(paymentsResult.data.map(toPayment));
      setReceipts(receiptsResult.data.map(toReceipt));
    }
    setLoadedFor(userId);
  }

  // useEffect: load the data when someone logs in, and clear it when they log out
  useEffect(() => {
    if (!userId) {
      latestRequest.current++;
      setClients([]);
      setInvoices([]);
      setPayments([]);
      setReceipts([]);
      setLoadedFor(null);
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function reloadData() {
    setLoadedFor(null);
    loadAll();
  }

  // ----- Toast message -----
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  // Shows a clear error message. Every function below returns false (or null) after a failure.
  function reportError(action, error) {
    console.error(action, error);
    const message =
      error.code === "23505" ? "That number is already used." : error.message;
    showToast(`${action}. ${message}`, "error");
    return false;
  }

  // ----- Clients -----
  // Every change has TWO steps: 1) save in the database, 2) only if that worked, update the screen.
  async function addClient(client) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address,
      })
      .select()
      .single();
    if (error) return reportError("Could not add the client", error);
    setClients((previous) => [...previous, toClient(data)]);
    return true;
  }

  async function updateClient(id, changes) {
    const { data, error } = await supabase
      .from("clients")
      .update(changes)
      .eq("id", id)
      .select()
      .single();
    if (error) return reportError("Could not update the client", error);
    setClients((previous) =>
      previous.map((client) => (client.id === id ? toClient(data) : client))
    );
    return true;
  }

  // A client with invoices cannot be deleted (the database enforces this too)
  async function deleteClient(id) {
    if (invoices.some((invoice) => invoice.clientId === id)) {
      return {
        ok: false,
        message:
          "This client has invoices. Delete or reassign those invoices first.",
      };
    }
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) return { ok: false, message: error.message };
    setClients((previous) => previous.filter((client) => client.id !== id));
    // Receipts keep the customer name, but lose the link to the deleted client
    setReceipts((previous) =>
      previous.map((receipt) =>
        receipt.clientId === id ? { ...receipt, clientId: null } : receipt
      )
    );
    return { ok: true };
  }

  // ----- Invoices -----
  // Saves a new invoice, or updates one that already has an id. Returns the invoice id, or null if it failed.
  async function saveInvoice(invoice) {
    const invoiceData = {
      id: invoice.id || null,
      client_id: invoice.clientId,
      number: invoice.number,
      issue_date: invoice.issueDate,
      due_date: invoice.dueDate,
      discount: invoice.discount,
      tax: invoice.tax,
      notes: invoice.notes,
      terms: invoice.terms,
      status: invoice.saved,
    };
    const items = invoice.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    // The save_invoice database function saves the invoice and its items together
    const { data: savedId, error } = await supabase.rpc("save_invoice", {
      p_invoice: invoiceData,
      p_items: items,
    });
    if (error) {
      reportError("Could not save the invoice", error);
      return null;
    }

    // Read the saved invoice back so the screen matches the database exactly
    const { data: row, error: readError } = await supabase
      .from("invoices")
      .select("*, invoice_items(*)")
      .eq("id", savedId)
      .single();
    if (readError) {
      await loadAll();
      return savedId;
    }

    const saved = toInvoice(row);
    setInvoices((previous) =>
      previous.some((item) => item.id === saved.id)
        ? previous.map((item) => (item.id === saved.id ? saved : item))
        : [...previous, saved]
    );
    return saved.id;
  }

  // Deleting an invoice also deletes its items and payments (the database does this for us)
  async function deleteInvoice(id) {
    const { error } = await supabase.from("invoices").delete().eq("id", id);
    if (error) return reportError("Could not delete the invoice", error);
    setInvoices((previous) => previous.filter((invoice) => invoice.id !== id));
    setPayments((previous) =>
      previous.filter((payment) => payment.invoiceId !== id)
    );
    return true;
  }

  // ----- Receipts -----
  // Receipts are created once and never edited. Returns the receipt id, or null if saving failed.
  async function saveReceipt(receipt) {
    const receiptData = {
      client_id: receipt.clientId || null,
      customer_name: receipt.customerName,
      customer_email: receipt.customerEmail,
      number: receipt.number,
      receipt_date: receipt.date,
      payment_method: receipt.method,
      discount: receipt.discount,
      tax: receipt.tax,
      notes: receipt.notes,
    };
    const items = receipt.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { data: savedId, error } = await supabase.rpc("save_receipt", {
      p_receipt: receiptData,
      p_items: items,
    });
    if (error) {
      reportError("Could not save the receipt", error);
      return null;
    }

    const { data: row, error: readError } = await supabase
      .from("receipts")
      .select("*, receipt_items(*)")
      .eq("id", savedId)
      .single();
    if (readError) {
      await loadAll();
      return savedId;
    }

    const saved = toReceipt(row);
    setReceipts((previous) => [...previous, saved]);
    return saved.id;
  }

  async function deleteReceipt(id) {
    const { error } = await supabase.from("receipts").delete().eq("id", id);
    if (error) return reportError("Could not delete the receipt", error);
    setReceipts((previous) => previous.filter((receipt) => receipt.id !== id));
    return true;
  }

  // ----- Payments -----
  async function addPayment(payment) {
    const { data, error } = await supabase
      .from("payments")
      .insert({
        invoice_id: payment.invoiceId,
        amount: payment.amount,
        paid_on: payment.date,
        method: payment.method,
        note: payment.note,
      })
      .select()
      .single();
    if (error) return reportError("Could not record the payment", error);
    setPayments((previous) => [...previous, toPayment(data)]);
    return true;
  }

  async function deletePayment(id) {
    const { error } = await supabase.from("payments").delete().eq("id", id);
    if (error) return reportError("Could not remove the payment", error);
    setPayments((previous) => previous.filter((payment) => payment.id !== id));
    return true;
  }

  // ----- Helpers used by several pages -----
  function getClient(id) {
    return clients.find((client) => client.id === id);
  }

  // Finds the highest INV-### number and adds one
  function getNextInvoiceNumber() {
    const highest = invoices.reduce((max, invoice) => {
      const match = /^INV-(\d+)$/.exec(invoice.number);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `INV-${String(highest + 1).padStart(3, "0")}`;
  }

  // Same idea for receipts: RCT-001, RCT-002 ...
  function getNextReceiptNumber() {
    const highest = receipts.reduce((max, receipt) => {
      const match = /^RCT-(\d+)$/.exec(receipt.number);
      return match ? Math.max(max, Number(match[1])) : max;
    }, 0);
    return `RCT-${String(highest + 1).padStart(3, "0")}`;
  }

  const value = {
    clients,
    invoices,
    receipts,
    payments,
    dataLoading,
    dataError,
    reloadData,
    toast,
    showToast,
    dismissToast: () => setToast(null),
    addClient,
    updateClient,
    deleteClient,
    saveInvoice,
    deleteInvoice,
    saveReceipt,
    deleteReceipt,
    addPayment,
    deletePayment,
    getClient,
    getNextInvoiceNumber,
    getNextReceiptNumber,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// Any component can call useData() to read the shared data and functions
export function useData() {
  return useContext(DataContext);
}
