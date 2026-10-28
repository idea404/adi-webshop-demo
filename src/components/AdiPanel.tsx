import { useCallback, useEffect, useState } from "react";
import type { Order, Payment } from "../lib/order";
import { merchantAddress } from "../config";
import { centsToTokenUnits, shortAddress, tokenAmount } from "../lib/money";
import {
  ADI_TESTNET,
  SETTLEMENT_TOKEN,
  InsufficientTokenError,
  adiBalance,
  connectWallet,
  explorerTx,
  injectedProvider,
  mintTestTokens,
  payWithAdi,
  tokenBalance,
  transactionFinality,
  watchWallet,
  type FinalityStage,
} from "../lib/adi";
import { AdiMark } from "./AdiMark";
import { AlertIcon, ArrowLeftIcon, ArrowRightIcon, CheckIcon, ExternalIcon, Spinner } from "./Icons";

/** Enough for a demo order plus slack; the mock has no supply cap worth respecting. */
const FAUCET_AMOUNT = 100_000_000n; // 100 mUSDC at 6 decimals

type Phase =
  | { name: "disconnected" }
  | { name: "connecting" }
  | { name: "ready"; address: `0x${string}`; adiWei: bigint; tokenRaw: bigint }
  | { name: "sending"; address: `0x${string}`; tokenRaw: bigint }
  | { name: "confirming"; txHash: `0x${string}`; blockNumber: number };

/**
 * ADI step. Three visible moments: connect, confirm in the wallet, included in
 * a block. Everything else (switching chains, adding the network, checking the
 * balance) happens behind those and is described in one line under the button.
 */
