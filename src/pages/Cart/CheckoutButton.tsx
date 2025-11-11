import { useCartStore } from "@/pages/Cart/API/Cart"

export function CheckoutButton() {
  const { createOrder, cart, isLoading, error } = useCartStore();

  const handleCheckout = async () => {
    console.log('DIPENCET');
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
    <button onClick={handleCheckout} disabled={isLoading} className="
      inline-flex flex-col items-center justify-center
      gap-2 px-36 py-0.5
      rounded-2xl
      drop-shadow-lg
      bg-[#AC166C] hover:brightness-90 active:brightness-75
      text-orange-200 text-xl font-bold
      transition-all
    ">
      {isLoading ? "Processing..." : "Bayar Sekarang"}
    </button>
  );
}
