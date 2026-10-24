import { useState } from "react";
import { useData } from "../context/DataContext";
import { useCurrency } from "../context/CurrencyContext";
import ConfirmDialog from "../components/ConfirmDialog";
import Field from "../components/Field";
import Icon from "../components/Icon";
import { CURRENCIES } from "../utils/exchangeRates";
import { formatCurrency } from "../utils/calc";

// A readable label like "NGN - Nigerian Naira"
function currencyLabel(code) {
  const match = CURRENCIES.find((item) => item.code === code);
  return match ? `${code} - ${match.name}` : code;
}

function formatDateTime(timestamp) {
  return new Date(timestamp).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Settings() {
  const {
    resetDemoData,
    clearAllData,
    showToast,
    clients,
    invoices,
    payments,
  } = useData();
  const {
    currency,
    preferredCurrency,
    rate,
    ratesInfo,
    loading,
    error,
    availableCurrencies,
    chooseCurrency,
    refreshRates,
    canRefresh,
    convert,
  } = useCurrency();

  // Which confirmation is open: null, 'reset' or 'clear'
  const [dialog, setDialog] = useState(null);

  // State for the small converter tool (the amount is kept as text because it comes from an input)
  const [converter, setConverter] = useState({
    amount: "100",
    from: "USD",
    to: "NGN",
  });

  function handleConfirm() {
    if (dialog === "reset") {
      resetDemoData();
      showToast("Demo data restored.");
    } else {
      clearAllData();
      showToast("All data cleared.");
    }
    setDialog(null);
  }

  function handleCurrencyChange(event) {
    const code = event.target.value;
    if (chooseCurrency(code)) showToast(`Amounts are now shown in ${code}.`);
    else
      showToast(
        "Exchange rates are not available yet, so only USD can be used.",
        "error"
      );
  }

  function handleConverterChange(event) {
    const { name, value } = event.target;
    setConverter({ ...converter, [name]: value });
  }

  // The converter result is calculated on every render from the current inputs
  const converted = convert(converter.amount, converter.from, converter.to);
  const converterAmountIsValid =
    converter.amount !== "" && Number(converter.amount) >= 0;

  // If the saved currency has no rate right now (offline, nothing cached), we display USD instead
  const usingFallback = preferredCurrency !== currency;

  return (
    <>
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-page">
        <section className="card settings-card">
          <h2 className="card-title">Display currency</h2>
          <p className="muted">
            Choose the currency used to show amounts across BillFlow. Everything
            is saved in US dollars, so you can switch at any time without
            changing your records. Invoice and payment forms still take amounts
            in USD.
          </p>

          <Field label="Show amounts in" id="display-currency">
            <select
              id="display-currency"
              value={preferredCurrency}
              onChange={handleCurrencyChange}
              disabled={loading && !ratesInfo}
            >
              {availableCurrencies.map((item) => (
                <option key={item.code} value={item.code}>
                  {currencyLabel(item.code)}
                </option>
              ))}
              {/* Keep the saved choice visible even if its rate is missing right now */}
              {usingFallback && (
                <option value={preferredCurrency}>
                  {currencyLabel(preferredCurrency)} (rate unavailable)
                </option>
              )}
            </select>
          </Field>

          {ratesInfo ? (
            <div className="rate-box">
              <p className="rate-line">
                <strong>1 USD = {formatCurrency(rate, currency)}</strong>
              </p>
              <p className="muted">
                Rates last updated {formatDateTime(ratesInfo.lastUpdate)}. They
                change once a day.
              </p>
            </div>
          ) : (
            <p className="muted">
              {loading
                ? "Loading exchange rates..."
                : "No exchange rates loaded yet, so amounts are shown in USD."}
            </p>
          )}

          {usingFallback && (
            <p className="field-error" role="alert">
              Rates for {preferredCurrency} are not available right now, so
              amounts are shown in USD.
            </p>
          )}
          {error && (
            <p className="field-error" role="alert">
              {error}
              {ratesInfo ? " Showing the last saved rates." : ""}
            </p>
          )}

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={refreshRates}
              disabled={loading || !canRefresh}
              title={
                !canRefresh
                  ? "Rates only change once a day. You can refresh again after an hour."
                  : undefined
              }
            >
              <Icon name="refresh" size={16} />{" "}
              {loading ? "Refreshing..." : "Refresh rates"}
            </button>
          </div>
          {!canRefresh && (
            <p className="field-hint">
              Rates only change once a day, so you can refresh again after an
              hour.
            </p>
          )}

          <p className="attribution">
            <a
              href="https://www.exchangerate-api.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Rates By Exchange Rate API
            </a>
          </p>
        </section>

        <section className="card settings-card">
          <h2 className="card-title">Currency converter</h2>
          <p className="muted">
            A quick calculator using the same live rates. It does not change any
            of your data.
          </p>

          {ratesInfo ? (
            <>
              <div className="converter-row">
                <Field
                  label="Amount"
                  id="converter-amount"
                  error={
                    !converterAmountIsValid ? "Enter 0 or more." : undefined
                  }
                >
                  <input
                    id="converter-amount"
                    name="amount"
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={converter.amount}
                    onChange={handleConverterChange}
                    aria-invalid={!converterAmountIsValid}
                    aria-describedby={
                      !converterAmountIsValid
                        ? "converter-amount-error"
                        : undefined
                    }
                  />
                </Field>
                <Field label="From" id="converter-from">
                  <select
                    id="converter-from"
                    name="from"
                    value={converter.from}
                    onChange={handleConverterChange}
                  >
                    {availableCurrencies.map((item) => (
                      <option key={item.code} value={item.code}>
                        {currencyLabel(item.code)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="To" id="converter-to">
                  <select
                    id="converter-to"
                    name="to"
                    value={converter.to}
                    onChange={handleConverterChange}
                  >
                    {availableCurrencies.map((item) => (
                      <option key={item.code} value={item.code}>
                        {currencyLabel(item.code)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {converterAmountIsValid && converted !== null && (
                <p className="converter-result" aria-live="polite">
                  {formatCurrency(converter.amount, converter.from)} ={" "}
                  <strong>{formatCurrency(converted, converter.to)}</strong>
                </p>
              )}
            </>
          ) : (
            <p className="muted">
              The converter needs exchange rates. Check your internet
              connection, then refresh the page.
            </p>
          )}
        </section>

        <section className="card settings-card">
          <h2 className="card-title">Your data</h2>
          <p>
            BillFlow currently stores everything in your browser's{" "}
            <strong>LocalStorage</strong>: {clients.length} clients,{" "}
            {invoices.length} invoices and {payments.length} payments.
          </p>
          <p className="muted">
            LocalStorage is only suitable for this frontend demo. Anyone using
            this browser can read or change it, it is not shared between
            devices, and it is not a secure replacement for a real backend.
          </p>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setDialog("reset")}
            >
              <Icon name="refresh" size={16} /> Restore demo data
            </button>
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={() => setDialog("clear")}
            >
              <Icon name="trash" size={16} /> Clear all data
            </button>
          </div>
        </section>
      </div>

      {dialog && (
        <ConfirmDialog
          title={dialog === "reset" ? "Restore demo data?" : "Clear all data?"}
          confirmLabel={dialog === "reset" ? "Restore" : "Clear everything"}
          message={
            dialog === "reset"
              ? "Your current clients, invoices and payments will be replaced by the original demo records."
              : "All clients, invoices and payments will be permanently deleted from this browser."
          }
          onConfirm={handleConfirm}
          onCancel={() => setDialog(null)}
        />
      )}
    </>
  );
}
