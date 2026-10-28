import type { Order, Payment } from "../lib/order";
import { usd } from "../lib/money";
import { ArrowRightIcon, CheckIcon } from "./Icons";

/** What the shop says after money moved. One page, no cart, no upsell. */
export function ReceiptScreen({ order, payment, onShop }: { order: Order; payment: Payment; onShop: () => void }) {
  return (
    <main className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:pt-24">
      <div className="animate-rise rounded-[var(--radius-plate)] border border-white/10 bg-white/[0.03] p-7 sm:p-10">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue text-paper">
          <CheckIcon className="h-5 w-5" />
        </span>

        <h1 className="mt-5 font-display text-[clamp(2rem,5vw,2.9rem)] leading-[1.02]">Card charged</h1>
        <p className="mt-2 text-[14px] text-paper/55">
          Order {order.id} · {usd(order.totalCents)} · settled immediately
        </p>

        <dl className="mt-8 space-y-2.5 border-t border-white/10 pt-5 text-[13px]">
          {order.lines.map((line) => (
            <div key={line.id} className="flex items-baseline justify-between gap-4">
              <dt className="text-paper/70">
                {line.name}
                <span className="ml-1.5 font-mono text-[12px] text-paper/40">×{line.quantity}</span>
              </dt>
              <dd className="font-mono text-paper/55">{usd(line.unitCents * line.quantity)}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-8 border-t border-white/10 pt-5">
          <p className="label text-paper/35">Reference</p>
          <p className="mt-2 font-mono text-[12.5px] text-paper/65">{payment.reference}</p>
        </div>

        <button type="button" onClick={onShop} className="btn-quiet mt-8 w-full sm:w-auto">
          Back to the shelf
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </div>
    </main>
  );
}
