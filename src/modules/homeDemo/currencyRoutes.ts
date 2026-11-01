// Illustrative connections between currency centres, independent of market feeds.
export type CurrencyHub = {
  city: string;
  country: string;
  code: string;
  lat: number;
  lon: number;
};

export type CurrencyRoute = {
  id: string;
  from: CurrencyHub;
  to: CurrencyHub;
};

export const CURRENCY_HUBS: readonly CurrencyHub[] = [
  { city: "New York", country: "United States", code: "USD", lat: 40.7128, lon: -74.0060 },
  { city: "London", country: "United Kingdom", code: "GBP", lat: 51.5074, lon: -0.1278 },
  { city: "Frankfurt", country: "Germany", code: "EUR", lat: 50.1109, lon: 8.6821 },
  { city: "Mumbai", country: "India", code: "INR", lat: 19.0760, lon: 72.8777 },
  { city: "Singapore", country: "Singapore", code: "SGD", lat: 1.3521, lon: 103.8198 },
  { city: "Tokyo", country: "Japan", code: "JPY", lat: 35.6762, lon: 139.6503 },
  { city: "Sydney", country: "Australia", code: "AUD", lat: -33.8688, lon: 151.2093 },
];

export const CURRENCY_ROUTES: readonly CurrencyRoute[] = CURRENCY_HUBS.map((from, index) => {
  const to = CURRENCY_HUBS[(index + 1) % CURRENCY_HUBS.length];
  return { id: `${from.code}-${to.code}`, from, to };
});
