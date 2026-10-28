/** All shop money is integer cents. Formatting is the only place it becomes text. */
export function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

/** Token amounts arrive as integer raw units; render them without going through a float. */
export function tokenAmount(raw: bigint, decimals: number, maxFractionDigits = 2): string {
  const scale = 10n ** BigInt(decimals);
  const whole = raw / scale;
  const fraction = raw % scale;
  if (fraction === 0n || maxFractionDigits === 0) return whole.toString();
  const digits = fraction.toString().padStart(decimals, "0").slice(0, maxFractionDigits).replace(/0+$/, "");
  return digits.length > 0 ? `${whole}.${digits}` : whole.toString();
}

/** Cents to settlement-token raw units. The 6-decimal test token is 1:1 with USD. */
export function centsToTokenUnits(cents: number, decimals: number): bigint {
  return BigInt(cents) * 10n ** BigInt(decimals - 2);
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
