# BillFlow - Invoicing & Payments Tracker

A responsive invoicing dashboard for freelancers and small businesses, built as a React learning project.
It runs entirely in the browser with demo data and **LocalStorage** (no backend).

**Stack:** Vite 6, React 18, JavaScript (`.js` files only), React Router 7, plain CSS, Context API.

## Run it

```bash
npm install
npm run dev        # start the dev server (http://localhost:5173)
npm run build      # production build into /dist
npm run preview    # serve the production build locally
```

## What works

- **Dashboard** - totals, outstanding, overdue, recent invoices and payments, monthly payments chart, status donut (all calculated from your records).
- **Invoices** - list, search (number or client), status filter, create, edit, view, delete.
- **Invoice form** - line items, automatic totals, discount % and tax %, validation, Save Draft / Save Invoice.
- **Invoice details** - client, items, totals, amount paid, balance due, payment history.
- **Clients** - add, edit, search, delete (a client that still has invoices cannot be deleted).
- **Payments** - record full or partial payments (overpayment is blocked), remove a payment, see all payments.
- **Settings** - restore the demo data or clear everything.
- Data is saved to LocalStorage, so it survives a page refresh.

## How invoice status works

Only `saved: 'draft' | 'sent'` is stored. The visible status is **calculated** in `getInvoiceStatus()` (`src/utils/calc.js`), first match wins:

1. `saved` is `draft` -> **Draft**
2. balance is 0 -> **Paid**
3. due date is before today -> **Overdue** (even if partly paid)
4. something has been paid -> **Partially Paid**
5. otherwise -> **Sent**

## Project structure

```text
billflow/
├── index.html              Vite entry page (loads /src/main.js)
├── vite.config.js          Lets Vite read JSX inside .js files
├── public/                 favicon + _redirects (SPA fallback for Netlify)
├── vercel.json             SPA fallback for Vercel
└── src/
    ├── main.js             Renders <App /> and imports the CSS
    ├── App.js              All routes
    ├── context/DataContext.js   Shared data, CRUD functions, LocalStorage saving, toast messages
    ├── data/sampleData.js       Demo clients, invoices and payments (dates relative to today)
    ├── utils/calc.js            Totals, balances, status, money and date helpers
    ├── components/         Layout, Modal, ConfirmDialog, Field, StatCard, StatusBadge,
    │                       RevenueChart, StatusDonut, PaymentModal, ClientFormModal, Icon, Toast
    ├── pages/              Dashboard, Invoices, InvoiceForm, InvoiceDetails, Clients, Payments, Settings
    └── styles/             base.css (tokens, buttons, forms), layout.css, components.css
```

## Good places to start reading

1. `src/utils/calc.js` - the money logic, all in one place.
2. `src/context/DataContext.js` - how state is shared and saved (`useState`, `useEffect`, Context).
3. `src/pages/InvoiceForm.js` - controlled inputs, updating arrays/objects in state, validation.
4. `src/components/PaymentModal.js` - a small form with validation and a callback prop.

## Adding a backend later

Every read/write goes through `DataContext.js`. To add Supabase/Firebase, replace the `useState` + LocalStorage
logic inside the CRUD functions (`saveInvoice`, `addPayment`, ...) with API calls - the pages should barely change.
Auth, PDF export, email reminders and payment gateways are intentionally **not** included.

## Notes

- LocalStorage is for this demo only. It is readable and editable by anyone using the browser and is not secure.
- Currency is fixed to USD (`formatCurrency` in `calc.js`).
- If you deploy, make sure unknown URLs fall back to `index.html` (already configured for Netlify and Vercel).
