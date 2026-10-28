import { useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import Icon from "../components/Icon";
import { calcTotals, formatDate } from "../utils/calc";

export default function Receipts() {
  const { receipts, deleteReceipt, showToast } = useData();
  const { formatMoney } = useCurrency();
  const [search, setSearch] = useState("");
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // Add the total to every receipt, newest first
  const rows = receipts
    .map((receipt) => ({ ...receipt, total: calcTotals(receipt).total }))
    .sort(
      (a, b) => b.date.localeCompare(a.date) || b.number.localeCompare(a.number)
    );

  const searchText = search.trim().toLowerCase();
  const visibleRows = rows.filter(
    (row) =>
      row.number.toLowerCase().includes(searchText) ||
      row.customerName.toLowerCase().includes(searchText)
  );

  async function confirmDelete() {
    const ok = await deleteReceipt(receiptToDelete.id);
    if (ok) showToast(`${receiptToDelete.number} was deleted.`);
    setReceiptToDelete(null);
  }

  const createButton = (
    <Link to="/receipts/new" className="btn btn-primary">
      <Icon name="plusCircle" size={18} /> Create Receipt
    </Link>
  );

  return (
    <>
      <div className="page-header">
        <h1>Receipts</h1>
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
              placeholder="Search receipts or customers"
              aria-label="Search receipts"
            />
          </div>
        </div>

        {receipts.length === 0 ? (
          <EmptyState
            title="No receipts yet"
            message="Create a receipt when a customer pays right away."
            action={createButton}
          />
        ) : visibleRows.length === 0 ? (
          <EmptyState
            title="No receipts match"
            message="Check the spelling or try a different search."
            action={
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSearch("")}
              >
                Clear search
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th className="num">Amount</th>
                  <th className="actions-col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleRows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Receipt">
                      <Link to={`/receipts/${row.id}`} className="strong-link">
                        {row.number}
                      </Link>
                    </td>
                    <td data-label="Customer">{row.customerName}</td>
                    <td data-label="Date">{formatDate(row.date)}</td>
                    <td data-label="Method">{row.method}</td>
                    <td data-label="Amount" className="num">
                      {formatMoney(row.total)}
                    </td>
                    <td data-label="Actions" className="actions-col">
                      <div className="row-actions">
                        <Link
                          to={`/receipts/${row.id}`}
                          className="icon-button"
                          aria-label={`View ${row.number}`}
                          title="View"
                        >
                          <Icon name="eye" size={17} />
                        </Link>
                        <button
                          type="button"
                          className="icon-button icon-danger"
                          onClick={() => setReceiptToDelete(row)}
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

      {receiptToDelete && (
        <ConfirmDialog
          title="Delete receipt?"
          message={`${receiptToDelete.number} will be permanently deleted. This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={() => setReceiptToDelete(null)}
        />
      )}
    </>
  );
}
