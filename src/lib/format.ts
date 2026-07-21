/** Thousands-separated integer for KPI counters. */
export function formatInt(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

/** One-decimal number for rates. */
export function formatRate(n: number): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/** Percentage with one decimal, e.g. "97.4%". */
export function formatPct(n: number): string {
  return `${n.toFixed(1)}%`
}
