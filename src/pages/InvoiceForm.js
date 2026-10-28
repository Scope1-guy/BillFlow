import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import Field from "../components/Field";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import {
  addDays,
  calcLineTotal,
  calcTotals,
  formatCurrency,
  getAmountPaid,
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

// One page handles BOTH creating (/invoices/new) and editing (/invoices/:id/edit).
export default function InvoiceForm() {
  const { invoiceId } = useParams();
  const isEditing = Boolean(invoiceId);
  const navigate = useNavigate();
  const {
    invoices,
    clients,
    payments,
    saveInvoice,
    getNextInvoiceNumber,
    showToast,
  } = useData();
  const { currency, formatMoney } = useCurrency();

  const existing = invoices.find((invoice) => invoice.id === invoiceId);
  const amountAlreadyPaid = existing ? getAmountPaid(existing.id, payments) : 0;

  // The whole form lives in ONE state object. Inputs give us text, so numbers are kept as strings
  // here and converted with Number() only when we calculate or save.
  const [form, setForm] = useState(() => {
    if (existing) {
      // Copy the items too, so editing the form never changes the saved invoice by accident
      return {
        ...existing,
        items: existing.items.map((item) => ({ ...item })),
      };
    }
    return {
      number: getNextInvoiceNumber(),
      clientId: "",
      issueDate: todayString(),
      dueDate: addDays(30),
      items: [newItem()],
      discount: "0",
      tax: "0",
      notes: "",
      terms: "Payment due within 30 days of the issue date.",
    };
  });
  const [errors, setErrors] = useState({ items: {} });
  const [saving, setSaving] = useState(false);

  if (isEditing && !existing) {
    return (
      <div className="card">
        <EmptyState
          title="Invoice not found"
          message="It may have been deleted."
          action={
            <Link to="/invoices" className="btn btn-primary">
              Back to invoices
            </Link>
          }
        />
      </div>
    );
  }

  // Totals are DERIVED from the form on every render, so they are always up to date
  const totals = calcTotals(form);

  // For simple fields: copy the typed value into state under the input's `name`
  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  // Line items are an array inside the form object. To change one item we:
  // 1) map over the array, 2) return a COPY of the matching item with the change, 3) keep the rest.
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

    if (!form.number.trim()) {
      newErrors.number = "Enter an invoice number.";
    } else if (
      invoices.some(
        (invoice) =>
          invoice.id !== form.id &&
          invoice.number.toLowerCase() === form.number.trim().toLowerCase()
      )
    ) {
      newErrors.number =
        "This invoice number is already used. Choose a different one.";
    }

    if (!form.clientId) newErrors.clientId = "Select a client.";
    if (!form.issueDate) newErrors.issueDate = "Choose an issue date.";
    if (!form.dueDate) newErrors.dueDate = "Choose a due date.";
    else if (form.issueDate && form.dueDate < form.issueDate)
      newErrors.dueDate = "The due date cannot be before the issue date.";

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

    // Editing must never make the total smaller than what the client already paid
    if (amountAlreadyPaid > 0 && totals.total < amountAlreadyPaid) {
      newErrors.total = `The total cannot be lower than the ${formatCurrency(
        amountAlreadyPaid
      )} already paid.`;
    }

    return newErrors;
  }

  // `saveAs` is "draft" (Save Draft) or "sent" (Save Invoice)
  async function handleSave(saveAs) {
    if (saving) return; // ignore extra clicks while a save is in progress

    const newErrors = validate();
    setErrors(newErrors);
    const hasErrors =
      Object.keys(newErrors.items).length > 0 ||
      Object.keys(newErrors).some((key) => key !== "items");
    if (hasErrors) {
      showToast("Please fix the highlighted fields.", "error");
      return;
    }

    // Build the clean object we save: trimmed text and real numbers instead of strings
    const invoiceToSave = {
      ...form,
      number: form.number.trim(),
      items: form.items.map((item) => ({
        id: item.id,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      discount: Number(form.discount),
      tax: Number(form.tax),
      notes: form.notes.trim(),
      terms: form.terms.trim(),
      saved: saveAs,
    };

    setSaving(true);
    try {
      // saveInvoice talks to Supabase. It returns the invoice id, or null if saving failed
      // (in that case it has already shown a red error message).
      const savedId = await saveInvoice(invoiceToSave);
      if (!savedId) return;

      showToast(
        saveAs === "draft"
          ? `${invoiceToSave.number} saved as a draft.`
          : `${invoiceToSave.number} saved.`
      );
      navigate(`/invoices/${savedId}`);
    } catch (error) {
      console.error("Saving the invoice failed", error);
      showToast(`Could not save the invoice. ${error.message}`, "error");
    } finally {
      // Runs whether the save worked or not, so the buttons never stay stuck on "Saving..."
      setSaving(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    handleSave("sent");
  }

  const itemErrors = errors.items || {};
  const cannotSaveDraft = amountAlreadyPaid > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <Link
            to={isEditing ? `/invoices/${existing.id}` : "/invoices"}
            className="back-link"
          >
            <Icon name="arrowLeft" size={16} /> Back
          </Link>
          <h1>{isEditing ? `Edit ${existing.number}` : "Create invoice"}</h1>
        </div>
      </div>

      <form className="invoice-layout" onSubmit={handleSubmit} noValidate>
        <div className="invoice-main">
          <section className="card">
            <h2 className="card-title">Invoice details</h2>
            <div className="form-row">
              <Field label="Invoice number" id="number" error={errors.number}>
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
              <Field
                label="Client"
                id="clientId"
                error={errors.clientId}
                hint={
                  clients.length === 0
                    ? "Add a client on the Clients page first."
                    : undefined
                }
              >
                <select
                  id="clientId"
                  name="clientId"
                  value={form.clientId}
                  onChange={handleChange}
                  aria-invalid={!!errors.clientId}
                  aria-describedby={
                    errors.clientId ? "clientId-error" : undefined
                  }
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="form-row">
              <Field label="Issue date" id="issueDate" error={errors.issueDate}>
                <input
                  id="issueDate"
                  name="issueDate"
                  type="date"
                  value={form.issueDate}
                  onChange={handleChange}
                  aria-invalid={!!errors.issueDate}
                  aria-describedby={
                    errors.issueDate ? "issueDate-error" : undefined
                  }
                />
              </Field>
              <Field label="Due date" id="dueDate" error={errors.dueDate}>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleChange}
                  aria-invalid={!!errors.dueDate}
                  aria-describedby={
                    errors.dueDate ? "dueDate-error" : undefined
                  }
                />
              </Field>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Line items</h2>
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
                        placeholder="e.g. Website design"
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
                      aria-label={`Remove line item ${index + 1}`}
                      disabled={form.items.length === 1}
                      title={
                        form.items.length === 1
                          ? "An invoice needs at least one item"
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
              <Icon name="plus" size={16} /> Add line item
            </button>
          </section>

          <section className="card">
            <h2 className="card-title">Notes and terms</h2>
            <Field label="Notes (shown to the client)" id="notes">
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={form.notes}
                onChange={handleChange}
              />
            </Field>
            <Field label="Payment terms" id="terms">
              <textarea
                id="terms"
                name="terms"
                rows="2"
                value={form.terms}
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
                <dt>Total</dt>
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
            {amountAlreadyPaid > 0 && (
              <p className="field-hint">
                Already paid: {formatCurrency(amountAlreadyPaid)}
              </p>
            )}

            <div className="summary-actions">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Invoice"}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={() => handleSave("draft")}
                disabled={cannotSaveDraft || saving}
                title={
                  cannotSaveDraft
                    ? "Invoices with payments cannot go back to draft"
                    : undefined
                }
              >
                Save Draft
              </button>
              {cannotSaveDraft && (
                <p className="field-hint">
                  Invoices with payments cannot go back to draft.
                </p>
              )}
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
