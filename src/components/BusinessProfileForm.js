import { useState } from "react";
import { useData } from "../context/DataContext";
import Field from "./Field";

export default function BusinessProfileForm() {
  const { businessProfile, saveBusinessProfile, showToast } = useData();

  const [form, setForm] = useState({
    name: businessProfile ? businessProfile.name : "",
    email: businessProfile ? businessProfile.email : "",
    phone: businessProfile ? businessProfile.phone : "",
    address: businessProfile ? businessProfile.address : "",
    taxId: businessProfile ? businessProfile.taxId : "",
    paymentDetails: businessProfile ? businessProfile.paymentDetails : "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Enter your business or full name.";
    else if (form.name.trim().length > 120)
      newErrors.name = "Use 120 characters or fewer.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email, like name@example.com.";
    if (form.address.trim().length > 500)
      newErrors.address = "Use 500 characters or fewer.";
    if (form.paymentDetails.trim().length > 1000)
      newErrors.paymentDetails = "Use 1000 characters or fewer.";
    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSaving(true);
    const ok = await saveBusinessProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      taxId: form.taxId.trim(),
      paymentDetails: form.paymentDetails.trim(),
    });
    setSaving(false);
    if (ok) showToast("Business details saved.");
  }

  return (
    <section className="card settings-card">
      <h2 className="card-title">Business details</h2>
      <p className="muted">
        These details appear at the top of your invoices and receipts.
      </p>

      <form className="settings-form" onSubmit={handleSubmit} noValidate>
        <Field label="Business or full name" id="biz-name" error={errors.name}>
          <input
            id="biz-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "biz-name-error" : undefined}
          />
        </Field>
        <div className="form-row">
          <Field
            label="Business email (optional)"
            id="biz-email"
            error={errors.email}
          >
            <input
              id="biz-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "biz-email-error" : undefined}
            />
          </Field>
          <Field label="Phone (optional)" id="biz-phone">
            <input
              id="biz-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
            />
          </Field>
        </div>
        <Field
          label="Address (optional)"
          id="biz-address"
          error={errors.address}
        >
          <textarea
            id="biz-address"
            name="address"
            rows="3"
            value={form.address}
            onChange={handleChange}
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "biz-address-error" : undefined}
          />
        </Field>
        <Field label="Tax ID or VAT number (optional)" id="biz-tax">
          <input
            id="biz-tax"
            name="taxId"
            type="text"
            value={form.taxId}
            onChange={handleChange}
          />
        </Field>
        <Field
          label="Payment details for invoices (optional)"
          id="biz-payment"
          error={errors.paymentDetails}
          hint="For example your bank name, account name and account number. They are printed on unpaid invoices. Never enter card numbers or passwords."
        >
          <textarea
            id="biz-payment"
            name="paymentDetails"
            rows="3"
            value={form.paymentDetails}
            onChange={handleChange}
            aria-invalid={!!errors.paymentDetails}
            aria-describedby={
              errors.paymentDetails ? "biz-payment-error" : undefined
            }
          />
        </Field>
        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save business details"}
          </button>
        </div>
      </form>
    </section>
  );
}
