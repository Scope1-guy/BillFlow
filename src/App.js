import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { DataProvider } from "./context/DataContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Invoices from "./pages/Invoices";
import InvoiceForm from "./pages/InvoiceForm";
import InvoiceDetails from "./pages/InvoiceDetails";
import Clients from "./pages/Clients";
import Payments from "./pages/Payments";
import Settings from "./pages/Settings";
import Receipts from "./pages/Receipts";
import ReceiptForm from "./pages/ReceiptForm";
import ReceiptDetails from "./pages/ReceiptDetails";

// /login is public. Everything inside <ProtectedRoute> needs a login.
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <DataProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </DataProvider>
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
