import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import {
  STATUSES,
  calcTotals,
  formatDate,
  getInvoiceStatus,
} from "../utils/calc";

export default function Invoices() {
  const { invoices, payments, getClient, deleteInvoice, showToast } = useData();
  const { formatMoney } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Search text and filter are state. The list below is DERIVED from them on every render.
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [statusFilter, setStatusFilter] = useState("All");
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);

  // useEffect: if the top-bar search sends us here with a new ?q=..., update the search box
  const urlQuery = searchParams.get("q") || "";
  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  // Add the client name, total and status to every invoice so the table is easy to render
  const rows = invoices
    .map((invoice) => ({
      ...invoice,
      clientName: getClient(invoice.clientId)?.name || "Unknown client",
      total: calcTotals(invoice).total,
      status: getInvoiceStatus(invoice, payments),
    }))
    .sort(
      (a, b) =>
        b.issueDate.localeCompare(a.issueDate) ||
        b.number.localeCompare(a.number)
    );

  const searchText = search.trim().toLowerCase();
  const visibleRows = rows.filter((row) => {
    const matchesSearch =
      row.number.toLowerCase().includes(searchText) ||
      row.clientName.toLowerCase().includes(searchText);
    const matchesStatus = statusFilter === "All" || row.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
    navigate("/invoices", { replace: true });
  }

  async function confirmDelete() {
    const ok = await deleteInvoice(invoiceToDelete.id);
    if (ok) showToast(`${invoiceToDelete.number} was deleted.`);
    setInvoiceToDelete(null);
  }

  const createButton = (
    <Link to="/invoices/new" className="btn btn-primary">
      <Icon name="plusCircle" size={18} /> Create Invoice
    </Link>
  );

  return (
    <>
      <div className="page-header">
        <h1>Invoices</h1>
        {createButton}
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="search-box">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search invoices or clients"
              aria-label="Search invoices"
            />
          </div>
          <label className="filter-select">
            <span className="sr-only">Filter by status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All statuses</option>
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>

        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices yet"
            message="Create an invoice to start tracking what clients owe you."
            action={createButton}
          />
        ) : visibleRows.length === 0 ? (
          <EmptyState
            title="No invoices match"
            message="Try a different search or status filter."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Issued</th>
                  <th>Due</th>
                  <th className="num">Amount</th>
                  <th>Status</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Invoice">
                      <Link to={`/invoices/${row.id}`} className="strong-link">
                        {row.number}
                      </Link>
                    </td>
                    <td data-label="Client">{row.clientName}</td>
                    <td data-label="Issued">{formatDate(row.issueDate)}</td>
                    <td data-label="Due">{formatDate(row.dueDate)}</td>
                    <td data-label="Amount" className="num">
                      {formatMoney(row.total)}
                    </td>
                    <td data-label="Status">
                      <StatusBadge status={row.status} />
                    </td>
                    <td data-label="Actions" className="actions-col">
                      <div className="row-actions">
                        <Link
                          to={`/invoices/${row.id}`}
                          className="icon-button"
                          aria-label={`View ${row.number}`}
                          title="View"
                        >
                          <Icon name="eye" size={17} />
                        </Link>
                        <Link
                          to={`/invoices/${row.id}/edit`}
                          className="icon-button"
                          aria-label={`Edit ${row.number}`}
                          title="Edit"
                        >
                          <Icon name="edit" size={17} />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-danger"
                          onClick={() => setInvoiceToDelete(row)}
                          aria-label={`Delete ${row.number}`}
                          title="Delete"
                        >
                          <Icon name="trash" size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {invoiceToDelete && (
        <ConfirmDialog
          title="Delete invoice?"
          message={`${invoiceToDelete.number} and all of its recorded payments will be permanently deleted.`}
          onConfirm={confirmDelete}
          onCancel={() => setInvoiceToDelete(null)}
        />
      )}
    </>
  );
}
