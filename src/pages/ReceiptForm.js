import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import Field from "../components/Field";
import Icon from "../components/Icon";
import {
  PAYMENT_METHODS,
  calcLineTotal,
  calcTotals,
  formatCurrency,
  todayString,
} from "../utils/calc";

let itemCounter = 0;
function newItem() {
  itemCounter += 1;
  return {
    id: `new-item-${Date.now()}-${itemCounter}`,
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

export default function ReceiptForm() {
  const navigate = useNavigate();
  const { receipts, clients, saveReceipt, getNextReceiptNumber, showToast } =
    useData();
  const { currency, formatMoney } = useCurrency();

  // The whole form lives in ONE state object (numbers are text until we save)
  const [form, setForm] = useState(() => ({
    number: getNextReceiptNumber(),
    date: todayString(),
    clientId: "", // optional: a saved client
    customerName: "", // required: filled automatically when a client is picked, or typed
    customerEmail: "",
    method: PAYMENT_METHODS[0],
    items: [newItem()],
    discount: "0",
    tax: "0",
    notes: "",
  }));
  const [errors, setErrors] = useState({ items: {} });
  const [saving, setSaving] = useState(false);

  const totals = calcTotals(form);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  // Picking a saved client copies their name and email into the form.
  // Choosing "No saved client" keeps whatever name is typed.
  function handleClientChange(event) {
    const clientId = event.target.value;
    const client = clients.find((item) => item.id === clientId);
    setForm({
      ...form,
      clientId,
      customerName: client ? client.name : form.customerName,
      customerEmail: client ? client.email : form.customerEmail,
    });
  }

  function handleItemChange(itemId, field, value) {
    setForm({
      ...form,
      items: form.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    });
  }

  function addItem() {
    setForm({ ...form, items: [...form.items, newItem()] });
  }

  function removeItem(itemId) {
    setForm({
      ...form,
      items: form.items.filter((item) => item.id !== itemId),
    });
  }

  function validate() {
    const newErrors = { items: {} };

    if (!form.number.trim()) newErrors.number = "Enter a receipt number.";
    else if (
      receipts.some(
        (receipt) =>
          receipt.number.toLowerCase() === form.number.trim().toLowerCase()
      )
    ) {
      newErrors.number =
        "This receipt number is already used. Choose a different one.";
    }
    if (!form.date) newErrors.date = "Choose the date of the sale.";
    if (!form.customerName.trim())
      newErrors.customerName =
        "Enter the customer name or pick a saved client.";
    if (
      form.customerEmail.trim() &&
      !/^\S+@\S+\.\S+$/.test(form.customerEmail.trim())
    ) {
      newErrors.customerEmail = "Enter a valid email, like name@example.com.";
    }

    form.items.forEach((item) => {
      const itemErrors = {};
      if (!item.description.trim())
        itemErrors.description = "Describe the item.";
      if (!(Number(item.quantity) > 0))
        itemErrors.quantity = "Must be more than 0.";
      if (item.unitPrice === "" || Number(item.unitPrice) < 0)
        itemErrors.unitPrice = "Enter a price (0 or more).";
      if (Object.keys(itemErrors).length > 0)
        newErrors.items[item.id] = itemErrors;
    });
    if (form.items.length === 0)
      newErrors.itemsGeneral = "Add at least one line item.";

    const discount = Number(form.discount);
    if (form.discount === "" || discount < 0 || discount > 100)
      newErrors.discount = "Enter 0 to 100.";
    const tax = Number(form.tax);
    if (form.tax === "" || tax < 0 || tax > 100)
      newErrors.tax = "Enter 0 to 100.";

    if (totals.total <= 0) newErrors.total = "The total must be more than 0.";

    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    const newErrors = validate();
    setErrors(newErrors);
    const hasErrors =
      Object.keys(newErrors.items).length > 0 ||
      Object.keys(newErrors).some((key) => key !== "items");
    if (hasErrors) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    const receiptToSave = {
      number: form.number.trim(),
      date: form.date,
      clientId: form.clientId || null,
      customerName: form.customerName.trim(),
      customerEmail: form.customerEmail.trim(),
      method: form.method,
      items: form.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      discount: Number(form.discount),
      tax: Number(form.tax),
      notes: form.notes.trim(),
    };

    setSaving(true);
    try {
      const savedId = await saveReceipt(receiptToSave);
      if (!savedId) return; // an error message was already shown
      showToast(`${receiptToSave.number} saved.`);
      navigate(`/receipts/${savedId}`);
    } catch (error) {
      console.error("Saving the receipt failed", error);
      showToast(`Could not save the receipt. ${error.message}`, "error");
    } finally {
      setSaving(false);
    }
  }

  const itemErrors = errors.items || {};

  return (
    <>
      <div className="page-header">
        <div>
          <Link to="/receipts" className="back-link">
            <Icon name="arrowLeft" size={16} /> Back
          </Link>
          <h1>Create receipt</h1>
        </div>
      </div>

      <form className="invoice-layout" onSubmit={handleSubmit} noValidate>
        <div className="invoice-main">
          <section className="card">
            <h2 className="card-title">Receipt details</h2>
            <div className="form-row">
              <Field label="Receipt number" id="number" error={errors.number}>
                <input
                  id="number"
                  name="number"
                  type="text"
                  value={form.number}
                  onChange={handleChange}
                  aria-invalid={!!errors.number}
                  aria-describedby={errors.number ? "number-error" : undefined}
                />
              </Field>
              <Field label="Date of sale" id="date" error={errors.date}>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  aria-invalid={!!errors.date}
                  aria-describedby={errors.date ? "date-error" : undefined}
                />
              </Field>
            </div>
            <div className="form-row">
              <Field label="Saved client (optional)" id="clientId">
                <select
                  id="clientId"
                  name="clientId"
                  value={form.clientId}
                  onChange={handleClientChange}
                >
                  <option value="">No saved client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Payment method" id="method">
                <select
                  id="method"
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
            <div className="form-row">
              <Field
                label="Customer name"
                id="customerName"
                error={errors.customerName}
              >
                <input
                  id="customerName"
                  name="customerName"
                  type="text"
                  value={form.customerName}
                  onChange={handleChange}
                  aria-invalid={!!errors.customerName}
                  aria-describedby={
                    errors.customerName ? "customerName-error" : undefined
                  }
                />
              </Field>
              <Field
                label="Customer email (optional)"
                id="customerEmail"
                error={errors.customerEmail}
              >
                <input
                  id="customerEmail"
                  name="customerEmail"
                  type="email"
                  value={form.customerEmail}
                  onChange={handleChange}
                  aria-invalid={!!errors.customerEmail}
                  aria-describedby={
                    errors.customerEmail ? "customerEmail-error" : undefined
                  }
                />
              </Field>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Items sold</h2>
            {errors.itemsGeneral && (
              <p className="field-error" role="alert">
                {errors.itemsGeneral}
              </p>
            )}

            <div className="line-items">
              {form.items.map((item, index) => {
                const rowErrors = itemErrors[item.id] || {};
                return (
                  <div className="line-item" key={item.id}>
                    <Field
                      label="Description"
                      id={`desc-${item.id}`}
                      error={rowErrors.description}
                      className="li-desc"
                    >
                      <input
                        id={`desc-${item.id}`}
                        type="text"
                        value={item.description}
                        placeholder="e.g. Logo design"
                        onChange={(event) =>
                          handleItemChange(
                            item.id,
                            "description",
                            event.target.value
                          )
                        }
                        aria-invalid={!!rowErrors.description}
                        aria-describedby={
                          rowErrors.description
                            ? `desc-${item.id}-error`
                            : undefined
                        }
                      />
                    </Field>
                    <Field
                      label="Qty"
                      id={`qty-${item.id}`}
                      error={rowErrors.quantity}
                      className="li-qty"
                    >
                      <input
                        id={`qty-${item.id}`}
                        type="number"
                        min="0"
                        step="any"
                        inputMode="decimal"
                        value={item.quantity}
                        onChange={(event) =>
                          handleItemChange(
                            item.id,
                            "quantity",
                            event.target.value
                          )
                        }
                        aria-invalid={!!rowErrors.quantity}
                        aria-describedby={
                          rowErrors.quantity
                            ? `qty-${item.id}-error`
                            : undefined
                        }
                      />
                    </Field>
                    <Field
                      label="Unit price (USD)"
                      id={`price-${item.id}`}
                      error={rowErrors.unitPrice}
                      className="li-price"
                    >
                      <input
                        id={`price-${item.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={item.unitPrice}
                        onChange={(event) =>
                          handleItemChange(
                            item.id,
                            "unitPrice",
                            event.target.value
                          )
                        }
                        aria-invalid={!!rowErrors.unitPrice}
                        aria-describedby={
                          rowErrors.unitPrice
                            ? `price-${item.id}-error`
                            : undefined
                        }
                      />
                    </Field>
                    <div className="li-total">
                      <span className="li-total-label">Line total</span>
                      <strong>{formatCurrency(calcLineTotal(item))}</strong>
                    </div>
                    <button
                      type="button"
                      className="icon-button icon-danger li-remove"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove item ${index + 1}`}
                      disabled={form.items.length === 1}
                      title={
                        form.items.length === 1
                          ? "A receipt needs at least one item"
                          : "Remove item"
                      }
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addItem}
            >
              <Icon name="plus" size={16} /> Add item
            </button>
          </section>

          <section className="card">
            <h2 className="card-title">Notes</h2>
            <Field label="Notes (shown on the receipt)" id="notes">
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={form.notes}
                onChange={handleChange}
              />
            </Field>
          </section>
        </div>

        <aside className="invoice-side">
          <div className="card summary-card">
            <h2 className="card-title">Summary</h2>
            <div className="form-row">
              <Field label="Discount (%)" id="discount" error={errors.discount}>
                <input
                  id="discount"
                  name="discount"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  inputMode="decimal"
                  value={form.discount}
                  onChange={handleChange}
                  aria-invalid={!!errors.discount}
                  aria-describedby={
                    errors.discount ? "discount-error" : undefined
                  }
                />
              </Field>
              <Field label="Tax (%)" id="tax" error={errors.tax}>
                <input
                  id="tax"
                  name="tax"
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  inputMode="decimal"
                  value={form.tax}
                  onChange={handleChange}
                  aria-invalid={!!errors.tax}
                  aria-describedby={errors.tax ? "tax-error" : undefined}
                />
              </Field>
            </div>

            <dl className="totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{formatCurrency(totals.subtotal)}</dd>
              </div>
              <div>
                <dt>Discount</dt>
                <dd>-{formatCurrency(totals.discountAmount)}</dd>
              </div>
              <div>
                <dt>Tax</dt>
                <dd>{formatCurrency(totals.taxAmount)}</dd>
              </div>
              <div className="grand">
                <dt>Total paid</dt>
                <dd>{formatCurrency(totals.total)}</dd>
              </div>
            </dl>
            {currency !== "USD" && (
              <p className="field-hint">
                About {formatMoney(totals.total)} in {currency}. Amounts are
                entered and saved in USD.
              </p>
            )}
            {errors.total && (
              <p className="field-error" role="alert">
                {errors.total}
              </p>
            )}

            <div className="summary-actions">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Receipt"}
              </button>
              <p className="field-hint">
                A saved receipt cannot be edited. If you make a mistake, delete
                it and create a new one.
              </p>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
