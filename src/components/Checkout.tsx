import { useState } from "react";
import type { Order, Payment } from "../lib/order";
import { usd } from "../lib/money";
import { Modal } from "./Modal";
import { CardForm } from "./CardForm";
import { OrderSummary } from "./OrderSummary";

/**
 * Checkout: order summary on the left, card form on the right. One method, one
 * panel, no picker to click through.
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
  return (
    <Modal open={open} onClose={onClose} label="Checkout">
      <div className="grid overflow-hidden rounded-[var(--radius-plate)] bg-paper text-ink md:grid-cols-[0.85fr_1fr]">
        <OrderSummary order={order} />
        <div className="relative p-6 sm:p-8">
          <p className="mb-4 text-[12.5px] text-ink/50 md:hidden">
            {order.lines.map((line) => `${line.quantity} × ${line.name}`).join(", ")}
          </p>
          <p className="label text-ink/45">Payment</p>
          <h2 className="mt-1 font-display text-[27px] leading-tight">Pay {usd(order.totalCents)}</h2>
          <p className="mt-1 text-[13px] text-ink/55">Test card only. Nothing is charged.</p>
          <CardForm totalCents={order.totalCents} onPaid={(reference) => onComplete({ method: "card", reference })} />
        </div>
      </div>
    </Modal>
  );
}
