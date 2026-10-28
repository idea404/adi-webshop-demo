/**
 * Shop-wide constants. Money is in integer cents; formatting happens at the edges.
 */
export const SHOP = {
  name: "Meridian",
  tagline: "Single origin, roasted Tuesdays",
  shipping: 600,
  freeShippingOver: 5000,
  /** Demo orders are capped so a stray click cannot produce an absurd receipt. */
  maxOrderCents: 100_000,
} as const;

export function orderTotal(subtotalCents: number): number {
  const shipping = subtotalCents >= SHOP.freeShippingOver ? 0 : SHOP.shipping;
  return Math.min(subtotalCents + shipping, SHOP.maxOrderCents);
}
