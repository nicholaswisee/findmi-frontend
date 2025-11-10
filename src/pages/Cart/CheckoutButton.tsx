import { useCartStore } from "@/pages/Cart/API/Cart"

function CheckoutButton() {
  const { createOrder, cart, isLoading, error } = useCartStore();

  const handleCheckout = async () => {
    if (!cart) return;
    const items = cart.items.map((item) => ({
      productId: item.product_id,
      bundleId: item.bundle_id ?? 0,
      quantity: item.quantity,
    }));

    const result = await createOrder(items);
    if (result) {
      console.log("Order sukses:", result.order);
      console.log("Redirect URL Midtrans:", result.payment.redirectUrl);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      {isLoading ? "Processing..." : "Checkout"}
    </button>
  );
}
