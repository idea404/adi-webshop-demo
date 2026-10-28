import { cartCount, type Cart } from "../lib/cart";

import { BagIcon } from "./Icons";

export function Header({
  cart,
  onOpenCart,
  onHome,
}: {
  cart: Cart;
  onOpenCart: () => void;
  onHome: () => void;
}) {
  const count = cartCount(cart);
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <button type="button" onClick={onHome} className="flex items-baseline gap-3 text-left">
          <span className="font-display text-[26px] leading-none tracking-[-0.01em]">Meridian</span>
          <span className="label hidden text-paper/40 sm:inline">Demo store</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="label hidden text-paper/40 md:inline">Ships worldwide · Roasted Tuesdays</span>
          <button
            type="button"
            onClick={onOpenCart}
            className="relative ml-2 inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-[13px] text-paper/85 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-paper"
          >
            <BagIcon />
            <span>Bag</span>
            {count > 0 ? (
              <span className="ml-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue px-1.5 font-mono text-[11px] text-paper">
                {count}
              </span>
            ) : null}
          </button>
        </div>
      </div>
    </header>
  );
}
