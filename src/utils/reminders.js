import {
  addDays,
  getBalance,
  getInvoiceStatus,
  round2,
  todayString,
} from "./calc";

// An invoice counts as "due soon" when it falls due within this many days
export const DUE_SOON_DAYS = 3;
const LAST_SHOWN_KEY = "DueSora-reminder-last-shown";

// Whole days from one "YYYY-MM-DD" date to another (positive when `to` is later)
function daysBetween(from, to) {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const milliseconds =
    new Date(toYear, toMonth - 1, toDay) -
    new Date(fromYear, fromMonth - 1, fromDay);
  return Math.round(milliseconds / 86400000);
}

// Works out who owes you money: overdue invoices and invoices due in the next few days.
export function getReminders(invoices, payments, getClient) {
  const lastDueSoonDate = addDays(DUE_SOON_DAYS);
  const today = todayString();
  const overdue = [];
  const dueSoon = [];

  invoices.forEach((invoice) => {
    const status = getInvoiceStatus(invoice, payments);
    if (status === "Draft" || status === "Paid") return; // nothing to collect

    const client = getClient(invoice.clientId);
    const item = {
      invoice,
      clientName: client ? client.name : "Unknown client",
      balance: getBalance(invoice, payments),
    };

    if (status === "Overdue") {
      overdue.push({ ...item, days: daysBetween(invoice.dueDate, today) }); // days late
    } else if (invoice.dueDate <= lastDueSoonDate) {
      dueSoon.push({ ...item, days: daysBetween(today, invoice.dueDate) }); // days left (0 = today)
    }
  });

  overdue.sort((a, b) => b.days - a.days); // most late first
  dueSoon.sort((a, b) => a.days - b.days); // soonest first

  const total = (list) =>
    round2(list.reduce((sum, item) => sum + item.balance, 0));
  return {
    overdue,
    dueSoon,
    overdueTotal: total(overdue),
    dueSoonTotal: total(dueSoon),
    count: overdue.length + dueSoon.length,
  };
}

export function describeReminder(kind, days) {
  if (kind === "overdue")
    return days === 1 ? "1 day late" : `${days} days late`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

// Shows a system notification. Returns true if it was shown.
export async function showReminderNotification(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return false;
  const options = {
    body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-64x64.png",
    tag: "invoice-reminders",
  };
  try {
    // Phones need the notification to come from the service worker; desktops can do it directly
    const registration =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration()
        : null;
    if (registration) await registration.showNotification(title, options);
    else new Notification(title, options);
    return true;
  } catch (error) {
    console.warn("Could not show the reminder", error);
    return false;
  }
}

// Called when the app opens: shows ONE summary notification per day, if anything needs attention
export async function maybeShowDailyReminder(reminders, formatMoney) {
  if (reminders.count === 0) return;
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  const today = todayString();
  try {
    if (localStorage.getItem(LAST_SHOWN_KEY) === today) return;
    localStorage.setItem(LAST_SHOWN_KEY, today);
  } catch (error) {
    // Storage unavailable: show it anyway
  }

  const lines = [];
  if (reminders.overdue.length > 0) {
    lines.push(
      `${reminders.overdue.length} overdue: ${formatMoney(
        reminders.overdueTotal
      )} owed to you`
    );
  }
  if (reminders.dueSoon.length > 0) {
    lines.push(
      `${
        reminders.dueSoon.length
      } due within ${DUE_SOON_DAYS} days: ${formatMoney(
        reminders.dueSoonTotal
      )}`
    );
  }
  await showReminderNotification(
    "DueSora: payments to collect",
    lines.join("\n")
  );
}
