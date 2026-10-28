# Meridian — a demo storefront for ADI Pay

A four-SKU coffee shop, built to be read rather than deployed. Two commits tell
the story: a shop that takes cards, then the same shop with a *Pay with ADI*
button. Everything else is identical.

```sh
bun install
bun run dev        # http://localhost:5173
```

## Reading it as a blog post

`docs/blog-post.md` is a write-up of the same change: before-and-after screenshots,
the steps an integration actually needs, and what finality means on this chain.
Images live in `docs/images/`.

## The two versions

`git log` has two commits.

**First commit — card only.** Browse, add a bag, check out, get a receipt. Card
validation is real; the processor is a 1.4 s mock in `src/lib/card.ts`.
`4242 4242 4242 4242` succeeds, any card ending `0002` declines.

**Second commit — card and ADI.** Checkout opens with a method picker. Same
order, same totals, same receipt page; ADI payments go to ADI testnet in mUSDC
and are visible on the explorer in about five seconds.

The diff is worth reading in this order:

```
src/lib/adi.ts                  chain constants, connect, pay, finality
src/components/MethodChooser.tsx
src/components/AdiPanel.tsx
src/components/Checkout.tsx     one line changed per method
```

Nothing in the catalogue, the cart or the order model changed to accommodate
ADI. That is the claim this repo is making.

## Paying with ADI

No backend. The payer's browser talks to the token contract over a public RPC;
the shop's address is a build-time constant.

Chain values below were read from live testnet, not copied from a doc:

| | |
|---|---|
| Chain id | `99999` |
| RPC | `https://rpc.ab.testnet.adifoundation.ai` |
| Explorer | `https://explorer.ab.testnet.adifoundation.ai` |
| Settlement token | mUSDC, 6 decimals, `0x9bC8244c0F531F27fe3636FFdAf2C586d11241e1` |

To try it: install MetaMask or Rabby, connect from the checkout (the page
offers to add the network), and get gas from
[the official faucet](https://faucet.ab.testnet.adifoundation.ai).

mUSDC is the exception. The official faucet is Turnstile-gated and hands out
native ADI only, but the settlement token is a mock whose `mint` is open to
anyone. So the checkout does not tell you to go and find test dollars: if you
are short, it offers to mint 100 of them in one wallet transaction (~6 s,
gas only). That is the only reason this demo needs no backend to be usable.

### No extension? Use the demo wallet

For testing and for demoing without installing anything:

```sh
bun add -d viem    # already a dependency
echo "VITE_DEV_WALLET_KEY=0x<funded testnet key>" > .env.local
bun run dev
```

`src/dev/wallet.ts` injects the smallest honest EIP-1193 provider as
`window.ethereum`: accounts, chain id, and `eth_sendTransaction`. It signs and
broadcasts with the key from the env file. It is loaded in dev only and no-ops
without the key, so a normal `bun run dev` still has no wallet, which is a state
the UI must handle anyway.

Never set that variable in a deploy. A private key in a client bundle is a
private key.

The dev wallet estimates gas and fees from the chain instead of guessing. That
matters more than it sounds: ADI requires the sender's balance to cover the
transaction's *maximum* fee, so a hardcoded `maxFeePerGas` makes a wallet holding
plenty of ADI fail validation.

### The flow the payer sees

1. **Connect.** Request accounts, then switch to ADI Chain, adding it to the
   wallet if the wallet has not seen it.
2. **Confirm.** The panel shows the connected address, its mUSDC balance and its
   ADI balance, and disables the button if either is short. One `transfer` goes
   to the wallet for approval. If the token balance is short, the mint button
   sits right there instead of sending the payer to another site.
3. **Included.** The panel waits for a receipt and shows the block plus an
   explorer link.

### Finality, honestly

ADI is a zkSync-OS L2: `pending` means sealed by the sequencer, `committed`
means the batch is on Ethereum, `executed` means it cannot be reverted.
Measured while building this: inclusion in ~4.5 s, still `pending` after 115 s.
Batches commit on their own schedule and an idle chain does not advance the
frontier at all.

So the UI treats **inclusion as paid** — the shop can ship — and shows finality
as a three-segment bar underneath, filling in as the batch progresses. Calling a
one-block transfer "settled" would be a lie; showing "pending confirmation" on a
paid order would frighten the customer.

## Design notes

- **The ADI button looks like a payment method, not a wallet.** Same size and
  weight as the card option; the ADI mark carries the only colour.
- **Money is integer cents everywhere.** Token amounts are `bigint` raw units.
- **One receipt component, two reference rows.** A processor id or a transaction
  hash. The rest is identical because the rest *is* identical.
- **Native ADI is not accepted, deliberately.** Pricing in ADI needs a rate,
  and a rate needs a feed; a hard-coded one would make the demo's totals a lie.
  mUSDC is 1:1 with the dollar, so the arithmetic stays exact. A production shop
  that wants to settle in ADI would quote against an oracle inside the payment
  intent's expiry window.
- **Errors are one sentence.** Wallet providers bury the real reason inside two
  layers of viem `cause`, and often in a `details` field rather than a message.
  `collectCauses` in `src/lib/adi.ts` walks the whole chain, skips wrapper
  phrases, and surfaces the specific one: "You rejected the request in your
  wallet" or "Not enough ADI in this wallet to cover the network fee."
- **Implement `wallet_sendTransaction` too, if you write a provider.** viem
  retries with it when `eth_sendTransaction` rejects, and an unimplemented retry
  replaces the original error with a useless one.
- **Native `<dialog>`.** Focus trapping, Escape, inertness and backdrop come
  from the platform.

## Files worth reading

```
src/lib/adi.ts                 chain constants, wallet, payment, finality
src/lib/card.ts                mock processor, formatting, validation
src/lib/order.ts               order shape and totals
src/components/Checkout.tsx    method picker and panels
src/components/AdiPanel.tsx    connect, confirm, included
src/components/CardForm.tsx    the before
src/data/products.ts           the catalogue
src/dev/wallet.ts              dev-only injected wallet
```

## What is deliberately missing

No inventory, tax, email, webhooks, server-side order record, real processor
integration or cart sync across devices. Each is something a shop needs; none is
what this demo is showing.
