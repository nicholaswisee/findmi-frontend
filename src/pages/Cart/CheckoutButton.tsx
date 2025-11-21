import { useCartStore } from "@/store/cartStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { loadMidtransSnap } from "@/utils/midtransSnap";

export function CheckoutButton() {
  const { createOrder, cart, isMutating } = useCartStore();
  const hasItems = (cart?.items?.length ?? 0) > 0;
  const navigate = useNavigate();

  const trySnapPayment = async (token?: string) => {
    if (!token) return false;
    try {
      await loadMidtransSnap();
      if (!window.snap) throw new Error("Midtrans Snap SDK tidak ditemukan.");
      window.snap.pay(token, {
        onSuccess: () => {
          toast.success("Pembayaran berhasil.");
          navigate("/profile/history");
        },
        onPending: () => {
          toast.message("Pembayaran masih tertunda.");
          navigate("/profile/history");
        },
        onError: () => {
          toast.error("Pembayaran gagal. Silakan coba lagi.");
        },
        onClose: () => {
          toast.message("Jendela pembayaran ditutup sebelum selesai.");
        },
      });
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat Midtrans Snap.");
      return false;
    }
  };

  const handleCheckout = async () => {
    if (!cart || !hasItems || isMutating) return;
    const items: Array<{
      productId?: number;
      bundleId?: number;
      quantity: number;
      size?: string | null;
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
        });
      }
    }

    const result = await createOrder(items);
    if (result) {
      toast.success("Pesanan berhasil dibuat.");
      const payment = result.payment ?? null;
      if (await trySnapPayment(payment?.transactionToken)) return;
      if (payment?.checkoutPath) {
        navigate(payment.checkoutPath);
        return;
      }
      if (payment?.checkoutUrl) {
        window.location.href = payment.checkoutUrl;
        return;
      }
      navigate("/profile/history");
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
