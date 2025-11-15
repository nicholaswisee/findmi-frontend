import { CheckoutButton } from "./CheckoutButton";
import { useCartStore } from "@/store/cartStore";

export function CartSummary() {
  const { cart, isLoading, error } = useCartStore();

  const totalAmount = cart?.summary.total_amount ?? 0;
  
  return (
    <div className="w-full h-[134px] px-[16px] py-[18px] gap-[4px] lg:w-[511px] lg:h-[237px] lg:p-[40px] lg:gap-[20px] bg-white/30 rounded-xl flex flex-col shadow-md backdrop-blur-sm">
      <p className="text-[16px] lg:text-[32px] text-[#1B165E] font-extrabold">
        RINGKASAN BELANJA
      </p>

      {isLoading ? (
        <p className="text-[#1B165E] text-[24px]">Memuat...</p>
      ) : error ? (
        <p className="text-red-500 text-[24px]">{error}</p>
      ) : (
        <>
          <div className="flex justify-between items-center px-[8px]">
            <p className="text-[16px] lg:text-[24px] text-[#1B165E] font-bold">Total</p>
            <p className="text-[16px] lg:text-[24px] text-[#1B165E] font-bold">
              Rp {totalAmount.toLocaleString("id-ID")}
            </p>
          </div>

          <CheckoutButton />
        </>
      )}
    </div>
  );
}
