import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
// import ForgotPassword from "./pages/ForgotPassword";
// import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetails from "./pages/InvoiceDetails";
import Receipts from "./pages/Receipts";
import ReceiptForm from "./pages/ReceiptForm";
import ReceiptDetails from "./pages/ReceiptDetails";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";

// Public pages first. Everything inside <ProtectedRoute> needs a login.
// Any other address shows the "page not found" screen.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              {/* <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} /> */}
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/invoices/new" element={<InvoiceForm />} />
                  <Route
                    path="/invoices/:invoiceId"
                    element={<InvoiceDetails />}
                  />
                  <Route
                    path="/invoices/:invoiceId/edit"
                    element={<InvoiceForm />}
                  />
                  <Route path="/receipts" element={<Receipts />} />
                  <Route path="/receipts/new" element={<ReceiptForm />} />
                  <Route
                    path="/receipts/:receiptId"
                    element={<ReceiptDetails />}
                  />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/payments" element={<Payments />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </DataProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
