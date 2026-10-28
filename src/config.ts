/**
 * Shop-wide constants. Money is in integer cents; formatting happens at the edges.
 */
export const SHOP = {
  name: "Meridian",
  tagline: "Single origin, roasted Tuesdays",
  shipping: 600,
  freeShippingOver: 5000,
  /** Demo orders are capped so a stray click cannot create a large testnet payment. */
  maxOrderCents: 100_000,
} as const;

export function orderTotal(subtotalCents: number): number {
  const shipping = subtotalCents >= SHOP.freeShippingOver ? 0 : SHOP.shipping;
  return Math.min(subtotalCents + shipping, SHOP.maxOrderCents);
}

/**
 * Receiving address for the demo. The env override keeps a fork from sending
 * testnet money to this address by accident.
 */
export function merchantAddress(): `0x${string}` {
  const configured = import.meta.env.VITE_MERCHANT_ADDRESS;
  return typeof configured === "string" && /^0x[0-9a-fA-F]{40}$/.test(configured)
    ? (configured as `0x${string}`)
    : "0xDaa1eb83E7D34435B004189906DdC53A0269854c";
}
