import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim()) return setError("Enter your email address.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      return setError("Enter a valid email, like name@example.com.");

    setSubmitting(true);
    const { error: resetError } = await resetPassword(email.trim());
    setSubmitting(false);

    if (resetError) return setError(resetError.message);
    setSent(true);
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-brand">BillFlow</h1>
        <h2 className="auth-title">Reset your password</h2>

        {sent ? (
          <>
            {/* The same message is shown whether or not the email has an account, so nobody can use this page to find out who is registered */}
            <p className="form-message form-message-info" role="status">
              If an account exists for {email.trim()}, we have sent a link to
              reset the password. Check your inbox and your spam folder.
            </p>
            <p className="auth-switch">
              <Link to="/login" className="text-link">
                Back to log in
              </Link>
            </p>
          </>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 16 }}>
              Enter your email and we will send you a link to choose a new
              password.
            </p>
            <form onSubmit={handleSubmit} noValidate>
              <Field label="Email" id="reset-email" error={error}>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? "reset-email-error" : undefined}
                />
              </Field>
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
            <p className="auth-switch">
              <Link to="/login" className="text-link">
                Back to log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
