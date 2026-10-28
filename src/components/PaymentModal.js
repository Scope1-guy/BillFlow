import { useState } from "react";
import Modal from "./Modal";
import Field from "./Field";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  PAYMENT_METHODS,
  formatCurrency,
  round2,
  todayString,
} from "../utils/calc";

// Dialog for recording a payment against one invoice.
// This only RECORDS a payment. It does not move any real money.
export default function PaymentModal({ invoice, balance, onClose }) {
  const { addPayment, showToast } = useData();
  const { currency, formatMoney } = useCurrency();

  // One state object for the whole form. Inputs always store text, so amount is a string.
  const [form, setForm] = useState({
    amount: String(balance),
    date: todayString(),
    method: PAYMENT_METHODS[0],
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Updates ONE field and keeps the others: { ...form, [name]: value }
  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  function validate() {
    const newErrors = {};
    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      newErrors.amount = "Enter an amount greater than 0.";
    } else if (round2(amount) > balance) {
      // Overpayment policy: not allowed. The payment can never be more than what is still owed.
      newErrors.amount = `The most you can record is ${formatCurrency(
        balance
      )} (the outstanding balance).`;
    }
    if (!form.date)
      newErrors.date = "Choose the date the payment was received.";
    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return; // stops a double click from recording the payment twice
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    const ok = await addPayment({
      invoiceId: invoice.id,
      amount: round2(form.amount),
      date: form.date,
      method: form.method,
      note: form.note.trim(),
    });
    setSaving(false);
    if (!ok) return; // an error message was already shown

    showToast(
      `Payment of ${formatCurrency(round2(form.amount))} recorded for ${
        invoice.number
      }.`
    );
    onClose();
  }

  return (
    <Modal title={`Record payment - ${invoice.number}`} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <p className="modal-note">
          Outstanding balance: <strong>{formatCurrency(balance)}</strong>
          {currency !== "USD" && <> (about {formatMoney(balance)})</>}
        </p>

        <Field label="Amount (USD)" id="pay-amount" error={errors.amount}>
          <input
            id="pay-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={form.amount}
            onChange={handleChange}
            aria-invalid={!!errors.amount}
            aria-describedby={errors.amount ? "pay-amount-error" : undefined}
          />
        </Field>

        <div className="form-row">
          <Field label="Payment date" id="pay-date" error={errors.date}>
            <input
              id="pay-date"
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? "pay-date-error" : undefined}
            />
          </Field>
          <Field label="Payment method" id="pay-method">
            <select
              id="pay-method"
              name="method"
              value={form.method}
              onChange={handleChange}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Note (optional)" id="pay-note">
          <input
            id="pay-note"
            name="note"
            type="text"
            value={form.note}
            onChange={handleChange}
            placeholder="e.g. Deposit"
          />
        </Field>

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Record payment"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
