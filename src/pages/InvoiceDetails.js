import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useCurrency } from '../context/CurrencyContext'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import PaymentModal from '../components/PaymentModal'
import EmptyState from '../components/EmptyState'
import Icon from '../components/Icon'
import { calcLineTotal, calcTotals, formatDate, getAmountPaid, getBalance, getInvoiceStatus } from '../utils/calc'

export default function InvoiceDetails() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { invoices, payments, getClient, saveInvoice, deleteInvoice, deletePayment, showToast } = useData()
  const {formatMoney} = useCurrency();

  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [confirmDeleteInvoice, setConfirmDeleteInvoice] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)

  const invoice = invoices.find((item) => item.id === invoiceId)

  if (!invoice) {
    return (
      <div className="card">
        <EmptyState title="Invoice not found" message="It may have been deleted." action={<Link to="/invoices" className="btn btn-primary">Back to invoices</Link>} />
      </div>
    )
  }

  // ----- Derived values: calculated from the data, not stored -----
  const client = getClient(invoice.clientId)
  const totals = calcTotals(invoice)
  const amountPaid = getAmountPaid(invoice.id, payments)
  const balance = getBalance(invoice, payments)
  const status = getInvoiceStatus(invoice, payments)
  const invoicePayments = payments
    .filter((payment) => payment.invoiceId === invoice.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const isDraft = invoice.saved === 'draft'

  // A draft becomes "sent" - we replace the invoice with a copy that has saved: 'sent'
  function markAsSent() {
    saveInvoice({ ...invoice, saved: 'sent' })
    showToast(`${invoice.number} marked as sent.`)
  }

  function handleDeleteInvoice() {
    deleteInvoice(invoice.id)
    showToast(`${invoice.number} was deleted.`)
    navigate('/invoices')
  }

  function handleDeletePayment() {
    deletePayment(paymentToDelete.id)
    showToast('Payment removed.')
    setPaymentToDelete(null)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/invoices" className="back-link"><Icon name="arrowLeft" size={16} /> Back to invoices</Link>
          <h1 className="title-with-badge">{invoice.number} <StatusBadge status={status} /></h1>
        </div>
        <div className="header-actions">
          {isDraft && <button type="button" className="btn btn-secondary" onClick={markAsSent}>Mark as sent</button>}
          <Link to={`/invoices/${invoice.id}/edit`} className="btn btn-secondary"><Icon name="edit" size={16} /> Edit</Link>
          <button type="button" className="btn btn-primary" onClick={() => setShowPaymentModal(true)} disabled={isDraft || balance <= 0}
            title={isDraft ? 'Mark the invoice as sent before recording payments' : balance <= 0 ? 'This invoice is fully paid' : undefined}>
            <Icon name="wallet" size={16} /> Record payment
          </button>
          <button type="button" className="btn btn-danger-outline" onClick={() => setConfirmDeleteInvoice(true)}>
            <Icon name="trash" size={16} /> Delete
          </button>
        </div>
      </div>

      <div className="details-layout">
        <div className="details-main">
          <section className="card">
            <div className="detail-meta">
              <div>
                <h2 className="meta-title">Billed to</h2>
                {client ? (
                  <address>
                    <strong>{client.name}</strong><br />
                    {client.email}<br />
                    {client.phone && <>{client.phone}<br /></>}
                    {client.address}
                  </address>
                ) : <p className="muted">Client no longer exists.</p>}
              </div>
              <div>
                <h2 className="meta-title">Dates</h2>
                <dl className="meta-list">
                  <div><dt>Issued</dt><dd>{formatDate(invoice.issueDate)}</dd></div>
                  <div><dt>Due</dt><dd>{formatDate(invoice.dueDate)}</dd></div>
                </dl>
              </div>
            </div>

            <div className="table-wrap">
              <table className="data-table items-table">
                <thead>
                  <tr><th>Description</th><th className="num">Qty</th><th className="num">Unit price</th><th className="num">Amount</th></tr>
                </thead>
                <tbody>
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Description">{item.description}</td>
                      <td data-label="Qty" className="num">{item.quantity}</td>
                      <td data-label="Unit price" className="num">{formatMoney(item.unitPrice)}</td>
                      <td data-label="Amount" className="num">{formatMoney(calcLineTotal(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="totals totals-right">
              <div><dt>Subtotal</dt><dd>{formatMoney(totals.subtotal)}</dd></div>
              {invoice.discount > 0 && <div><dt>Discount ({invoice.discount}%)</dt><dd>-{formatMoney(totals.discountAmount)}</dd></div>}
              {invoice.tax > 0 && <div><dt>Tax ({invoice.tax}%)</dt><dd>{formatMoney(totals.taxAmount)}</dd></div>}
              <div className="grand"><dt>Total</dt><dd>{formatMoney(totals.total)}</dd></div>
              <div><dt>Amount paid</dt><dd className="positive">{formatMoney(amountPaid)}</dd></div>
              <div className="grand"><dt>Balance due</dt><dd>{formatMoney(balance)}</dd></div>
            </dl>
          </section>

          {(invoice.notes || invoice.terms) && (
            <section className="card">
              {invoice.notes && (<><h2 className="meta-title">Notes</h2><p className="pre-line">{invoice.notes}</p></>)}
              {invoice.terms && (<><h2 className="meta-title">Payment terms</h2><p className="pre-line">{invoice.terms}</p></>)}
            </section>
          )}
        </div>

        <aside className="details-side">
          <section className="card">
            <h2 className="card-title">Payment history</h2>
            {invoicePayments.length === 0 ? (
              <p className="muted">No payments recorded yet.</p>
            ) : (
              <ul className="activity-list">
                {invoicePayments.map((payment) => (
                  <li key={payment.id}>
                    <div>
                      <strong className="positive">{formatMoney(payment.amount)}</strong>
                      <span className="muted">{formatDate(payment.date)} - {payment.method}</span>
                      {payment.note && <span className="muted">{payment.note}</span>}
                    </div>
                    <button type="button" className="icon-button icon-danger" onClick={() => setPaymentToDelete(payment)} aria-label={`Remove payment of ${formatMoney(payment.amount)}`}>
                      <Icon name="trash" size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {showPaymentModal && <PaymentModal invoice={invoice} balance={balance} onClose={() => setShowPaymentModal(false)} />}

      {confirmDeleteInvoice && (
        <ConfirmDialog title="Delete invoice?" message={`${invoice.number} and all of its recorded payments will be permanently deleted.`}
          onConfirm={handleDeleteInvoice} onCancel={() => setConfirmDeleteInvoice(false)} />
      )}

      {paymentToDelete && (
        <ConfirmDialog title="Remove payment?" confirmLabel="Remove"
          message={`The ${formatMoney(paymentToDelete.amount)} payment from ${formatDate(paymentToDelete.date)} will be removed and the balance will go up.`}
          onConfirm={handleDeletePayment} onCancel={() => setPaymentToDelete(null)} />
      )}
    </>
  )
}
