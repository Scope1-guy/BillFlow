import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDisplayName } from "../utils/displayName";
import Icon from "./Icon";
import Toast from "./Toast";
import { useData } from "../context/DataContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/clients", label: "Clients", icon: "clients" },
  { to: "/invoices", label: "Invoices", icon: "invoices" },
  { to: "/payments", label: "Payments", icon: "payments" },
  { to: "/settings", label: "Settings", icon: "settings" },
  { to: "/receipts", label: "Receipts", icon: "receipt" },
];

function Logo() {
  return (
    <span className="logo">
      <span className="logo-mark" aria-hidden="true">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#fff"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M7 20V4h7a4 4 0 0 1 0 8H7M7 12h8a4 4 0 0 1 0 8H7" />
        </svg>
      </span>
      <span className="logo-text">BillFlow</span>
    </span>
  );
}

// The shell shared by every page: sidebar (desktop), drawer (mobile), top bar.
export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { dataLoading, dataError, reloadData } = useData();
  const displayName = getDisplayName(user);

  // useEffect: close the mobile drawer whenever the page (URL) changes
  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // useEffect: let the Escape key close the drawer
  useEffect(() => {
    if (!menuOpen) return undefined;
    function handleKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [menuOpen]);

  function handleSearch(event) {
    event.preventDefault();
    // Send the search text to the invoices page as ?q=...
    navigate(`/invoices?q=${encodeURIComponent(searchText.trim())}`);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/login");
  }

  return (
    <div className="app-shell">
      {menuOpen && (
        <div className="sidebar-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      <aside
        className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}
        aria-label="Main navigation"
      >
        <div className="sidebar-header">
          <Logo />
          <button
            type="button"
            className="icon-button sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{displayName.charAt(0)}</span>
            <span className="user-email">
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-block sign-out"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="icon-button menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            <Icon name="menu" />
          </button>
          <span className="topbar-logo">
            <Logo />
          </span>

          <form className="topbar-search" onSubmit={handleSearch} role="search">
            <Icon name="search" size={16} />
            <input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search invoices..."
              aria-label="Quick invoice search"
            />
          </form>
        </header>

        <main className="page">
          {dataLoading ? (
            <p className="auth-loading">Loading your data...</p>
          ) : dataError ? (
            <div className="card">
              <h2 className="card-title">We could not load your data</h2>
              <p className="muted">{dataError}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={reloadData}
              >
                Try again
              </button>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      <Toast />
    </div>
  );
}