export function AdiPanel({
  order,
  onBack,
  onPaid,
}: {
  order: Order;
  onBack: () => void;
  onPaid: (payment: Extract<Payment, { method: "adi" }>) => void;
}) {
  const [phase, setPhase] = useState<Phase>({ name: "disconnected" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);

  const required = centsToTokenUnits(order.totalCents, SETTLEMENT_TOKEN.decimals);
  const walletAvailable = injectedProvider() !== null;

  const refresh = useCallback(async (address: `0x${string}`) => {
    const [adiWei, tokenRaw] = await Promise.all([adiBalance(address), tokenBalance(address)]);
    setPhase({ name: "ready", address, adiWei, tokenRaw });
  }, []);

  useEffect(() => watchWallet(() => setPhase({ name: "disconnected" })), []);

  async function connect() {
    setError(null);
    setNotice("Adding ADI Chain to your wallet if it is missing…");
    setPhase({ name: "connecting" });
    try {
      const { address } = await connectWallet();
      await refresh(address);
      setNotice(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not connect the wallet.");
      setNotice(null);
      setPhase({ name: "disconnected" });
    }
  }

  /** mUSDC is a mock with an open mint; the faucet is one wallet transaction. */
  async function mint() {
    if (phase.name !== "ready") return;
    setError(null);
    setMinting(true);
    setNotice("Confirm the mint in your wallet. Test tokens cost only gas.");
    try {
      await mintTestTokens(phase.address, FAUCET_AMOUNT);
      await refresh(phase.address);
      setNotice("Test mUSDC minted.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The mint failed.");
      setNotice(null);
    } finally {
      setMinting(false);
    }
  }

  async function pay() {
    if (phase.name !== "ready") return;
    const { address, tokenRaw } = phase;
    setError(null);
    setNotice("Confirm the transfer in your wallet.");
    setPhase({ name: "sending", address, tokenRaw });
    try {
      const result = await payWithAdi(merchantAddress(), required);
      setNotice(null);
      setPhase({ name: "confirming", txHash: result.txHash, blockNumber: result.blockNumber });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The transfer failed.");
      setNotice(null);
      // Refresh rather than guess: the send may have failed before broadcasting,
      // or the balance may have changed since the check.
      await refresh(address).catch(() => setPhase({ name: "disconnected" }));
    }
  }

  return (
    <div className="min-w-0 p-6 sm:p-8">
      <button
        type="button"
        onClick={onBack}
        disabled={phase.name === "sending" || phase.name === "confirming"}
        className="mb-5 inline-flex items-center gap-1.5 text-[12.5px] text-ink/45 transition-colors hover:text-ink disabled:opacity-40"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5" />
        All payment methods
      </button>

      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink">
          <AdiMark className="h-5 w-5" />
        </span>
        <div>
          <p className="label leading-none text-ink/45">ADI Chain</p>
          <p className="mt-1 font-mono text-[11px] text-ink/35">Chain {ADI_TESTNET.id} · testnet</p>
        </div>
      </div>

      <h2 className="mt-4 font-display text-[27px] leading-tight">
        Pay {tokenAmount(required, SETTLEMENT_TOKEN.decimals)} {SETTLEMENT_TOKEN.symbol}
      </h2>
      <p className="mt-1 text-[13px] text-ink/55">Sent straight to the shop's address.</p>

      <dl className="mt-5 space-y-2 rounded-2xl border border-ink/10 bg-white/50 px-4 py-3 font-mono text-[11.5px]">
        <Row label="Token">{SETTLEMENT_TOKEN.symbol}</Row>
        <Row label="To">{shortAddress(merchantAddress())}</Row>
        <Row label="Network">ADI testnet · {ADI_TESTNET.id}</Row>
      </dl>

      {phase.name === "disconnected" || phase.name === "connecting" ? (
        <>
          <button
            type="button"
            onClick={connect}
            disabled={phase.name === "connecting" || !walletAvailable}
            className="btn-primary mt-5 w-full"
          >
            {phase.name === "connecting" ? (
              <>
                <Spinner className="h-4 w-4" />
                Connecting…
              </>
            ) : (
              <>
                Connect wallet
                <ArrowRightIcon className="h-4 w-4" />
              </>
            )}
          </button>
          {!walletAvailable ? (
            <p className="mt-3 text-center text-[12.5px] text-ink/50">
              No browser wallet detected. Install MetaMask or Rabby, then reload.
            </p>
          ) : null}
        </>
      ) : null}

      {phase.name === "ready" ? (
        <>
          <div className="mt-4 rounded-2xl border border-ink/10 bg-white/60 px-4 py-3.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-ink/45">Connected</span>
              <span className="inline-flex items-center gap-1.5 font-mono text-ink/70">
                <span className="h-1.5 w-1.5 rounded-full bg-blue" />
                {shortAddress(phase.address)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between text-[12px]">
              <span className="text-ink/45">Balance</span>
              <span className={phase.tokenRaw >= required ? "font-mono text-ink/80" : "font-mono text-burgundy"}>
                {tokenAmount(phase.tokenRaw, SETTLEMENT_TOKEN.decimals)} {SETTLEMENT_TOKEN.symbol}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-[12px]">
              <span className="text-ink/45">Gas</span>
              <span className="font-mono text-ink/60">{tokenAmount(phase.adiWei, 18, 4)} ADI</span>
            </div>
          </div>

          <button
            type="button"
            onClick={pay}
            disabled={phase.tokenRaw < required || phase.adiWei === 0n || minting}
            className="btn-primary mt-4 w-full"
          >
            <AdiMark className="h-4 w-4" />
            Pay {tokenAmount(required, SETTLEMENT_TOKEN.decimals)} {SETTLEMENT_TOKEN.symbol}
          </button>

          {/*
            A disabled button with no way forward is a dead end. The testnet token
            has an open mint, so the shortfall is one wallet transaction away and the
            panel offers it rather than telling the payer to go somewhere else.
          */}
          {phase.tokenRaw < required ? (
            <div className="mt-3 rounded-xl border border-orange/25 bg-orange/5 px-3 py-2.5">
              <p className="flex items-start gap-2 text-[12.5px] text-ink/70">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
                <span>
                  Short by {tokenAmount(required - phase.tokenRaw, SETTLEMENT_TOKEN.decimals)}{" "}
                  {SETTLEMENT_TOKEN.symbol}. It is a testnet mock, so you can mint it for free.
                </span>
              </p>
              <button
                type="button"
                onClick={mint}
                disabled={minting || phase.adiWei === 0n}
                className="btn-quiet mt-2.5 w-full border-ink/20 py-2 text-[12.5px] text-ink/75 hover:border-ink/40"
              >
                {minting ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Minting…
                  </>
                ) : (
                  `Mint ${tokenAmount(FAUCET_AMOUNT, SETTLEMENT_TOKEN.decimals)} test ${SETTLEMENT_TOKEN.symbol}`
                )}
              </button>
            </div>
          ) : null}

          {phase.adiWei === 0n ? (
            <p className="mt-3 flex items-start gap-2 rounded-xl border border-orange/25 bg-orange/5 px-3 py-2.5 text-[12.5px] text-ink/70">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
              <span>
                No ADI for gas. Minting and paying both cost a little, and ADI comes from{" "}
                <a
                  href="https://faucet.ab.testnet.adifoundation.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  the official faucet
                </a>
                , not this page.
              </span>
            </p>
          ) : null}
        </>
      ) : null}

      {phase.name === "sending" ? (
        <div className="mt-6 flex items-center gap-3 rounded-2xl border border-ink/10 bg-white/60 px-4 py-4">
          <Spinner className="h-4 w-4 shrink-0" />
          <div>
            <p className="text-[13.5px] font-medium">Waiting for your wallet</p>
            <p className="mt-0.5 text-[12px] text-ink/50">Approve the transfer in the popup.</p>
          </div>
        </div>
      ) : null}

      {phase.name === "confirming" ? (
        <Confirmation
          txHash={phase.txHash}
          blockNumber={phase.blockNumber}
          onDone={() => onPaid({ method: "adi", txHash: phase.txHash, blockNumber: phase.blockNumber })}
        />
      ) : null}

      {notice && phase.name !== "confirming" ? (
        <p className="mt-3 text-center text-[12.5px] text-ink/45">{notice}</p>
      ) : null}

      {error ? (
        <p className="mt-3 flex items-start gap-2 overflow-hidden rounded-xl border border-burgundy/20 bg-burgundy/5 px-3 py-2.5 text-[13px] text-burgundy">
          <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 break-words">{error}</span>
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-ink/45">{label}</dt>
      <dd className="text-ink/80">{children}</dd>
    </div>
  );
}

/** Inclusion is one block; finality is a batch on Ethereum and takes minutes. */
function Confirmation({
  txHash,
  blockNumber,
  onDone,
}: {
  txHash: `0x${string}`;
  blockNumber: number;
  onDone: () => void;
}) {
  const [stage, setStage] = useState<FinalityStage>("pending");

  useEffect(() => {
    if (stage === "executed") return;
    let cancelled = false;
    const timer = setInterval(async () => {
      try {
        const result = await transactionFinality(txHash);
        if (!cancelled) setStage(result.stage);
      } catch {
        // Best effort: inclusion already happened, and the receipt stands alone.
      }
    }, 10_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [stage, txHash]);

  const reached = ["pending", "committed", "executed"].indexOf(stage);

  return (
    <div className="mt-5 animate-rise rounded-2xl border border-blue/25 bg-blue/[0.04] px-4 py-5">
      <p className="flex items-center gap-2 text-[15px] font-medium text-ink">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue text-paper">
          <CheckIcon className="h-3.5 w-3.5" />
        </span>
        Payment sent
      </p>
      <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink/55">
        Included in block {blockNumber}. The shop can ship now.
      </p>

      <a
        href={explorerTx(txHash)}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11.5px] text-blue hover:underline"
      >
        {shortAddress(txHash)}
        <ExternalIcon className="h-3 w-3" />
      </a>

      <div className="mt-4 flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <span key={index} className={`h-1 flex-1 rounded-full ${reached >= index ? "bg-blue" : "bg-ink/10"}`} />
        ))}
      </div>
      <p className="mt-2 text-[11.5px] text-ink/40">
        {stage === "executed"
          ? "Executed on Ethereum. Irreversible."
          : stage === "committed"
            ? "Committed to Ethereum, waiting for execution."
            : "Sealed by the sequencer. Ethereum finality takes a few minutes."}
      </p>

      <button type="button" onClick={onDone} className="btn-primary mt-4 w-full">
        Continue
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
