export function formatPrice(amount: number, currency = "NGN"): string {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return currency === "NGN"
      ? `₦${amount.toFixed(2)}`
      : `${currency} ${amount.toFixed(2)}`;
  }
}
