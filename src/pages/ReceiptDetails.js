import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import DocumentHeader from "../components/DocumentHeader";
import Icon from "../components/Icon";
import {
  calcLineTotal,
  calcTotals,
  formatCurrency,
  formatDate,
} from "../utils/calc";

export default function ReceiptDetails() {
  const { receiptId } = useParams();
  const navigate = useNavigate();
  const { receipts, deleteReceipt, showToast } = useData();
  const { currency, formatMoney } = useCurrency();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const receipt = receipts.find((item) => item.id === receiptId);

  if (!receipt) {
    return (
      <div className="card">
        <EmptyState
          title="Receipt not found"
          message="It may have been deleted."
          action={
            <Link to="/receipts" className="btn btn-primary">
              Back to receipts
            </Link>
          }
        />
      </div>
    );
  }

  const totals = calcTotals(receipt);

  async function handleDelete() {
    const ok = await deleteReceipt(receipt.id);
    if (!ok) return;
    showToast(`${receipt.number} was deleted.`);
    navigate("/receipts");
  }

  return (
    <>
      {/* Everything marked "no-print" is hidden when printing */}
      <div className="page-header no-print">
        <div>
          <Link to="/receipts" className="back-link">
            <Icon name="arrowLeft" size={16} /> Back to receipts
          </Link>
          <h1>{receipt.number}</h1>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
          <button
            type="button"
            className="btn btn-danger-outline"
            onClick={() => setConfirmDelete(true)}
          >
            <Icon name="trash" size={16} /> Delete
          </button>
        </div>
      </div>

      <section className="card receipt-paper doc">
        <DocumentHeader title="RECEIPT" number={receipt.number}>
          <span className="paid-stamp">PAID</span>
        </DocumentHeader>

        <div className="doc-info">
          <div className="doc-box">
            <h3 className="meta-title">Received from</h3>
            <address>
              <strong>{receipt.customerName}</strong>
              {receipt.customerEmail && (
                <>
                  <br />
                  {receipt.customerEmail}
                </>
              )}
            </address>
          </div>
          <div className="doc-box">
            <h3 className="meta-title">Payment</h3>
            <dl className="meta-list">
              <div>
                <dt>Date</dt>
                <dd>{formatDate(receipt.date)}</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>{receipt.method}</dd>
              </div>
            </dl>
          </div>
          <div className="doc-amount">
            <span className="doc-amount-label">Amount paid</span>
            <strong className="doc-amount-value">
              {formatCurrency(totals.total)}
            </strong>
          </div>
        </div>

        <div className="table-wrap">
          <table className="data-table items-table doc-table">
            <thead>
              <tr>
                <th>Description</th>
                <th className="num">Qty</th>
                <th className="num">Unit price</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id}>
                  <td data-label="Description">{item.description}</td>
                  <td data-label="Qty" className="num">
                    {item.quantity}
                  </td>
                  <td data-label="Unit price" className="num">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td data-label="Amount" className="num">
                    {formatCurrency(calcLineTotal(item))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="totals totals-right doc-totals">
          <div>
            <dt>Subtotal</dt>
            <dd>{formatCurrency(totals.subtotal)}</dd>
          </div>
          {receipt.discount > 0 && (
            <div>
              <dt>Discount ({receipt.discount}%)</dt>
              <dd>-{formatCurrency(totals.discountAmount)}</dd>
            </div>
          )}
          {receipt.tax > 0 && (
            <div>
              <dt>Tax ({receipt.tax}%)</dt>
              <dd>{formatCurrency(totals.taxAmount)}</dd>
            </div>
          )}
          <div className="grand final">
            <dt>Total paid</dt>
            <dd>{formatCurrency(totals.total)}</dd>
          </div>
        </dl>

        {receipt.notes && (
          <>
            <h3 className="meta-title">Notes</h3>
            <p className="pre-line">{receipt.notes}</p>
          </>
        )}

        <footer className="doc-footer">Thank you for your payment.</footer>

        {currency !== "USD" && (
          <p className="field-hint no-print">
            Amounts are shown in USD, the currency this receipt was saved in.
            That is about {formatMoney(totals.total)} in {currency} at today's
            rate.
          </p>
        )}
      </section>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete receipt?"
          message={`${receipt.number} will be permanently deleted. This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
