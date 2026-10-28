import { useState } from "react";
import Modal from "./Modal";
import Field from "./Field";
import { useData } from "../context/DataContext";

// Add or edit a client. If a `client` prop is passed we are EDITING, otherwise ADDING.
export default function ClientFormModal({ client, onClose }) {
  const { addClient, updateClient, showToast } = useData();
  const isEditing = Boolean(client);

  const [form, setForm] = useState({
    name: client ? client.name : "",
    email: client ? client.email : "",
    phone: client ? client.phone : "",
    address: client ? client.address : "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  function validate() {
    const newErrors = {};
    if (!form.name.trim())
      newErrors.name = "Enter the client or business name.";
    if (!form.email.trim()) newErrors.email = "Enter an email address.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email, like name@example.com.";
    if (form.phone.trim() && !/^[+\d\s()-]{7,}$/.test(form.phone.trim())) {
      newErrors.phone =
        "Use digits, spaces, + and - only (at least 7 characters).";
    }
    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return
  
    const cleaned = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
    }
  
    setSaving(true)
    const ok = isEditing ? await updateClient(client.id, cleaned) : await addClient(cleaned)
    setSaving(false)
    if (!ok) return // an error message was already shown
  
    showToast(isEditing ? `${cleaned.name} was updated.` : `${cleaned.name} was added.`)
    onClose()
  }

  return (
    <Modal title={isEditing ? "Edit client" : "Add client"} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <Field label="Name" id="client-name" error={errors.name}>
          <input
            id="client-name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "client-name-error" : undefined}
          />
        </Field>
        <div className="form-row">
          <Field label="Email" id="client-email" error={errors.email}>
            <input
              id="client-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "client-email-error" : undefined}
            />
          </Field>
          <Field label="Phone" id="client-phone" error={errors.phone}>
            <input
              id="client-phone"
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "client-phone-error" : undefined}
            />
          </Field>
        </div>
        <Field label="Business address" id="client-address">
          <textarea
            id="client-address"
            name="address"
            rows="2"
            value={form.address}
            onChange={handleChange}
          />
        </Field>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving' : isEditing ? "Save changes" : "Add client"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
