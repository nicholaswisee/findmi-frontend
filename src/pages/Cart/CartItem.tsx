import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import minusImg from "@/assets/icon-minus.png";
import plusImg from "@/assets/icon-plus.png";

interface CartItemProps {
  itemId: number;
  itemType: "product" | "bundle";
  name: string;
  category: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string;
  option?: string;
  maxQuantity?: number;
  bundleItems?: Array<{
    productId: number;
    name: string;
    amount: number;
    size?: string;
  }>;
}

export function CartItem({
  itemId,
  itemType,
  name,
  category,
  price,
  quantity,
  image,
  size,
  option,
  maxQuantity,
  bundleItems = [],
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

  const desktopQuantity = (
    <div className="flex items-center rounded-2xl border-2 border-[#050836] bg-plain-green text-[#050836] shadow">
      <button
        onClick={handleDecrease}
        disabled={isMutating}
        aria-label="Kurangi jumlah"
        className="flex h-11 w-11 items-center justify-center border-r-2 border-[#050836] transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <img src={minusImg} className="h-4 w-4" alt="Kurangi" />
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
        className="flex h-11 w-11 items-center justify-center border-l-2 border-[#050836] transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <img src={plusImg} className="h-4 w-4" alt="Tambah" />
      </button>
    </div>
  );

  const hasBundleItems =
    itemType === "bundle" && Array.isArray(bundleItems) && bundleItems.length > 0;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/20 bg-white/5 p-3 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex flex-1 items-start gap-4 sm:items-center">
          <img
            src={image || "/global/background-plain-hijau.webp"}
            alt={name}
            className="h-[88px] w-[88px] flex-shrink-0 rounded-2xl object-cover"
          />

          <div className="flex flex-1 flex-col">
            <p className="text-[16px] font-bold text-[#1B165E] lg:text-[24px]">
              {name}
            </p>
            <p className="text-[14px] font-semibold text-[#1B165E] lg:text-[16px]">
              {category}
            </p>
            {size && (
              <p className="text-xs font-semibold uppercase text-[#1B165E]/80">
                Ukuran: {size}
              </p>
            )}
            {option && (
              <p className="text-xs font-semibold text-[#1B165E]/80">
                Opsi: {option}
              </p>
            )}
          </div>
        </div>

        <div className="hidden flex-1 items-center justify-end gap-8 lg:flex">
          {desktopQuantity}
          <p className="text-[16px] font-semibold text-[#1B165E]">
            Rp. {price.toLocaleString("id-ID")},-
          </p>
        </div>
      </div>

      {hasBundleItems && (
        <div className="hidden flex-col gap-1 rounded-2xl border border-white/10 bg-white/10 p-3 text-sm text-[#1B165E] lg:flex">
          {bundleItems!.map((bundleItem) => (
            <div
              key={`${bundleItem.productId}-${bundleItem.amount}`}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="font-semibold text-[#1B165E]">
                {bundleItem.name} (x{bundleItem.amount})
              </span>
              {bundleItem.size && (
                <span className="text-xs font-bold uppercase text-[#1B165E]/80">
                  Ukuran: {bundleItem.size}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/20 p-3 shadow-inner lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[#1B165E]">Jumlah</p>
          {desktopQuantity}
        </div>
        {size && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#1B165E]">Ukuran</p>
            <p className="text-base font-bold text-[#1B165E] uppercase">
              {size}
            </p>
          </div>
        )}
        {option && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-[#1B165E]">Opsi</p>
            <p className="text-base font-bold text-[#1B165E]">{option}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[#1B165E]">Harga</p>
          <p className="text-base font-bold text-[#1B165E]">
            Rp. {price.toLocaleString("id-ID")},-
          </p>
        </div>
        {hasBundleItems && (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-[#1B165E]">Detail Bundle</p>
            <ul className="space-y-1 text-xs text-[#1B165E]">
              {bundleItems!.map((bundleItem) => (
                <li
                  key={`${bundleItem.productId}-${bundleItem.amount}-mobile`}
                  className="flex justify-between gap-2"
                >
                  <span className="font-semibold">{bundleItem.name}</span>
                  <span className="text-right">
                    x{bundleItem.amount}
                    {bundleItem.size ? ` • ${bundleItem.size}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
