// ---------- Money and date helpers + invoice calculations ----------
// Keeping all calculations in one file means every page uses the SAME formulas.

// Round to 2 decimals so values like 0.1 + 0.2 don't show as 0.30000000000000004
export function round2(number) {
  return Math.round((Number(number) + Number.EPSILON) * 100) / 100;
}

// export function formatCurrency(amount) {
//   // return new Intl.NumberFormat('en-US', {
//   //   style: 'currency',
//   //   currency: 'USD',
//   // }).format(Number(amount) || 0)
// }

// Some currencies look better with their home locale (Naira shows as "₦1,500.00")
const CURRENCY_LOCALES = { NGN: "en-NG", GHS: "en-GH", KES: "en-KE" };

// Formats a number as money. This does NOT convert anything.
export function formatCurrency(amount, currencyCode = "USD") {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode] || "en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(Number(amount) || 0);
}

// Short version for chart labels: $1.6K, ₦2.4M ...
export function formatCompactCurrency(amount, currencyCode = "USD") {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currencyCode] || "en-US", {
    style: "currency",
    currency: currencyCode,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(amount) || 0);
}

// Dates are stored as "YYYY-MM-DD" strings. That format can be compared with < and >.
export function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayString() {
  return toDateString(new Date());
}

// addDays(-10) = 10 days ago, addDays(30) = 30 days from today
export function addDays(days, fromDate = new Date()) {
  const copy = new Date(fromDate);
  copy.setDate(copy.getDate() + days);
  return toDateString(copy);
}

export function formatDate(dateString) {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ---------- Invoice totals ----------
// subtotal  = sum of (quantity x unit price)
// discount  = percentage taken off the subtotal
// tax       = percentage added AFTER the discount
// total     = subtotal - discount + tax
export function calcTotals(invoice) {
  const items = invoice.items || [];
  const subtotal = round2(
    items.reduce(
      (sum, item) =>
        sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
      0
    )
  );
  const discountAmount = round2(
    (subtotal * (Number(invoice.discount) || 0)) / 100
  );
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = round2((taxableAmount * (Number(invoice.tax) || 0)) / 100);
  const total = round2(taxableAmount + taxAmount);
  return { subtotal, discountAmount, taxAmount, total };
}

export function calcLineTotal(item) {
  return round2((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
}

// ---------- Payments and balances ----------
export function getAmountPaid(invoiceId, payments) {
  return round2(
    payments
      .filter((payment) => payment.invoiceId === invoiceId)
      .reduce((sum, payment) => sum + Number(payment.amount), 0)
  );
}

export function getBalance(invoice, payments) {
  const { total } = calcTotals(invoice);
  return round2(total - getAmountPaid(invoice.id, payments));
}

// The status is DERIVED from the data, so we never store it twice.
// The only thing we store is `saved` = "draft" or "sent".
// Order of the checks matters: the first match wins.
export function getInvoiceStatus(invoice, payments) {
  if (invoice.saved === "draft") return "Draft";

  const { total } = calcTotals(invoice);
  const paid = getAmountPaid(invoice.id, payments);
  const balance = round2(total - paid);

  if (balance <= 0) return "Paid";
  if (invoice.dueDate < todayString()) return "Overdue";
  if (paid > 0) return "Partially Paid";
  return "Sent";
}

export const STATUSES = ["Draft", "Sent", "Partially Paid", "Paid", "Overdue"];
export const PAYMENT_METHODS = [
  "Bank transfer",
  "Cash",
  "Card",
  "Cheque",
  "Other",
];
