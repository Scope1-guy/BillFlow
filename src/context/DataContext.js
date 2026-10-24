import { createContext, useContext, useEffect, useState } from 'react'
import { createSampleData } from '../data/sampleData'

// ---------- Context API (kept deliberately simple) ----------
// Clients, invoices and payments are needed by almost every page,
// so we keep them in ONE place and share them with Context instead of
// passing props through many layers ("prop drilling").
//
// NOTE: LocalStorage is only for this frontend demo. Anyone can read or edit it
// in their browser, so it is NOT a secure replacement for a real backend.

const STORAGE_KEY = 'billflow-data-v1'

const DataContext = createContext(null)

// Read saved data from LocalStorage. Fall back to the demo data if there is none,
// or if the saved text is broken.
function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed.clients) && Array.isArray(parsed.invoices) && Array.isArray(parsed.payments)) {
        return parsed
      }
    }
  } catch (error) {
    console.warn('Could not read saved data, using demo data instead.', error)
  }
  return createSampleData()
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export function DataProvider({ children }) {
  // useState with a function runs loadData only ONCE, on the first render
  const [initialData] = useState(loadData)
  const [clients, setClients] = useState(initialData.clients)
  const [invoices, setInvoices] = useState(initialData.invoices)
  const [payments, setPayments] = useState(initialData.payments)
  const [toast, setToast] = useState(null)

  // useEffect: runs after render whenever the data changes -> save it to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients, invoices, payments }))
    } catch (error) {
      console.warn('Could not save data to LocalStorage.', error)
    }
  }, [clients, invoices, payments])

  // useEffect: hide the toast message automatically after 3.5 seconds.
  // The returned function cleans up the timer if the toast changes early.
  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(message, type = 'success') {
    setToast({ message, type })
  }

  // ----- Clients -----
  // To update an array in state we never change it directly.
  // We build a NEW array: [...old, newItem] to add, .map() to edit, .filter() to remove.
  function addClient(client) {
    setClients((previous) => [...previous, { ...client, id: makeId('c') }])
  }

  function updateClient(id, changes) {
    setClients((previous) => previous.map((client) => (client.id === id ? { ...client, ...changes } : client)))
  }

  // A client with invoices cannot be deleted - otherwise those invoices would point at nothing.
  function deleteClient(id) {
    const hasInvoices = invoices.some((invoice) => invoice.clientId === id)
    if (hasInvoices) {
      return { ok: false, message: 'This client has invoices. Delete or reassign those invoices first.' }
    }
    setClients((previous) => previous.filter((client) => client.id !== id))
    return { ok: true }
  }

  // ----- Invoices -----
  // Saves a new invoice, or replaces an existing one when the id already exists.
  function saveInvoice(invoice) {
    const exists = invoices.some((item) => item.id === invoice.id)
    if (exists) {
      setInvoices((previous) => previous.map((item) => (item.id === invoice.id ? invoice : item)))
      return invoice.id
    }
    const newInvoice = { ...invoice, id: makeId('i') }
    setInvoices((previous) => [...previous, newInvoice])
    return newInvoice.id
  }

  // Deleting an invoice also deletes its payments so no orphan records are left behind
  function deleteInvoice(id) {
    setInvoices((previous) => previous.filter((invoice) => invoice.id !== id))
    setPayments((previous) => previous.filter((payment) => payment.invoiceId !== id))
  }

  // ----- Payments -----
  function addPayment(payment) {
    setPayments((previous) => [...previous, { ...payment, id: makeId('p') }])
  }

  function deletePayment(id) {
    setPayments((previous) => previous.filter((payment) => payment.id !== id))
  }

  // ----- Helpers used by several pages -----
  function getClient(id) {
    return clients.find((client) => client.id === id)
  }

  // Finds the highest INV-### number and adds one
  function getNextInvoiceNumber() {
    const highest = invoices.reduce((max, invoice) => {
      const match = /^INV-(\d+)$/.exec(invoice.number)
      return match ? Math.max(max, Number(match[1])) : max
    }, 0)
    return `INV-${String(highest + 1).padStart(3, '0')}`
  }

  function resetDemoData() {
    const sample = createSampleData()
    setClients(sample.clients)
    setInvoices(sample.invoices)
    setPayments(sample.payments)
  }

  function clearAllData() {
    setClients([])
    setInvoices([])
    setPayments([])
  }

  const value = {
    clients,
    invoices,
    payments,
    toast,
    showToast,
    dismissToast: () => setToast(null),
    addClient,
    updateClient,
    deleteClient,
    saveInvoice,
    deleteInvoice,
    addPayment,
    deletePayment,
    getClient,
    getNextInvoiceNumber,
    resetDemoData,
    clearAllData,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// Any component can call useData() to read the shared data and functions
export function useData() {
  return useContext(DataContext)
}
