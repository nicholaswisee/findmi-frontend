import { useCartStore } from "@/store/cartStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ManualPaymentButton() {
  const { cart, isMutating, createManualOrder } = useCartStore();
  const hasItems = (cart?.items?.length ?? 0) > 0;
  const navigate = useNavigate();

  const handleManualCheckout = async () => {
    if (!cart || !hasItems || isMutating) return;

    const items: Array<{
      productId?: number;
      bundleId?: number;
      quantity: number;
      size?: string | null;
      option?: string | null;
      bundleSelections?: { productId: number; size?: string | null }[];
    }> = [];

    for (const item of cart.items) {
      if (item.bundle_id && item.bundle_id > 0) {
        items.push({
          bundleId: item.bundle_id,
          quantity: item.quantity,
          bundleSelections: (item.selected_bundle_items ?? []).map(
            (selection) => ({
              productId: selection.product_id,
              size: selection.size,
            })
          ),
        });
        continue;
      }

      if (item.product_id && item.product_id > 0) {
        items.push({
          productId: item.product_id,
          quantity: item.quantity,
          size: item.selected_size ?? undefined,
          option: item.selected_option ?? undefined,
        });
      }
    }

    const result = await createManualOrder(items);
    if (result?.order?.id) {
      toast.success("Pesanan manual dibuat. Lanjutkan unggah bukti pembayaran.");
      navigate(`/payment/manual/${result.order.id}`);
      return;
    }

    toast.error("Gagal membuat pesanan manual.");
  };

  const disabled = isMutating || !hasItems;

  return (
    <button
      onClick={handleManualCheckout}
      disabled={disabled}
      className={`mx-auto mt-2 block w-full rounded-lg py-1 px-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
        disabled
          ? "cursor-not-allowed bg-[#1b165e]/30 text-[#ffeabb]/60 opacity-80"
          : "bg-[#5f92e0] text-white hover:brightness-105 active:brightness-95"
      }`}
    >
      {isMutating
        ? "Processing..."
        : hasItems
        ? "Bayar Manual (QRIS)"
        : "Keranjang kosong"}
    </button>
  );
}
