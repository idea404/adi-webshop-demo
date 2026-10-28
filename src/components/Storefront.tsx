import { PRODUCTS } from "../data/products";
import { ProductCard } from "./ProductCard";

/** Landing view: one sentence of what the shop is, then the coffee. */
export function Storefront({ onAdd }: { onAdd: (id: string) => void }) {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 sm:px-8">
      <section className="animate-rise pt-16 pb-14 sm:pt-24">
        <p className="label text-blue-soft/60">Single origin · Roasted weekly</p>
        <h1 className="mt-4 max-w-3xl font-display text-[clamp(2.9rem,7vw,5.4rem)] leading-[0.92] tracking-[-0.02em]">
          Four coffees worth
          <br />
          <span className="text-blue-soft">the shelf space.</span>
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-paper/55">
          Meridian is a demo storefront. Four coffees, a bag, and a checkout built to be read rather than
          deployed. Nothing here is a real shop, and the checkout says what it is doing at each step.
        </p>
      </section>

      <section aria-labelledby="shelf">
        <div className="mb-7 flex items-baseline justify-between border-b border-white/10 pb-3">
          <h2 id="shelf" className="label text-paper/45">
            The shelf
          </h2>
          <span className="font-mono text-[11px] text-paper/35">250 g · whole bean</span>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product, index) => (
            <div key={product.id} className="animate-rise" style={{ animationDelay: `${80 + index * 60}ms` }}>
              <ProductCard product={product} onAdd={() => onAdd(product.id)} />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-3">
        <Note title="Roasted to order">Every bag leaves the roastery on the Tuesday after you order it.</Note>
        <Note title="Free shipping over $50">Below that it is a flat $6, tracked, anywhere we can reach.</Note>
        <Note title="Two ways to pay">Card, as before. ADI Chain, when you want to pay from a wallet.</Note>
      </section>

    </main>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[14px] font-medium text-paper/85">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-paper/45">{children}</p>
    </div>
  );
}
