import type { Product } from "../data/products";
import { usd } from "../lib/money";
import { PlusIcon } from "./Icons";

export function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <article className="group flex flex-col">
      <div
        className="plate flex aspect-[4/5] flex-col justify-between rounded-[var(--radius-plate)] p-6 transition-transform duration-500 ease-out group-hover:-translate-y-1"
        style={{ background: product.art, color: product.ink }}
      >
        <div className="flex items-start justify-between text-[11px] font-medium uppercase tracking-[0.18em] opacity-80">
          <span>{product.origin}</span>
          <span className="normal-case tracking-normal">{product.weight}</span>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] opacity-70">{product.process}</p>
          <h3 className="mt-1 font-display text-[2.6rem] leading-[0.95] tracking-[-0.01em]">{product.name}</h3>
          <p className="mt-3 max-w-[16rem] text-[13px] leading-relaxed opacity-85">
            {product.notes.join(" · ")}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="font-mono text-[13px] text-paper/70">{usd(product.price)}</span>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-2 text-[13px] text-paper/85 transition-colors hover:border-white/40 hover:bg-white/5 hover:text-paper"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Add
        </button>
      </div>
    </article>
  );
}
