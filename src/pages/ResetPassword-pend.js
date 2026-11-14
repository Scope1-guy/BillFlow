import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

// The link in the email brings the person here already signed in for a moment,
// so they are allowed to choose a new password.
export default function ResetPassword() {
  const { session, loading, updatePassword } = useAuth();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const newErrors = {};
    if (form.password.length < 8)
      newErrors.password = "Use at least 8 characters.";
    if (form.confirm !== form.password)
      newErrors.confirm = "The two passwords do not match.";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const { error } = await updatePassword(form.password);
    setSubmitting(false);

    if (error) return setErrors({ form: error.message });
    setDone(true);
  }

  let content;
  if (loading) {
    content = <p className="muted">Checking your reset link...</p>;
  } else if (done) {
    content = (
      <>
        <p className="form-message form-message-info" role="status">
          Your password has been changed.
        </p>
        <Link to="/" className="btn btn-primary btn-block">
          Continue to DueSora
        </Link>
      </>
    );
  } else if (!session) {
    content = (
      <>
        <p className="form-message form-message-error" role="alert">
          This reset link is invalid or has expired.
        </p>
        <Link to="/forgot-password" className="btn btn-primary btn-block">
          Request a new link
        </Link>
      </>
    );
  } else {
    content = (
      <form onSubmit={handleSubmit} noValidate>
        {errors.form && (
          <p className="form-message form-message-error" role="alert">
            {errors.form}
          </p>
        )}
        <Field label="New password" id="new-password" error={errors.password}>
          <input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? "new-password-error" : undefined
            }
          />
        </Field>
        <Field
          label="Confirm new password"
          id="confirm-password"
          error={errors.confirm}
        >
          <input
            id="confirm-password"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={form.confirm}
            onChange={handleChange}
            aria-invalid={!!errors.confirm}
            aria-describedby={
              errors.confirm ? "confirm-password-error" : undefined
            }
          />
        </Field>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Change password"}
        </button>
      </form>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-brand">DueSora</h1>
        <h2 className="auth-title">Choose a new password</h2>
        {content}
      </div>
    </div>
  );
}
