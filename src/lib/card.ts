/**
 * Mock card processor. Deliberately obvious: this demo has no processor
 * account, so the point is the shape of the flow (authorise, confirm), not a
 * real charge. The reference it returns looks like a processor id so the
 * receipt has something to show.
 */
const DECLINE_SUFFIX = "0002";

export interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCardNumber(value: string): string {
  return digitsOnly(value).slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
}

export function formatExpiry(value: string): string {
  const digits = digitsOnly(value).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

/** Returns the first thing that is wrong, or null. Field order matches the form. */
export function cardProblem(details: CardDetails): string | null {
  if (digitsOnly(details.number).length < 15) return "Enter a full card number.";
  if (!/^\d{2}\/\d{2}$/.test(details.expiry)) return "Expiry should be MM/YY.";
  const month = Number(details.expiry.slice(0, 2));
  if (month < 1 || month > 12) return "That month does not exist.";
  if (digitsOnly(details.cvc).length < 3) return "CVC is three digits.";
  if (details.name.trim().length < 3) return "Name on card is required.";
  return null;
}

export class CardDeclinedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardDeclinedError";
  }
}

/** Resolves with a processor reference, or throws a decline. */
export async function chargeCard(details: CardDetails, amountCents: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1400));
  if (digitsOnly(details.number).endsWith(DECLINE_SUFFIX)) {
    throw new CardDeclinedError("The issuer declined this card. Try 4242 4242 4242 4242.");
  }
  const suffix = digitsOnly(details.number).slice(-4);
  return `ch_mock_${suffix}_${amountCents.toString(36)}`;
}
