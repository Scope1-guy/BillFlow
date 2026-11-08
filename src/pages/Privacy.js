import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="card legal-card">
        <Link to="/" className="back-link">
          Back to BillFlow
        </Link>
        <h1>Privacy Policy</h1>
        <p className="muted">Last updated: Today</p>

        <h2>What BillFlow is</h2>
        <p>
          BillFlow is an online tool for creating invoices and receipts and
          tracking payments.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your email address and your name,
            which we receive from your Google profile when you sign in with
            Google. We never see your Google password.
          </li>
          <li>
            <strong>What you enter:</strong> clients (names, emails, phone
            numbers, addresses), invoices, receipts, line items, notes and
            payment records.
          </li>
          <li>
            <strong>Settings:</strong> your chosen display currency, saved in
            your browser.
          </li>
        </ul>

        <h2>How we use it</h2>
        <p>
          We use your information only to run BillFlow: to log you in, to save
          and show your records, and to send account emails such as password
          resets. We do not sell your information.
        </p>

        <h2>Services we rely on</h2>
        <ul>
          <li>
            <strong>Supabase</strong> for login and the database where your
            records are stored.
          </li>
          <li>
            <strong>Vercel</strong> to host the website.
          </li>
          <li>
            <strong>Google</strong> for siging in.
          </li>
          <li>
            <strong>ExchangeRate-API</strong> for currency rates. Your browser
            contacts this service directly, so it can see your IP address. No
            account or invoice data is sent.
          </li>
        </ul>

        <h2>Your clients' information</h2>
        <p>
          When you enter information about your own clients and customers, you
          are responsible for having a lawful reason to store it and for keeping
          it accurate.
        </p>

        <h2>Storage in your browser</h2>
        <p>
          We use your browser's storage to keep you logged in and to remember
          your currency choice and cached exchange rates.
        </p>

        <h2>Keeping and deleting your data</h2>
        <p>
          We keep your data while your account exists. To delete your account
          and data, or to ask for a copy of it, email the.guyyy1203@gmail.com.
        </p>

        <h2>Security</h2>
        <p>
          Each account can only access its own records. No online service is
          perfectly secure, so we cannot guarantee absolute security.
        </p>

        <h2>Changes</h2>
        <p>
          We may update this policy and will change the date above when we do.
        </p>

        <h2>Contact</h2>
        <p>Questions? Email the.guyyy1203@gmail.com.</p>
      </div>
    </div>
  );
}
