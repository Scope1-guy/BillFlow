// Colored pill for an invoice status. "Partially Paid" becomes the CSS class "partially-paid".
export default function StatusBadge({ status }) {
  const className = status.toLowerCase().replace(' ', '-')
  return <span className={`badge badge-${className}`}>{status}</span>
}
