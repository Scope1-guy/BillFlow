import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetails from "./pages/InvoiceDetails";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

// Every <Route> maps a URL to a page component.
// Routes nested inside <Layout /> share the sidebar and top bar.
export default function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <DataProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceForm />} />
              <Route path="/invoices/:invoiceId" element={<InvoiceDetails />} />
              <Route
                path="/invoices/:invoiceId/edit"
                element={<InvoiceForm />}
              />
              <Route path="/clients" element={<Clients />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </DataProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}
