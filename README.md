# Meridian — a demo storefront

A four-SKU coffee shop, built to be read rather than deployed. Card payments go
through a mock processor; there is no backend, no cart server and no router.

```sh
bun install
bun run dev        # http://localhost:5173
```

This is the first of two commits. It is a normal shop with one way to pay. The
second commit adds ADI Chain as a second checkout method, and reading that diff
is the point of the repository. If you want ADI payments, check that commit out;
nothing below depends on them.

## What it does

Browse the shelf, add a bag, check out with a card, get a receipt. That is the
whole shop.

Card validation is real (length, expiry month, CVC, name) and the processor is a
1.4 s sleep that returns a reference. `4242 4242 4242 4242` succeeds; any card
ending `0002` declines, so the failure path is demoable.

## Design notes

- **Money is integer cents everywhere.** Formatting happens at the edges and
  nowhere else.
- **Two screens and two overlays.** Shelf, receipt, bag drawer, checkout modal.
  No route table, because there is nothing to link to.
- **Native dialogs.** `showModal()` gives focus trapping, Escape, inertness and
  backdrop for free; a hand-rolled modal would be three bugs waiting.
- **One dark palette, one accent.** The label plates carry the colour; the UI
  stays out of their way.

## Files worth reading

```
src/lib/card.ts              mock processor, formatting, validation
src/lib/order.ts             order shape and totals
src/lib/cart.ts              persisted cart state
src/components/Checkout.tsx  the checkout panel
src/data/products.ts         the catalogue
```

## What is deliberately missing

No cart persistence across devices, no inventory, no tax, no email, no webhooks,
no server-side order record and no real processor integration. Each of those is
something a shop needs and none of them is what this demo is showing.
