import { createContext, useContext, useEffect, useState } from "react";
import {
  CURRENCIES,
  canRefreshNow,
  fetchLatestRates,
  loadCachedRates,
  ratesAreStale,
  saveCachedRates,
} from "../utils/exchangeRates";
import { formatCompactCurrency, formatCurrency } from "../utils/calc";

// Every amount is STORED in US dollars. The display currency only changes how amounts are SHOWN:
// shown = stored USD amount x rate.

const SETTINGS_KEY = "billflow-settings-v1";

const CurrencyContext = createContext(null);

function loadPreferredCurrency() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY));
    if (saved && typeof saved.currency === "string") return saved.currency;
  } catch (error) {
    // Nothing saved yet - use USD
  }
  return "USD";
}

export function CurrencyProvider({ children }) {
  const [preferredCurrency, setPreferredCurrency] = useState(
    loadPreferredCurrency
  );
  const [ratesInfo, setRatesInfo] = useState(loadCachedRates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Remember the chosen currency
  useEffect(() => {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({ currency: preferredCurrency })
      );
    } catch (err) {
      console.warn("Could not save the currency setting.", err);
    }
  }, [preferredCurrency]);

  // If a fetch fails we KEEP the old cached rates, so the app keeps working
  async function loadRates() {
    setLoading(true);
    setError("");
    try {
      const fresh = await fetchLatestRates();
      saveCachedRates(fresh);
      setRatesInfo(fresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // When the app opens, fetch rates only if we have none or they are out of date
  useEffect(() => {
    if (ratesAreStale(ratesInfo)) loadRates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function refreshRates() {
    if (canRefreshNow(ratesInfo)) loadRates();
  }

  // If the chosen currency has no rate (offline and nothing cached), fall back to USD
  const rates = ratesInfo ? ratesInfo.rates : null;
  const preferredRate =
    preferredCurrency === "USD" ? 1 : rates && rates[preferredCurrency];
  const currency = preferredRate ? preferredCurrency : "USD";
  const rate = preferredRate || 1;

  const availableCurrencies = CURRENCIES.filter(
    (item) => item.code === "USD" || (rates && rates[item.code])
  );

  function chooseCurrency(code) {
    if (code !== "USD" && !(rates && rates[code])) return false;
    setPreferredCurrency(code);
    return true;
  }

  // Convert between ANY two currencies using the USD-based table
  function convert(amount, from, to) {
    if (!rates || !rates[from] || !rates[to]) return null;
    return (Number(amount) / rates[from]) * rates[to];
  }

  const value = {
    currency,
    preferredCurrency,
    rate,
    ratesInfo,
    loading,
    error,
    availableCurrencies,
    chooseCurrency,
    refreshRates,
    canRefresh: canRefreshNow(ratesInfo),
    convert,
    formatMoney: (usdAmount) =>
      formatCurrency(Number(usdAmount) * rate, currency),
    formatCompact: (usdAmount) =>
      formatCompactCurrency(Number(usdAmount) * rate, currency),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
