/**
 * SPEND rows are stored as positive amounts, while a manual debit is a
 * MANUAL_ADJUST with a negative amount. Both are money leaving the wallet,
 * so both must render with a minus sign.
 */
export function isDebit(t: { type: string; amount: number }): boolean {
  return t.type === "SPEND" || t.amount < 0;
}

export function formatSignedNaira(t: { type: string; amount: number }): string {
  return `${isDebit(t) ? "-" : "+"}₦${Math.abs(t.amount).toLocaleString()}`;
}
