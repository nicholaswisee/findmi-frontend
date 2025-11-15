import { useCartStore } from "@/store/cartStore";

export function CheckoutButton() {
  const { createOrder, cart, isMutating } = useCartStore();
  const hasItems = (cart?.items?.length ?? 0) > 0;

  const handleCheckout = async () => {
    if (!cart || !hasItems || isMutating) return;
    const items = cart.items.map((item) => {
      if (item.bundle_id && item.bundle_id > 0) {
        return { bundleId: item.bundle_id, quantity: item.quantity };
      }
      return { productId: item.product_id, quantity: item.quantity };
    });

    const result = await createOrder(items);
    if (result) {
      console.log("Order sukses:", result.order);
      const redirectUrl =
        typeof result === "object" &&
        result !== null &&
        "payment" in result &&
        typeof (result as any).payment === "object"
          ? (result as any).payment?.redirectUrl
          : undefined;
      if (redirectUrl) {
        console.log("Redirect URL Midtrans:", redirectUrl);
      }
    }
  };

  const disabled = isMutating || !hasItems;

  return (
    <button
      onClick={handleCheckout}
      disabled={disabled}
      className={`mx-auto mt-4 block w-full rounded-lg py-1 px-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
        disabled
          ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
          : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
      }`}
    >
      {isMutating
        ? "Processing..."
        : hasItems
        ? "Bayar Sekarang"
        : "Keranjang kosong"}
    </button>
  );
}
