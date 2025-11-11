import { useCartStore } from "@/pages/Cart/API/Cart";
import minusImg from "@/assets/icon-minus.png";
import plusImg from "@/assets/icon-plus.png";
import fallbackImg from "@/assets/Property1=Default.png";

interface CartItemProps {
  itemId: number;
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export function CartItem({
  itemId,
  name,
  category,
  price,
  quantity,
  image,
}: CartItemProps) {
  const { updateCartItem, deleteCartItem, isLoading } = useCartStore();

  const handleDecrease = async () => {
    if (quantity > 1) {
      await updateCartItem(itemId, quantity - 1);
    } else {
      await deleteCartItem(itemId);
    }
  };

  const handleIncrease = async () => {
    await updateCartItem(itemId, quantity + 1);
  };

  return (
    <div className="flex gap-[20px] items-center">
      <img
        src={image || fallbackImg}
        alt={name}
        className="w-[88px] h-[88px]"
      />

      <div className="flex flex-col w-[196px]">
        <p className="text-base text-[#1B165E] font-bold">{name}</p>
        <p className="text-xs text-[#1B165E] font-semibold">{category}</p>
      </div>

      <div className="flex items-center">
        <button
          onClick={handleDecrease}
          disabled={isLoading}
          aria-label="Kurangi jumlah"
          className="hover:bg-black/30 active:brightness-150 flex w-[40px] h-[44px] border-2 border-[#050836] border-r-0 rounded-l-lg items-center justify-center"
        >
          <img src={minusImg} className="w-[24px] h-[24px]" alt="Kurangi" />
        </button>

        <div className="w-[69px] h-[44px] border-2 border-[#050836] flex items-center justify-center bg-white">
          <p className="text-lg text-[#050836] font-bold">{quantity}</p>
        </div>

        <button
          onClick={handleIncrease}
          disabled={isLoading}
          aria-label="Tambah jumlah"
          className="hover:bg-white/30 active:brightness-300 flex w-[40px] h-[44px] border-2 border-[#050836] border-l-0 rounded-r-lg items-center justify-center"
        >
          <img src={plusImg} className="w-[24px] h-[24px]" alt="Tambah" />
        </button>
      </div>

      <p className="text-[16px] text-[#1B165E] font-semibold">
        Rp. {price.toLocaleString("id-ID")}
      </p>
    </div>
  );
}
