// Live exchange rates from ExchangeRate-API's free "Open Access" endpoint.
// No API key needed. Rates change once a day, so we cache them and
// never fetch more than once an hour (the service returns 429 if you ask too often).

export const RATES_URL = "https://open.er-api.com/v6/latest/USD";
const CACHE_KEY = "billflow-rates-v1";
const ONE_HOUR = 60 * 60 * 1000;
const ONE_DAY = 24 * ONE_HOUR;

export const CURRENCIES = [
  { code: "USD", name: "US Dollar" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "ZAR", name: "South African Rand" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "AED", name: "UAE Dirham" },
  { code: "INR", name: "Indian Rupee" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
];

export function loadCachedRates() {
  try {
    const saved = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (
      saved &&
      saved.rates &&
      typeof saved.rates.USD === "number" &&
      saved.fetchedAt
    )
      return saved;
  } catch (error) {
    // Broken or missing cache - we fetch fresh rates instead
  }
  return null;
}

export function saveCachedRates(info) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(info));
  } catch (error) {
    console.warn("Could not cache exchange rates.", error);
  }
}

// Fetch only when rates are past their "next update" time AND we have not fetched in the last hour
export function ratesAreStale(info) {
  if (!info) return true;
  const now = Date.now();
  return now >= info.nextUpdate && now - info.fetchedAt >= ONE_HOUR;
}

// The manual "Refresh rates" button: at most once per hour
export function canRefreshNow(info) {
  return !info || Date.now() - info.fetchedAt >= ONE_HOUR;
}

// If two parts of the app ask at the same moment (React StrictMode does this in development),
// they share ONE request.
let requestInProgress = null;

export function fetchLatestRates() {
  if (requestInProgress) return requestInProgress;

  requestInProgress = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(RATES_URL, { signal: controller.signal });
      if (response.status === 429) {
        throw new Error(
          "The rates service is busy. Try again in about 20 minutes."
        );
      }
      if (!response.ok) {
        throw new Error(
          `The rates service returned an error (${response.status}).`
        );
      }

      const data = await response.json();
      if (
        data.result !== "success" ||
        !data.rates ||
        typeof data.rates.USD !== "number"
      ) {
        throw new Error("The rates service sent an unexpected response.");
      }

      const fetchedAt = Date.now();
      return {
        rates: data.rates,
        fetchedAt,
        nextUpdate: data.time_next_update_unix
          ? data.time_next_update_unix * 1000
          : fetchedAt + ONE_DAY,
        lastUpdate: data.time_last_update_unix
          ? data.time_last_update_unix * 1000
          : fetchedAt,
      };
    } catch (error) {
      if (error.name === "AbortError")
        throw new Error("The rates service took too long to respond.");
      if (error instanceof TypeError)
        throw new Error(
          "Could not reach the rates service. Check your internet connection."
        );
      throw error;
    } finally {
      clearTimeout(timer);
      requestInProgress = null;
    }
  })();

  return requestInProgress;
}
