const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function formatPrice(value: number): string {
  if (value === 0) return "Free";
  return Number.isInteger(value) ? usdWhole.format(value) : usd.format(value);
}

export function formatEnds(days: number): string {
  if (days <= 0) return "Ends tonight";
  if (days === 1) return "Ends tomorrow";
  return `${days} days left`;
}
