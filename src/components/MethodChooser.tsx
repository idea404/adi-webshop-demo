import { AdiMark } from "./AdiMark";
import { ArrowRightIcon, CardIcon } from "./Icons";

export type Method = "card" | "adi";

/**
 * Method picker. Card first because it is the incumbent; ADI second and styled
 * as a peer, same size and weight, no "crypto" sidebar energy.
 */
export function MethodChooser({
  canPayAdi,
  onChoose,
}: {
  canPayAdi: boolean;
  onChoose: (method: Method) => void;
}) {
  return (
    <div className="min-w-0 p-6 sm:p-8">
      <p className="label text-ink/45">Payment</p>
      <h2 className="mt-1 font-display text-[27px] leading-tight">How would you like to pay?</h2>

      <div className="mt-6 space-y-3">
        <button
          type="button"
          onClick={() => onChoose("card")}
          className="group flex w-full items-center gap-4 rounded-2xl border border-ink/12 bg-white/60 px-4 py-4 text-left transition-all duration-150 hover:border-ink/30 hover:bg-white"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-paper">
            <CardIcon className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-medium">Pay by card</span>
            <span className="block text-[12.5px] text-ink/50">Visa, Mastercard, Amex</span>
          </span>
          <ArrowRightIcon className="h-4 w-4 text-ink/30 transition-transform group-hover:translate-x-0.5 group-hover:text-ink/60" />
        </button>

        <button
          type="button"
          onClick={() => onChoose("adi")}
          disabled={!canPayAdi}
          className="group flex w-full items-center gap-4 rounded-2xl border border-blue/25 bg-blue/[0.04] px-4 py-4 text-left transition-all duration-150 hover:border-blue/60 hover:bg-blue/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink">
            <AdiMark className="h-6 w-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-medium">Pay with ADI</span>
            <span className="block text-[12.5px] text-ink/50">
              {canPayAdi ? "mUSDC on ADI Chain, settles in seconds" : "Needs a browser wallet"}
            </span>
          </span>
          <ArrowRightIcon className="h-4 w-4 text-blue/50 transition-transform group-hover:translate-x-0.5 group-hover:text-blue" />
        </button>
      </div>

      <p className="mt-6 text-center text-[12px] text-ink/40">
        Demo checkout. No card is charged; ADI payments move testnet tokens.
      </p>
    </div>
  );
}
