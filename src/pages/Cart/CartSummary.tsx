import { CheckoutButton } from "./CheckoutButton";
import { useCartStore } from "@/store/cartStore";

export function CartSummary() {
  const { cart, isLoading, error } = useCartStore();

  const totalQuantity = cart?.summary.total_quantity ?? 0;
  const subtotal = cart?.summary.total_amount ?? 0;
  const tax = Math.round(subtotal * 0.11);
  const grandTotal = subtotal + tax;

  return (
    <div className="w-full rounded-3xl border border-white/15 bg-white/10 p-4 text-[#1B165E] shadow-lg backdrop-blur sm:p-6 lg:p-10">
      <p className="text-lg font-extrabold text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] sm:text-2xl lg:text-3xl">
        RINGKASAN BELANJA
      </p>

      {isLoading ? (
        <p className="text-xl text-[#1B165E]">Memuat...</p>
      ) : error ? (
        <p className="text-xl text-red-500">{error}</p>
      ) : (
        <>
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
