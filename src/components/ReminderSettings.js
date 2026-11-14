import { useState } from "react";
import { useData } from "../context/DataContext";
import { DUE_SOON_DAYS, showReminderNotification } from "../utils/reminders";

// A card for the Settings page: switch phone or browser notifications on
export default function ReminderSettings() {
  const { showToast } = useData();
  const supported = typeof window !== "undefined" && "Notification" in window;
  const [permission, setPermission] = useState(
    supported ? Notification.permission : "unsupported"
  );

  async function handleEnable() {
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") showToast("Reminders are on.");
  }

  async function handleTest() {
    const shown = await showReminderNotification(
      "BillFlow: test reminder",
      "This is how your payment reminders will look."
    );
    if (!shown) showToast("Could not show a test reminder.", "error");
  }

  return (
    <section className="card settings-card">
      <h2 className="card-title">Payment reminders</h2>
      <p className="muted">
        When you open BillFlow, you get a reminder if someone is overdue or a
        payment is due within {DUE_SOON_DAYS} days. The bell icon at the top
        always shows the current list.
      </p>

      {permission === "unsupported" && (
        <p className="field-hint">
          This browser can't show notifications. On an iPhone, add BillFlow to
          your Home Screen first and open it from there.
        </p>
      )}
      {permission === "default" && (
        <div className="settings-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEnable}
          >
            Turn on notifications
          </button>
        </div>
      )}
      {permission === "granted" && (
        <>
          <p className="positive">Notifications are on.</p>
          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleTest}
            >
              Send a test
            </button>
          </div>
        </>
      )}
      {permission === "denied" && (
        <p className="field-error">
          Notifications are blocked. Allow them for this site in your browser's
          site settings, then come back here.
        </p>
      )}
    </section>
  );
}
