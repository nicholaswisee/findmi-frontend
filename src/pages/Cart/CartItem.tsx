import { useCartStore } from "@/pages/Cart/API/Cart";
import minusImg from "@/assets/icon-minus.png";
import plusImg from "@/assets/icon-plus.png";
import fallbackImg from "@/assets/Property1=Default.png";

interface CartItemProps {
  itemId: number;
  itemType: "product" | "bundle";
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
}

export function CartItem({itemId,itemType,name,category,price,quantity,image,}: CartItemProps) {
  const { updateCartItem, deleteCartItem, isLoading } = useCartStore();

  const updateLocalQuantity = (newQty: number) => {
    useCartStore.setState((state) => {
      if (!state.cart) return state;
      const updatedItems = state.cart.items.map((item) => {
        if (item.id === itemId) {
          if (itemType === "product" && item.product_id) {
            return { ...item, quantity: newQty };
          } else if (itemType === "bundle" && item.bundle_id) {
            return { ...item, quantity: newQty };
          }
        }
        return item;
      });
      return { cart: { ...state.cart, items: updatedItems } };
    });
  };


  const handleDecrease = async () => {
    if (quantity > 1) {
      updateLocalQuantity(quantity - 1); 
      await updateCartItem(itemId, quantity - 1); 
    } else {
      useCartStore.setState((state) => {
        if (!state.cart) return state;
        const updatedItems = state.cart.items.filter(
          (item) => item.id !== itemId
        );
        return { cart: { ...state.cart, items: updatedItems } };
      });
      await deleteCartItem(itemId);
    }
  };

  const handleIncrease = async () => {
    updateLocalQuantity(quantity + 1); 
    await updateCartItem(itemId, quantity + 1); 
  };

  return (
    <div className="flex gap-[20px] items-center justify-between">
      <img
        src={image || fallbackImg}
        alt={name}
        className="w-[88px] h-[88px]"
      />

      <div className="flex flex-col w-[196px]">
        <p className="text-[16px] lg:text-[24px] text-[#1B165E] font-bold">{name}</p>
        <p className="text-[14px] lg:text-[16px] text-[#1B165E] font-semibold">{category}</p>
      </div>

      <div className="hidden lg:flex flex items-center">
        <button
          onClick={handleDecrease}
          disabled={isLoading}
          aria-label="Kurangi jumlah"
          className="hidden lg:flex hover:bg-black/30 active:brightness-150 flex w-[40px] h-[44px] border-2 border-[#050836] border-r-0 rounded-l-xl items-center justify-center"
        >
          <img src={minusImg} className="w-[24px] h-[24px]" alt="Kurangi" />
        </button>

        <div className="w-[69px] h-[44px] border-2 border-[#050836] flex items-center justify-center">
          <p className="hidden lg:flex lg:text-[24px] text-[#050836] font-bold">
            {quantity}
          </p>
        </div>

        <button
          onClick={handleIncrease}
          disabled={isLoading}
          aria-label="Tambah jumlah"
          className="hidden lg:flex hover:bg-white/30 active:brightness-300 flex w-[40px] h-[44px] border-2 border-[#050836] border-l-0 rounded-r-xl items-center justify-center"
        >
          <img src={plusImg} className="w-[24px] h-[24px]" alt="Tambah" />
        </button>
      </div>

      <p className="text-[14px] lg:text-[16px] text-[#1B165E] font-semibold">
        Rp. {price.toLocaleString("id-ID")},-
      </p>
    </div>
  );
}
