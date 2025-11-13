import { useCartStore } from "@/pages/Cart/API/Cart"

export function CheckoutButton() {
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
    <button onClick={handleCheckout} disabled={isLoading} className="
      inline-flex flex-col items-center justify-center
      w-full h-[40px] lg:w-[431px] lg:h-[38px] 
      rounded-lg lg:rounded-2xl
      drop-shadow-md/50
      bg-[#1E368F] lg:bg-[#AC166C] hover:brightness-90 active:brightness-75
      text-orange-200 text-[14px] lg:text-sm font-bold 
      transition-all
    ">
      {isLoading ? "Processing..." : "Bayar Sekarang"}
    </button>
  );
}
