import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { useCurrency } from '../context/CurrencyContext'
import StatusBadge from '../components/StatusBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import PaymentModal from '../components/PaymentModal'
import EmptyState from '../components/EmptyState'
import IssuerBlock from '../components/IssuerBlock'
import Icon from '../components/Icon'
import { calcLineTotal, calcTotals, formatCurrency, formatDate, getAmountPaid, getBalance, getInvoiceStatus } from '../utils/calc'

export default function InvoiceDetails() {
  const { invoiceId } = useParams()
  const navigate = useNavigate()
  const { invoices, payments, businessProfile, getClient, saveInvoice, deleteInvoice, deletePayment, showToast } = useData()
  const { currency, formatMoney } = useCurrency()

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
  const showPaymentDetails = businessProfile && businessProfile.paymentDetails && balance > 0 && !isDraft

  // A draft becomes "sent"
  async function markAsSent() {
    const savedId = await saveInvoice({ ...invoice, saved: 'sent' })
    if (savedId) showToast(`${invoice.number} marked as sent.`)
  }

  async function handleDeleteInvoice() {
    const ok = await deleteInvoice(invoice.id)
    if (!ok) return
    showToast(`${invoice.number} was deleted.`)
    navigate('/invoices')
  }

  async function handleDeletePayment() {
    const ok = await deletePayment(paymentToDelete.id)
    if (ok) showToast('Payment removed.')
    setPaymentToDelete(null)
  }

  return (
    <>
      {/* Everything marked "no-print" is hidden when printing */}
      <div className="page-header no-print">
        <div>
          <Link to="/invoices" className="back-link"><Icon name="arrowLeft" size={16} /> Back to invoices</Link>
          <h1 className="title-with-badge">{invoice.number} <StatusBadge status={status} /></h1>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>Print / Save as PDF</button>
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
            <div className="receipt-head">
              <div>
                <h2 className="receipt-title">INVOICE</h2>
                <p className="muted">{invoice.number}</p>
              </div>
              <StatusBadge status={status} />
            </div>

            <div className="detail-meta">
              <IssuerBlock title="From" />
              <div>
                <h3 className="meta-title">Billed to</h3>
                {client ? (
                  <address>
                    <strong>{client.name}</strong><br />
                    {client.email}<br />
                    {client.phone && <>{client.phone}<br /></>}
                    <span className="pre-line">{client.address}</span>
                  </address>
                ) : <p className="muted">Client no longer exists.</p>}
              </div>
            </div>

            <dl className="meta-list receipt-facts">
              <div><dt>Issued</dt><dd>{formatDate(invoice.issueDate)}</dd></div>
              <div><dt>Due</dt><dd>{formatDate(invoice.dueDate)}</dd></div>
            </dl>

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
                      <td data-label="Unit price" className="num">{formatCurrency(item.unitPrice)}</td>
                      <td data-label="Amount" className="num">{formatCurrency(calcLineTotal(item))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="totals totals-right">
              <div><dt>Subtotal</dt><dd>{formatCurrency(totals.subtotal)}</dd></div>
              {invoice.discount > 0 && <div><dt>Discount ({invoice.discount}%)</dt><dd>-{formatCurrency(totals.discountAmount)}</dd></div>}
              {invoice.tax > 0 && <div><dt>Tax ({invoice.tax}%)</dt><dd>{formatCurrency(totals.taxAmount)}</dd></div>}
              <div className="grand"><dt>Total</dt><dd>{formatCurrency(totals.total)}</dd></div>
              <div><dt>Amount paid</dt><dd className="positive">{formatCurrency(amountPaid)}</dd></div>
              <div className="grand"><dt>Balance due</dt><dd>{formatCurrency(balance)}</dd></div>
            </dl>

            {showPaymentDetails && (
              <>
                <h3 className="meta-title">How to pay</h3>
                <p className="pre-line">{businessProfile.paymentDetails}</p>
              </>
            )}

            {invoice.notes && (<><h3 className="meta-title">Notes</h3><p className="pre-line">{invoice.notes}</p></>)}
            {invoice.terms && (<><h3 className="meta-title">Payment terms</h3><p className="pre-line">{invoice.terms}</p></>)}

            {currency !== 'USD' && (
              <p className="field-hint no-print">
                Amounts are shown in USD, the currency this invoice was saved in. The balance is about {formatMoney(balance)} in {currency} at today's rate.
              </p>
            )}
          </section>
        </div>

        <aside className="details-side no-print">
          <section className="card">
            <h2 className="card-title">Payment history</h2>
            {invoicePayments.length === 0 ? (
              <p className="muted">No payments recorded yet.</p>
            ) : (
              <ul className="activity-list">
                {invoicePayments.map((payment) => (
                  <li key={payment.id}>
                    <div>
                      <strong className="positive">{formatCurrency(payment.amount)}</strong>
                      <span className="muted">{formatDate(payment.date)} - {payment.method}</span>
                      {payment.note && <span className="muted">{payment.note}</span>}
                    </div>
                    <button type="button" className="icon-button icon-danger" onClick={() => setPaymentToDelete(payment)} aria-label={`Remove payment of ${formatCurrency(payment.amount)}`}>
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
          message={`The ${formatCurrency(paymentToDelete.amount)} payment from ${formatDate(paymentToDelete.date)} will be removed and the balance will go up.`}
          onConfirm={handleDeletePayment} onCancel={() => setPaymentToDelete(null)} />
      )}
    </>
  )
}