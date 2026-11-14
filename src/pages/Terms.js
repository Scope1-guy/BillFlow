import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div className="legal-page">
      <div className="card legal-card">
        <Link to="/" className="back-link">
          Back to DueSora
        </Link>
        <h1>Terms of Service</h1>
        <p className="muted">Last updated: Today</p>

        <h2>Using DueSora</h2>
        <p>
          DueSora helps you create invoices and receipts and track payments. By
          creating an account you agree to these terms. You must be old enough
          to enter a contract where you live and use DueSora lawfully.
        </p>

        <h2>Your account</h2>
        <p>
          You are responsible for keeping your login details safe and for
          everything done through your account.
        </p>

        <h2>Your data and responsibilities</h2>
        <ul>
          <li>
            You own the information you enter. You give us permission to store
            and show it to you so the service works.
          </li>
          <li>
            You are responsible for the accuracy of your invoices and receipts,
            and for meeting your own tax, accounting and legal duties.
          </li>
          <li>
            DueSora does not process payments. Recording a payment only records
            it, and no money moves.
          </li>
          <li>DueSora is not accounting, tax or legal advice.</li>
        </ul>

        <h2>Currency display</h2>
        <p>
          Amounts are saved in US dollars. Other currencies are shown as
          estimates using daily exchange rates and may differ from the rates
          your bank or client uses.
        </p>

        <h2>Acceptable use</h2>
        <p>
          Do not use DueSora for anything unlawful, to harm others, or to attack
          or overload the service.
        </p>

        <h2>Availability</h2>
        <p>
          We work to keep DueSora running, but it is provided "as is" without
          guarantees. It may be unavailable or change from time to time. Keep
          your own copies of important records.
        </p>

        <h2>Ending your account</h2>
        <p>
          You can stop using DueSora at any time and ask us to delete your
          account. We may suspend accounts that break these terms.
        </p>

        <h2>Limit of liability</h2>
        <p>
          To the extent the law allows, DueSora is not liable for indirect
          losses or lost income arising from using the service.
        </p>

        <h2>Governing law</h2>
        <p>These terms are governed by the laws of Nigeria.</p>

        <h2>Contact</h2>
        <p>Questions? Email the.guyyy1203@gmail.com.</p>
      </div>
    </div>
  );
}
