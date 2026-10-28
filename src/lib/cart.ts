/**
 * Cart state. A plain map of product id -> quantity, persisted so a reload
 * during checkout does not lose the bag. No reducer: there are four operations
 * and they are one line each.
 */
import { useEffect, useState } from "react";

const STORAGE_KEY = "meridian.cart.v1";

export type Cart = Readonly<Record<string, number>>;

function readStoredCart(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" && Number.isInteger(entry[1]) && entry[1] > 0,
      ),
    );
  } catch {
    return {};
  }
}

export function useCart() {
  const [cart, setCart] = useState<Cart>(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  return {
    cart,
    add: (id: string) => setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 })),
    setQuantity: (id: string, quantity: number) =>
      setCart((current) => {
        if (quantity <= 0) {
          const { [id]: _removed, ...rest } = current;
          return rest;
        }
        return { ...current, [id]: Math.min(quantity, 24) };
      }),
    clear: () => setCart({}),
  };
}

export function cartCount(cart: Cart): number {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}
