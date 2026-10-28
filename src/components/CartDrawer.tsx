import { SHOP, orderTotal } from "../config";
import { PRODUCTS } from "../data/products";
import type { Cart } from "../lib/cart";
import { usd } from "../lib/money";
import { CloseIcon, MinusIcon, PlusIcon, ArrowRightIcon } from "./Icons";
import { Modal } from "./Modal";

export function CartDrawer({
  open,
  cart,
  onClose,
  onQuantity,
  onCheckout,
}: {
  open: boolean;
  cart: Cart;
  onClose: () => void;
  onQuantity: (id: string, quantity: number) => void;
  onCheckout: () => void;
}) {
  const lines = Object.entries(cart).flatMap(([id, quantity]) => {
    const product = PRODUCTS.find((entry) => entry.id === id);
    return product ? [{ product, quantity }] : [];
  });
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  const total = orderTotal(subtotal);
  const shipping = total - subtotal;

  return (
    <Modal open={open} onClose={onClose} label="Your bag" sheet>
      <div className="flex h-full flex-col bg-paper text-ink">
        <div className="flex items-center justify-between border-b border-ink/10 px-6 py-5">
          <h2 className="font-display text-[28px] leading-none">Your bag</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bag"
            className="rounded-full p-2 text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <p className="font-display text-[26px] text-ink/70">Nothing here yet</p>
            <p className="max-w-[22rem] text-[14px] leading-relaxed text-ink/50">
              Four coffees on the shelf. Pick one and we will roast it the Tuesday after you order.
            </p>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-ink/10 overflow-y-auto px-6">
              {lines.map(({ product, quantity }) => (
                <li key={product.id} className="flex gap-4 py-5">
                  <div
                    className="plate h-20 w-16 shrink-0 rounded-xl"
                    style={{ background: product.art }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[15px] font-medium leading-tight">{product.name}</p>
                        <p className="mt-1 text-[12px] text-ink/50">
                          {product.origin} · {product.weight}
                        </p>
                      </div>
                      <span className="font-mono text-[13px]">{usd(product.price * quantity)}</span>
                    </div>

                    <div className="mt-3 inline-flex items-center rounded-full border border-ink/15">
                      <button
                        type="button"
                        onClick={() => onQuantity(product.id, quantity - 1)}
                        aria-label={`Remove one ${product.name}`}
                        className="rounded-l-full p-1.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        <MinusIcon className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-[12px]">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantity(product.id, quantity + 1)}
                        aria-label={`Add one ${product.name}`}
                        className="rounded-r-full p-1.5 text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                      >
                        <PlusIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-ink/10 px-6 py-5">
              <dl className="space-y-2 text-[13px]">
                <div className="flex justify-between text-ink/60">
                  <dt>Subtotal</dt>
                  <dd className="font-mono">{usd(subtotal)}</dd>
                </div>
                <div className="flex justify-between text-ink/60">
                  <dt>Shipping</dt>
                  <dd className="font-mono">{shipping === 0 ? "Free" : usd(shipping)}</dd>
                </div>
                {shipping > 0 ? (
                  <p className="pt-1 text-[12px] text-blue">
                    {usd(SHOP.freeShippingOver - subtotal)} more for free shipping
                  </p>
                ) : null}
                <div className="flex justify-between border-t border-ink/10 pt-3 text-[15px] font-medium">
                  <dt>Total</dt>
                  <dd className="font-mono">{usd(total)}</dd>
                </div>
              </dl>

              <button type="button" onClick={onCheckout} className="btn-primary mt-5 w-full">
                Checkout
                <ArrowRightIcon className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
