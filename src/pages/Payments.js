import { Link } from "react-router-dom";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import EmptyState from "../components/EmptyState";
import { formatDate, round2 } from "../utils/calc";

// A read-only list of every payment. Payments are recorded from an invoice's details page.
export default function Payments() {
  const { payments, invoices, getClient } = useData();
  const { formatMoney } = useCurrency();

  const rows = [...payments]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((payment) => {
      const invoice = invoices.find((item) => item.id === payment.invoiceId);
      return {
        ...payment,
        invoice,
        clientName: invoice
          ? getClient(invoice.clientId)?.name || "Unknown client"
          : "-",
      };
    });

  const total = round2(
    payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
  );

  return (
    <>
      <div className="page-header">
        <h1>Payments</h1>
        <p className="header-total">
          Total received <strong>{formatMoney(total)}</strong>
        </p>
      </div>

      <div className="card">
        {rows.length === 0 ? (
          <EmptyState
            title="No payments yet"
            message="Open an invoice and choose Record payment to log one."
            action={
              <Link to="/invoices" className="btn btn-primary">
                Go to invoices
              </Link>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Method</th>
                  <th>Note</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td data-label="Date">{formatDate(row.date)}</td>
                    <td data-label="Invoice">
                      {row.invoice ? (
                        <Link
                          to={`/invoices/${row.invoice.id}`}
                          className="strong-link"
                        >
                          {row.invoice.number}
                        </Link>
                      ) : (
                        "Deleted invoice"
                      )}
                    </td>
                    <td data-label="Client">{row.clientName}</td>
                    <td data-label="Method">{row.method}</td>
                    <td data-label="Note">{row.note || "-"}</td>
                    <td data-label="Amount" className="num positive">
                      {formatMoney(row.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
