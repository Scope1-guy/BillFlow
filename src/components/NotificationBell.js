import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import Icon from "./Icon";
import { describeReminder, getReminders } from "../utils/reminders";

export default function NotificationBell() {
  const { invoices, payments, getClient } = useData();
  const { formatMoney } = useCurrency();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  // useEffect: while the list is open, close it on an outside click or the Escape key
  useEffect(() => {
    if (!open) return undefined;
    function handleClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target))
        setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  // Calculated on every render, so the list is always up to date
  const reminders = getReminders(invoices, payments, getClient);
  const items = [
    ...reminders.overdue.map((item) => ({ ...item, kind: "overdue" })),
    ...reminders.dueSoon.map((item) => ({ ...item, kind: "soon" })),
  ];

  return (
    <div className="bell-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className="icon-button bell-button"
        onClick={() => setOpen(!open)}
        aria-label={`Payment reminders, ${reminders.count} need attention`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="bell" />
        {reminders.count > 0 && (
          <span className="bell-badge">{reminders.count}</span>
        )}
      </button>

      {open && (
        <div
          className="bell-panel"
          role="dialog"
          aria-label="Payment reminders"
        >
          <h2>Payment reminders</h2>
          {items.length === 0 ? (
            <p className="muted">
              All caught up. Nobody is overdue or due soon.
            </p>
          ) : (
            <ul className="bell-list">
              {items.map((item) => (
                <li key={item.invoice.id}>
                  <Link
                    to={`/invoices/${item.invoice.id}`}
                    onClick={() => setOpen(false)}
                  >
                    <span className="bell-name">
                      <strong>{item.clientName}</strong>{" "}
                      <span className="muted">{item.invoice.number}</span>
                    </span>
                    <strong className="bell-amount">
                      {formatMoney(item.balance)}
                    </strong>
                    <span
                      className={`bell-when ${
                        item.kind === "overdue" ? "danger" : "warn"
                      }`}
                    >
                      {describeReminder(item.kind, item.days)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
