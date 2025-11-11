import { CheckoutButton } from "./CheckoutButton";
import { useCartStore } from "@/pages/Cart/API/Cart";

export function CartSummary() {
  const { cart, isLoading, error } = useCartStore();

  const totalAmount = cart?.summary.total_amount ?? 0;
  const totalQuantity = cart?.summary.total_quantity ?? 0;

  return (
    <div className="w-[364px] h-[134px] px-[16px] py-[18px] gap-[4px] md:w-[511px] md:h-[237px] bg-white/30 rounded-xl flex flex-col md:p-[40px] md:gap-[20px] shadow-md backdrop-blur-sm">
      <p className="text-xl text-[#1B165E] font-extrabold">
        RINGKASAN BELANJA
      </p>

      {isLoading ? (
        <p className="text-[#1B165E] text-sm">Memuat...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : (
        <>
          <div className="flex justify-between items-center px-[8px]">
            <p className="text-sm text-[#1B165E] font-extrabold">Total Barang</p>
            <p className="text-base text-[#1B165E] font-extrabold">{totalQuantity}</p>
          </div>

          <div className="flex justify-between items-center px-[8px]">
            <p className="text-sm text-[#1B165E] font-extrabold">Total Harga</p>
            <p className="text-base text-[#1B165E] font-extrabold">
              Rp {totalAmount.toLocaleString("id-ID")}
            </p>
          </div>

          <CheckoutButton />
        </>
      )}
    </div>
  );
}
