export function formatCurrency(amount: number, currency = "USD", abbreviated = false): string {
  if (abbreviated && amount >= 1000) {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
      notation: "compact",
      compactDisplay: "short",
    })
    return formatter.format(amount)
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount)
}

export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]+/g, "")
  return Number.parseFloat(cleaned) || 0
}
