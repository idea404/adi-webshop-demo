import { useState, type ReactNode } from "react";
import { usd } from "../lib/money";
import { ArrowRightIcon, AlertIcon, CardIcon, LockIcon, Spinner } from "./Icons";
import { CardDeclinedError, cardProblem, chargeCard, formatCardNumber, formatExpiry, type CardDetails } from "../lib/card";

const emptyCard: CardDetails = { number: "", expiry: "", cvc: "", name: "" };

const TEST_CARD = "4242 4242 4242 4242";

/**
 * Card form. Errors appear after the first submit rather than while typing: a
 * red border under a half-typed number is noise, not help.
 */
export function CardForm({ totalCents, onPaid }: { totalCents: number; onPaid: (reference: string) => void }) {
  const [card, setCard] = useState<CardDetails>(emptyCard);
  const [status, setStatus] = useState<"idle" | "paying">("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const problem = submitted ? cardProblem(card) : null;

  async function pay() {
    setSubmitted(true);
    const firstProblem = cardProblem(card);
    if (firstProblem) {
      setError(firstProblem);
      return;
    }
    setError(null);
    setStatus("paying");
    try {
      onPaid(await chargeCard(card, totalCents));
    } catch (caught) {
      setError(caught instanceof CardDeclinedError ? caught.message : "The payment failed. Try again.");
      setStatus("idle");
    }
  }

  return (
    <>
      <div className="mt-6 space-y-3.5">
        <Field label="Card number" hint={TEST_CARD}>
          <div className="relative">
            <input
              inputMode="numeric"
              autoComplete="cc-number"
              value={card.number}
              onChange={(event) => setCard({ ...card, number: formatCardNumber(event.target.value) })}
              className="field pr-10 font-mono text-[14px]"
              placeholder="1234 1234 1234 1234"
              data-invalid={problem?.toLowerCase().includes("card number") ? "true" : undefined}
            />
            <CardIcon className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/30" />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Expiry">
            <input
              inputMode="numeric"
              autoComplete="cc-exp"
              value={card.expiry}
              onChange={(event) => setCard({ ...card, expiry: formatExpiry(event.target.value) })}
              className="field font-mono text-[14px]"
              placeholder="MM/YY"
            />
          </Field>
          <Field label="CVC">
            <input
              inputMode="numeric"
              autoComplete="cc-csc"
              value={card.cvc}
              onChange={(event) => setCard({ ...card, cvc: event.target.value.replace(/\D/g, "").slice(0, 4) })}
              className="field font-mono text-[14px]"
              placeholder="123"
            />
          </Field>
        </div>

        <Field label="Name on card">
          <input
            autoComplete="cc-name"
            value={card.name}
            onChange={(event) => setCard({ ...card, name: event.target.value })}
            className="field"
            placeholder="Ada Lovelace"
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-burgundy/20 bg-burgundy/5 px-3 py-2.5 text-[13px] text-burgundy">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      ) : null}

      <button type="button" onClick={pay} disabled={status === "paying"} className="btn-primary mt-5 w-full">
        {status === "paying" ? (
          <>
            <Spinner className="h-4 w-4" />
            Authorising…
          </>
        ) : (
          <>
            Pay {usd(totalCents)}
            <ArrowRightIcon className="h-4 w-4" />
          </>
        )}
      </button>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-ink/40">
        <LockIcon className="h-3.5 w-3.5" />
        Card details never leave this page
      </p>
    </>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[12px] font-medium text-ink/60">{label}</span>
        {hint ? <span className="font-mono text-[10.5px] text-ink/35">{hint}</span> : null}
      </span>
      {children}
    </label>
  );
}
