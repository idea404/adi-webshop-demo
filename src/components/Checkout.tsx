import { useState } from "react";
import type { Order, Payment } from "../lib/order";
import { usd } from "../lib/money";
import { Modal } from "./Modal";
import { CardForm } from "./CardForm";
import { OrderSummary } from "./OrderSummary";
import { MethodChooser, type Method } from "./MethodChooser";
import { AdiPanel } from "./AdiPanel";
import { injectedProvider } from "../lib/adi";

/**
 * Checkout. Card and ADI are peers: a picker in front, one panel behind it, and
 * the same order summary on the left either way. The card flow is untouched by
 * the ADI flow, which is the point.
 */
export function Checkout({
  open,
  order,
  onClose,
  onComplete,
}: {
  open: boolean;
  order: Order;
  onClose: () => void;
  onComplete: (payment: Payment) => void;
}) {
  const [method, setMethod] = useState<Method | null>(null);

  function close() {
    setMethod(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={close} label="Checkout">
      <div className="grid overflow-hidden rounded-[var(--radius-plate)] bg-paper text-ink md:grid-cols-[0.85fr_1fr]">
        <OrderSummary order={order} />

        {method === null ? (
          <MethodChooser canPayAdi={injectedProvider() !== null} onChoose={setMethod} />
        ) : null}

        {method === "card" ? (
          <div className="min-w-0 p-6 sm:p-8">
            <button
              type="button"
              onClick={() => setMethod(null)}
              className="mb-5 text-[12.5px] text-ink/45 transition-colors hover:text-ink"
            >
              ← All payment methods
            </button>
            <p className="mb-4 text-[12.5px] text-ink/50 md:hidden">
              {order.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")} · {usd(order.totalCents)}
            </p>
            <p className="label text-ink/45">Card</p>
            <h2 className="mt-1 font-display text-[27px] leading-tight">Pay {usd(order.totalCents)}</h2>
            <p className="mt-1 text-[13px] text-ink/55">Test card only. Nothing is charged.</p>
            <CardForm totalCents={order.totalCents} onPaid={(reference) => onComplete({ method: "card", reference })} />
          </div>
        ) : null}

        {method === "adi" ? (
          <AdiPanel order={order} onBack={() => setMethod(null)} onPaid={onComplete} />
        ) : null}
      </div>
    </Modal>
  );
}
