import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import {
  DUE_SOON_DAYS,
  describeReminder,
  getReminders,
} from "../utils/reminders";

// The banner at the top of the dashboard. It only appears when someone owes you.
export default function ReminderBanner() {
  const { invoices, payments, getClient } = useData();
  const { formatMoney } = useCurrency();
  const reminders = getReminders(invoices, payments, getClient);

  if (reminders.count === 0) return null;

  const overdueCount = reminders.overdue.length;
  const soonCount = reminders.dueSoon.length;
  const topOverdue = reminders.overdue.slice(0, 3);

  const headline =
    overdueCount > 0
      ? `You are owed ${formatMoney(
          reminders.overdueTotal
        )} on ${overdueCount} overdue invoice${overdueCount === 1 ? "" : "s"}`
      : `${soonCount} invoice${
          soonCount === 1 ? " is" : "s are"
        } due within ${DUE_SOON_DAYS} days (${formatMoney(
          reminders.dueSoonTotal
        )})`;

  return (
    <section
      className={`reminder-banner ${overdueCount > 0 ? "" : "soon"}`}
      aria-label="Payments to collect"
    >
      <div>
        <strong>{headline}</strong>
        {topOverdue.length > 0 && (
          <p>
            {topOverdue
              .map(
                (item) =>
                  `${item.clientName} (${describeReminder(
                    "overdue",
                    item.days
                  )})`
              )
              .join(", ")}
            {overdueCount > 3 ? ` and ${overdueCount - 3} more` : ""}
          </p>
        )}
        {overdueCount > 0 && soonCount > 0 && (
          <p>
            {soonCount} more due within {DUE_SOON_DAYS} days (
            {formatMoney(reminders.dueSoonTotal)}).
          </p>
        )}
      </div>
      <Link to="/invoices" className="btn btn-secondary">
        Review invoices
      </Link>
    </section>
  );
}
