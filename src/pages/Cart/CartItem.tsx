import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
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
  maxQuantity?: number;
}

export function CartItem({
  itemId,
  itemType,
  name,
  category,
  price,
  quantity,
  image,
  maxQuantity,
}: CartItemProps) {
  const { updateCartItem, deleteCartItem, isMutating } = useCartStore();
  const [inputValue, setInputValue] = useState<string>(quantity.toString());

  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

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

  const applyQuantity = async (rawQty: number) => {
    if (!Number.isFinite(rawQty) || rawQty < 1) {
      setInputValue(quantity.toString());
      return;
    }
    let normalized = rawQty;
    if (typeof maxQuantity === "number" && maxQuantity > 0) {
      normalized = Math.min(rawQty, maxQuantity);
    }
    if (normalized === quantity) {
      setInputValue(normalized.toString());
      return;
    }
    updateLocalQuantity(normalized);
    await updateCartItem(itemId, normalized);
  };

  const handleDecrease = async () => {
    if (quantity > 1) {
      await applyQuantity(quantity - 1);
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
    await applyQuantity(quantity + 1);
  };

  const handleInputCommit = async () => {
    const parsed = Number(inputValue);
    if (!Number.isFinite(parsed) || parsed < 1) {
      setInputValue(quantity.toString());
      return;
    }
    await applyQuantity(parsed);
  };

  return (
    <div className="flex gap-[20px] items-center justify-between rounded-2xl border border-white/20 bg-white/5 p-3">
      <img
        src={image || fallbackImg}
        alt={name}
        className="w-[88px] h-[88px]"
      />

      <div className="flex flex-col w-[196px]">
        <p className="text-[16px] lg:text-[24px] text-[#1B165E] font-bold">
          {name}
        </p>
        <p className="text-[14px] lg:text-[16px] text-[#1B165E] font-semibold">
          {category}
        </p>
      </div>

      <div className="hidden lg:flex items-center rounded-2xl border-2 border-[#050836] bg-plain-green text-[#050836] shadow">
        <button
          onClick={handleDecrease}
          disabled={isMutating}
          aria-label="Kurangi jumlah"
          className="flex h-11 w-11 items-center justify-center border-r-2 border-[#050836] hover:bg-black/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <img src={minusImg} className="w-4 h-4" alt="Kurangi" />
        </button>
        <input
          type="number"
          min={1}
          max={typeof maxQuantity === "number" ? maxQuantity : undefined}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onBlur={handleInputCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="h-11 w-16 bg-transparent text-center text-lg font-bold text-[#050836] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={handleIncrease}
          disabled={
            isMutating ||
            (typeof maxQuantity === "number" && quantity >= maxQuantity)
          }
          aria-label="Tambah jumlah"
          className="flex h-11 w-11 items-center justify-center border-l-2 border-[#050836] hover:bg-black/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          <img src={plusImg} className="w-4 h-4" alt="Tambah" />
        </button>
      </div>

      <p className="text-[14px] lg:text-[16px] text-[#1B165E] font-semibold">
        Rp. {price.toLocaleString("id-ID")},-
      </p>
    </div>
  );
}
