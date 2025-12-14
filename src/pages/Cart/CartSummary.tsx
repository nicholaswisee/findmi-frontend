import { CheckoutButton } from "./CheckoutButton";
import { DELIVERY_FEE, useCartStore } from "@/store/cartStore";

export function CartSummary() {
  const {
    cart,
    isLoading,
    error,
    fulfillmentMethod,
  } = useCartStore();

  const cartItems = cart?.items ?? [];

  const isAboveXL = (size?: string | null) => {
    const normalized = size?.trim().toUpperCase();
    if (!normalized || !normalized.endsWith("L")) return false;
    const numericMatch = normalized.match(/^(\d+)XL$/);
    if (numericMatch) return Number(numericMatch[1]) >= 2;
    const xMatch = normalized.match(/^(X+)L$/);
    return !!(xMatch?.[1] && xMatch[1].length >= 2);
  };

  const SIZE_SURCHARGE = 15000;

  const computeProductUnitPrice = (item: (typeof cartItems)[number]) => {
    const base =
      typeof item.product?.price === "number" ? item.product.price : 0;
    const optionPrice =
      item.selected_option && Array.isArray(item.product?.options)
        ? item.product.options.find(
            (opt) =>
              opt?.label?.toUpperCase() === item.selected_option?.toUpperCase()
          )?.additional_price ?? 0
        : 0;
    const sizeExtra =
      item.selected_size && isAboveXL(item.selected_size) ? SIZE_SURCHARGE : 0;
    return base + optionPrice + sizeExtra;
  };

  const computeBundleUnitPrice = (item: (typeof cartItems)[number]) => {
    const bundle = item.bundle;
    if (!bundle) return 0;
    const base = typeof bundle.price === "number" ? bundle.price : 0;
    const selections = item.selected_bundle_items ?? [];
    let extras = 0;
    // Cart bundle payload here lacks full product option metadata; apply size surcharge only.
    for (const sel of selections) {
      const sizeExtra = sel.size && isAboveXL(sel.size) ? SIZE_SURCHARGE : 0;
      extras += sizeExtra;
    }
    return base + extras;
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const unitPrice = item.bundle
      ? computeBundleUnitPrice(item)
      : computeProductUnitPrice(item);
    return acc + unitPrice * (item.quantity ?? 0);
  }, 0);

  const totalQuantity = cartItems.reduce(
    (acc, item) => acc + (item.quantity ?? 0),
    0
  );
  const deliveryFee = fulfillmentMethod === "Delivery" ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="w-full rounded-3xl border border-white/0 bg-[#463B8B]/15 p-4 text-[#1B165E] shadow-lg sm:p-6 lg:p-10">
      <p className="text-lg font-extrabold text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] sm:text-2xl lg:text-3xl">
        RINGKASAN BELANJA
      </p>

      {isLoading ? (
        <p className="text-xl text-[#1B165E]">Memuat...</p>
      ) : error ? (
        <p className="text-xl text-red-500">{error}</p>
      ) : (
        <>
          <div className="mt-6 space-y-3 text-[#1B165E]">
            <p className="text-sm font-semibold sm:text-base">Ringkasan</p>
          </div>
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-[#1B165E]">
              <span className="text-sm font-semibold sm:text-base">
                Jumlah Item
              </span>
              <span className="text-sm font-semibold sm:text-base">
                {totalQuantity}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#1B165E]">
              <span className="text-sm font-semibold sm:text-base">
                Subtotal
              </span>
              <span className="text-sm font-semibold sm:text-base">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex items-center justify-between text-[#1B165E]">
              <span className="text-sm font-semibold sm:text-base">
                Biaya Pengiriman
              </span>
              <span className="text-sm font-semibold sm:text-base">
                Rp {deliveryFee.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-px bg-[#1B165E]/20" />
            <div className="flex items-center justify-between text-[#1B165E]">
              <span className="text-lg font-bold sm:text-xl lg:text-2xl">
                Total
              </span>
              <span className="text-lg font-bold sm:text-xl lg:text-2xl">
                Rp {grandTotal.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <CheckoutButton />
          </div>
        </>
      )}
    </div>
  );
}
