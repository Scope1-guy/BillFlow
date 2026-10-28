import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Field from "../components/Field";

export default function Login() {
  const { session, loading, signIn, signUp, signInWithGoogle } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' or 'signup'
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Already logged in? Go straight to the dashboard
  if (!loading && session) return <Navigate to="/" replace />;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  }

  function switchMode() {
    setMode(mode === "login" ? "signup" : "login");
    setErrors({});
    setMessage("");
  }

  function validate() {
    const newErrors = {};
    // Names are only needed when creating an account
    if (mode === "signup") {
      if (!form.firstName.trim())
        newErrors.firstName = "Enter your first name.";
      if (!form.lastName.trim()) newErrors.lastName = "Enter your last name.";
    }
    if (!form.email.trim()) newErrors.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim()))
      newErrors.email = "Enter a valid email, like name@example.com.";
    if (!form.password) newErrors.password = "Enter your password.";
    else if (mode === "signup" && form.password.length < 8)
      newErrors.password = "Use at least 8 characters.";
    return newErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);
    const email = form.email.trim();
    const result =
      mode === "login"
        ? await signIn(email, form.password)
        : await signUp(
            email,
            form.password,
            form.firstName.trim(),
            form.lastName.trim()
          );
    setSubmitting(false);

    if (result.error) {
      setErrors({ form: result.error.message });
      return;
    }

    // If email confirmation is ON there is no session yet: ask them to check their inbox.
    if (mode === "signup" && !result.data.session) {
      setMessage(
        "Account created. Check your email and click the confirmation link, then log in."
      );
      setMode("login");
    }
  }

  async function handleGoogle() {
    setErrors({});
    const { error } = await signInWithGoogle();
    if (error) setErrors({ form: error.message });
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-brand">BillFlow</h1>
        <h2 className="auth-title">
          {mode === "login" ? "Log in" : "Create your account"}
        </h2>

        {message && (
          <p className="form-message form-message-info" role="status">
            {message}
          </p>
        )}
        {errors.form && (
          <p className="form-message form-message-error" role="alert">
            {errors.form}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {mode === "signup" && (
            <div className="form-row">
              <Field
                label="First name"
                id="auth-first-name"
                error={errors.firstName}
              >
                <input
                  id="auth-first-name"
                  name="firstName"
                  type="text"
                  autoComplete="given-name"
                  value={form.firstName}
                  onChange={handleChange}
                  aria-invalid={!!errors.firstName}
                  aria-describedby={
                    errors.firstName ? "auth-first-name-error" : undefined
                  }
                />
              </Field>
              <Field
                label="Last name"
                id="auth-last-name"
                error={errors.lastName}
              >
                <input
                  id="auth-last-name"
                  name="lastName"
                  type="text"
                  autoComplete="family-name"
                  value={form.lastName}
                  onChange={handleChange}
                  aria-invalid={!!errors.lastName}
                  aria-describedby={
                    errors.lastName ? "auth-last-name-error" : undefined
                  }
                />
              </Field>
            </div>
          )}
          <Field label="Email" id="auth-email" error={errors.email}>
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "auth-email-error" : undefined}
            />
          </Field>
          <Field label="Password" id="auth-password" error={errors.password}>
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "auth-password-error" : undefined
              }
            />
          </Field>
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting}
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
              ? "Log in"
              : "Sign up"}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-block"
          onClick={handleGoogle}
        >
          Continue with Google
        </button>

        <p className="auth-switch">
          {mode === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button type="button" className="link-button" onClick={switchMode}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
