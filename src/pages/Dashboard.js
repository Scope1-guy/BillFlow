import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import RevenueChart from "../components/RevenueChart";
import StatusDonut from "../components/StatusDonut";
import Icon from "../components/Icon";
import EmptyState from "../components/EmptyState";
import {
  STATUSES,
  calcTotals,
  formatDate,
  getBalance,
  getInvoiceStatus,
  round2,
} from "../utils/calc";

// Builds the last 6 months of "payments received" for the chart
function getMonthlyRevenue(payments) {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    months.push({
      key,
      label: date.toLocaleString("en-US", { month: "short" }),
      value: 0,
    });
  }
  payments.forEach((payment) => {
    // A payment date "2026-08-14" belongs to the month "2026-08"
    const month = months.find((item) => item.key === payment.date.slice(0, 7));
    if (month) month.value = round2(month.value + Number(payment.amount));
  });
  return months;
}

export default function Dashboard() {
  const { invoices, receipts, payments, clients, getClient } = useData();
  const { formatMoney, formatCompact } = useCurrency();

  // ----- Everything below is CALCULATED from the real records, never hardcoded -----
  // Drafts have not been sent to a client yet, so they don't count as invoiced money.
  const sentInvoices = invoices.filter((invoice) => invoice.saved !== "draft");
  const withStatus = invoices.map((invoice) => ({
    ...invoice,
    status: getInvoiceStatus(invoice, payments),
  }));

  const totalInvoiced = round2(
    sentInvoices.reduce((sum, invoice) => sum + calcTotals(invoice).total, 0)
  );
  const receiptsTotal = round2(
    receipts.reduce((sum, receipt) => sum + calcTotals(receipt).total, 0)
  );
  const totalReceived = round2(
    payments.reduce((sum, payment) => sum + Number(payment.amount), 0) +
      receiptsTotal
  );
  const outstanding = round2(
    sentInvoices.reduce(
      (sum, invoice) => sum + getBalance(invoice, payments),
      0
    )
  );

  const overdueInvoices = withStatus.filter(
    (invoice) => invoice.status === "Overdue"
  );
  const overdueAmount = round2(
    overdueInvoices.reduce(
      (sum, invoice) => sum + getBalance(invoice, payments),
      0
    )
  );

  const paidCount = withStatus.filter(
    (invoice) => invoice.status === "Paid"
  ).length;
  const draftCount = withStatus.filter(
    (invoice) => invoice.status === "Draft"
  ).length;
  const unpaidCount = invoices.length - paidCount - draftCount;

  const clientsWithInvoices = clients.filter((client) =>
    invoices.some((invoice) => invoice.clientId === client.id)
  );

  const statusCounts = {};
  STATUSES.forEach((status) => {
    statusCounts[status] = withStatus.filter(
      (invoice) => invoice.status === status
    ).length;
  });

  const recentInvoices = [...withStatus]
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
    .slice(0, 5);
  const recentPayments = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  // The chart counts invoice payments AND receipts
  const monthlyRevenue = getMonthlyRevenue([
    ...payments,
    ...receipts.map((receipt) => ({
      date: receipt.date,
      amount: calcTotals(receipt).total,
    })),
  ]);

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div>
          <Link to="/invoices/new" className="btn btn-primary">
            <Icon name="plusCircle" size={18} /> Create Invoice
          </Link>
          <Link to="/receipts/new" className="btn btn-primary">
            <Icon name="plusCircle" size={18} /> Create Receipt
          </Link>
        </div>
      </div>

      <section className="stat-grid" aria-label="Summary">
        <StatCard
          title="Total Invoiced"
          value={formatMoney(totalInvoiced)}
          note="Sent invoices, drafts excluded"
          icon="dollar"
          tone="blue"
        />
        <StatCard
          title="Payments Received"
          value={formatMoney(totalReceived)}
          note="Invoice payments and receipts"
          icon="wallet"
          tone="green"
        />
        <StatCard
          title="Outstanding"
          value={formatMoney(outstanding)}
          note="Still owed by clients"
          icon="invoices"
          tone="amber"
        />
        <StatCard
          title="Overdue"
          value={String(overdueInvoices.length)}
          note={
            overdueInvoices.length
              ? `${formatMoney(overdueAmount)} past due date`
              : "Nothing past due"
          }
          icon="activity"
          tone="red"
          danger={overdueInvoices.length > 0}
        />
        <StatCard
          title="Invoices"
          value={String(invoices.length)}
          note={`${paidCount} paid, ${unpaidCount} unpaid, ${draftCount} draft`}
          icon="invoices"
          tone="blue"
        />
        <StatCard
          title="Active Clients"
          value={String(clientsWithInvoices.length)}
          note={`${clients.length} clients in total`}
          icon="clients"
          tone="purple"
        />
      </section>

      <section className="chart-grid">
        <div className="card">
          <h2 className="card-title">
            <Icon name="trendingUp" size={18} /> Overview
          </h2>
          <p className="card-subtitle">
            Payments received over the last 6 months
          </p>
          <RevenueChart
            data={monthlyRevenue}
            formatTick={formatCompact}
            formatValue={formatMoney}
          />
        </div>
        <div className="card">
          <h2 className="card-title">Invoice Status</h2>
          <p className="card-subtitle">Distribution of invoice statuses</p>
          <StatusDonut counts={statusCounts} />
        </div>
      </section>

      <section className="two-col">
        <div className="card">
          <div className="card-header-row">
            <h2 className="card-title">Recent invoices</h2>
            <Link to="/invoices" className="text-link">
              View all
            </Link>
          </div>
          {recentInvoices.length === 0 ? (
            <EmptyState
              title="No invoices yet"
              message="Create your first invoice to see it here."
            />
          ) : (
            <ul className="activity-list">
              {recentInvoices.map((invoice) => (
                <li key={invoice.id}>
                  <div>
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="strong-link"
                    >
                      {invoice.number}
                    </Link>
                    <span className="muted">
                      {getClient(invoice.clientId)?.name || "Unknown client"}
                    </span>
                  </div>
                  <div className="activity-right">
                    <strong>{formatMoney(calcTotals(invoice).total)}</strong>
                    <StatusBadge status={invoice.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-header-row">
            <h2 className="card-title">Recent payments</h2>
            <Link to="/payments" className="text-link">
              View all
            </Link>
          </div>
          {recentPayments.length === 0 ? (
            <EmptyState
              title="No payments yet"
              message="Record a payment from an invoice and it will show up here."
            />
          ) : (
            <ul className="activity-list">
              {recentPayments.map((payment) => {
                const invoice = invoices.find(
                  (item) => item.id === payment.invoiceId
                );
                return (
                  <li key={payment.id}>
                    <div>
                      <Link
                        to={`/invoices/${payment.invoiceId}`}
                        className="strong-link"
                      >
                        {invoice ? invoice.number : "Deleted invoice"}
                      </Link>
                      <span className="muted">
                        {formatDate(payment.date)} - {payment.method}
                      </span>
                    </div>
                    <div className="activity-right">
                      <strong className="positive">
                        +{formatMoney(payment.amount)}
                      </strong>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
