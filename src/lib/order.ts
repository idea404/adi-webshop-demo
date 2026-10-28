/**
 * Order shapes. There is no server in this demo, so an order is a value the
 * browser builds at payment time and keeps in memory; the receipt is a view of
 * that value, not a record anywhere.
 */
import { PRODUCTS } from "../data/products";
import { orderTotal } from "../config";
import type { Cart } from "./cart";

export interface OrderLine {
  id: string;
  name: string;
  quantity: number;
  unitCents: number;
}

export interface Order {
  id: string;
  lines: OrderLine[];
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

export type Payment =
  | { method: "card"; reference: string }
  | { method: "adi"; txHash: `0x${string}`; blockNumber: number };

/** Readable, not secret: this is a receipt label, not an identifier anyone can act on. */
export function newOrderId(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  const code = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return `MRD-${code}`;
}

export function buildOrder(cart: Cart): Order {
  const lines: OrderLine[] = [];
  for (const [id, quantity] of Object.entries(cart)) {
    const product = PRODUCTS.find((entry) => entry.id === id);
    if (!product || quantity <= 0) continue;
    lines.push({ id, name: product.name, quantity, unitCents: product.price });
  }
  const subtotalCents = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
  const totalCents = orderTotal(subtotalCents);
  return {
    id: newOrderId(),
    lines,
    subtotalCents,
    shippingCents: totalCents - subtotalCents,
    totalCents,
  };
}

export function emptyOrder(): Order {
  return { id: "", lines: [], subtotalCents: 0, shippingCents: 0, totalCents: 0 };
}
