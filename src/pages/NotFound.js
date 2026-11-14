import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="auth-page">
      <div className="card auth-card" style={{ textAlign: "center" }}>
        <h1 className="auth-brand">404</h1>
        <h2 className="auth-title">Page not found</h2>
        <p className="muted" style={{ marginBottom: 18 }}>
          The page you are looking for does not exist or has moved.
        </p>
        <Link to="/" className="btn btn-primary btn-block">
          Go to DueSora
        </Link>
      </div>
    </div>
  );
}
