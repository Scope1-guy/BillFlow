import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wraps pages that need a login. Not logged in? Send them to /login.
export default function ProtectedRoute() {
  const { session, loading } = useAuth();

  if (loading) return <p className="auth-loading">Loading...</p>;
  if (!session) return <Navigate to="/login" replace />;
  return <Outlet />;
}
