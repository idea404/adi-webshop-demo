import { useState } from "react";
import { Header } from "./components/Header";
import { Storefront } from "./components/Storefront";
import { CartDrawer } from "./components/CartDrawer";
import { Checkout } from "./components/Checkout";
import { ReceiptScreen } from "./components/Receipt";
import { useCart } from "./lib/cart";
import { buildOrder, emptyOrder, type Order, type Payment } from "./lib/order";

/**
 * Two screens and two overlays: the shelf, the bag, checkout, and the receipt.
 * There is no router because there is nothing to link to; a demo that grows a
 * route table stops being a demo you can read in one sitting.
 */
export function App() {
  const { cart, add, setQuantity, clear } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [order, setOrder] = useState<Order>(emptyOrder);
  const [receipt, setReceipt] = useState<{ order: Order; payment: Payment } | null>(null);

  function startCheckout() {
    setOrder(buildOrder(cart));
    setCartOpen(false);
    setCheckoutOpen(true);
  }

  function finish(order: Order, payment: Payment) {
    setReceipt({ order, payment });
    setCheckoutOpen(false);
    clear();
  }

  return (
    <div className="min-h-dvh">
      <Header cart={cart} onOpenCart={() => setCartOpen(true)} onHome={() => setReceipt(null)} />

      {receipt ? (
        <ReceiptScreen order={receipt.order} payment={receipt.payment} onShop={() => setReceipt(null)} />
      ) : (
        <Storefront onAdd={add} />
      )}

      <CartDrawer
        open={cartOpen}
        cart={cart}
        onClose={() => setCartOpen(false)}
        onQuantity={setQuantity}
        onCheckout={startCheckout}
      />

      <Checkout
        open={checkoutOpen}
        order={order}
        onClose={() => setCheckoutOpen(false)}
        onComplete={(payment) => finish(order, payment)}
      />
    </div>
  );
}
