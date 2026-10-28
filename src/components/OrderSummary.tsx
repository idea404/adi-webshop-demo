import { usd } from "../lib/money";
import type { Order } from "../lib/order";

/** The dark left panel of checkout. Same numbers in every payment flow, so it is shared. */
export function OrderSummary({ order }: { order: Order }) {
  return (
    <aside className="relative hidden flex-col justify-between bg-ink px-6 py-7 text-paper sm:px-7 md:flex">
      <div>
        <p className="label text-paper/40">Order {order.id}</p>
        <ul className="mt-5 space-y-3.5">
          {order.lines.map((line) => (
            <li key={line.id} className="flex items-baseline justify-between gap-4 text-[13.5px]">
              <span className="text-paper/80">
                {line.name}
                <span className="ml-1.5 font-mono text-[12px] text-paper/45">×{line.quantity}</span>
              </span>
              <span className="font-mono text-paper/70">{usd(line.unitCents * line.quantity)}</span>
            </li>
          ))}
        </ul>
      </div>

      <dl className="mt-8 space-y-2 border-t border-white/10 pt-4 text-[13px]">
        <div className="flex justify-between text-paper/50">
          <dt>Subtotal</dt>
          <dd className="font-mono">{usd(order.subtotalCents)}</dd>
        </div>
        <div className="flex justify-between text-paper/50">
          <dt>Shipping</dt>
          <dd className="font-mono">{order.shippingCents === 0 ? "Free" : usd(order.shippingCents)}</dd>
        </div>
        <div className="flex items-baseline justify-between pt-2 text-[15px]">
          <dt>Total</dt>
          <dd className="font-mono">{usd(order.totalCents)}</dd>
        </div>
      </dl>
    </aside>
  );
}
