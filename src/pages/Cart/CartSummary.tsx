import { CheckoutButton } from "./CheckoutButton";
import { DELIVERY_FEE, useCartStore } from "@/store/cartStore";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export function CartSummary() {
  const {
    cart,
    isLoading,
    error,
    fulfillmentMethod,
    setFulfillmentMethod,
    deliveryDetails,
    updateDeliveryDetails,
  } = useCartStore();

  const totalQuantity = cart?.summary.total_quantity ?? 0;
  const subtotal = cart?.summary.total_amount ?? 0;
  const tax = Math.round(subtotal * 0.11);
  const deliveryFee = fulfillmentMethod === "Delivery" ? DELIVERY_FEE : 0;
  const grandTotal = subtotal + tax + deliveryFee;

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
            <p className="text-sm font-semibold sm:text-base">
              Pilih Metode Pengambilan
            </p>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/25 p-3 shadow-sm transition hover:border-white/30">
                <input
                  type="radio"
                  className="h-4 w-4 border-[#1B165E]"
                  name="fulfillment"
                  value="OTS"
                  checked={fulfillmentMethod === "OTS"}
                  onChange={() => setFulfillmentMethod("OTS")}
                />
                <div className="text-sm">
                  <p className="font-semibold">Ambil di Tempat (OTS)</p>
                  <p className="text-xs text-[#1B165E]/80">Gratis</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/25 p-3 shadow-sm transition hover:border-white/30">
                <input
                  type="radio"
                  className="h-4 w-4 border-[#1B165E]"
                  name="fulfillment"
                  value="Delivery"
                  checked={fulfillmentMethod === "Delivery"}
                  onChange={() => setFulfillmentMethod("Delivery")}
                />
                <div className="text-sm">
                  <p className="font-semibold">Delivery</p>
                  <p className="text-xs text-[#1B165E]/80">
                    + Rp {DELIVERY_FEE.toLocaleString("id-ID")}
                  </p>
                </div>
              </label>
            </div>
            <p className="text-xs text-[#1B165E]/70">
              Untuk pengambilan di tempat, tunjukkan QR Code pesananmu kepada
              admin.
            </p>
            {fulfillmentMethod === "Delivery" && (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-[#1B165E]">
                  Data Pengiriman
                </p>
                <Input
                  placeholder="Nama penerima"
                  value={deliveryDetails.contactName}
                  onChange={(event) =>
                    updateDeliveryDetails({ contactName: event.target.value })
                  }
                  className="bg-white/70"
                />
                <Input
                  placeholder="Nomor telepon"
                  value={deliveryDetails.phone}
                  onChange={(event) =>
                    updateDeliveryDetails({ phone: event.target.value })
                  }
                  className="bg-white/70"
                />
                <Textarea
                  placeholder="Alamat lengkap"
                  value={deliveryDetails.address}
                  onChange={(event) =>
                    updateDeliveryDetails({ address: event.target.value })
                  }
                  className="bg-white/70"
                  rows={3}
                />
                <Textarea
                  placeholder="Catatan tambahan (opsional)"
                  value={deliveryDetails.notes}
                  onChange={(event) =>
                    updateDeliveryDetails({ notes: event.target.value })
                  }
                  className="bg-white/70"
                  rows={2}
                />
              </div>
            )}
          </div>
          <div className="mt-6 space-y-3">
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
                PPN (11%)
              </span>
              <span className="text-sm font-semibold sm:text-base">
                Rp {tax.toLocaleString("id-ID")}
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
