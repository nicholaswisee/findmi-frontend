import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { toast } from "sonner";
import minusImg from "@/assets/icon-minus.png";
import plusImg from "@/assets/icon-plus.png";
import ProductGrid from "@/components/catalog/ProductGrid";
import { useProductStore } from "@/store/catalogStore";
import { useAuthStore } from "@/store/authStore";

const API_URL = import.meta.env.VITE_API_URL;

// Types based on API response
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_urls: string[];
  remaining_stock: number;
  available_sizes: string[];
};

type BundleItem = {
  product_id: number;
  amount: number;
};

type Bundle = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_urls: string[];
  bundle_items: BundleItem[];
  is_hidden: boolean;
};

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
};

export default function ProductDetailPage() {
  const { product_id, bundle_id } = useParams<{
    product_id?: string;
    bundle_id?: string;
  }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const catalogProducts = useProductStore((s) => s.products);

  // Check if this is a bundle (URL contains /bundle/)
  const isBundle = window.location.pathname.includes("/bundle/");

  // Use bundle_id if available, otherwise use product_id
  const itemId = isBundle ? bundle_id : product_id;

  const [product, setProduct] = useState<Product | Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [bundleSizeSelections, setBundleSizeSelections] = useState<
    Record<number, string>
  >({});

  const status = useProductStore((s) => s.status);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  // Fetch products for recommendation section
  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  const FALLBACK_PRODUCT_IMAGE = "/global/background-plain-hijau.webp";

  const getProductImages = (imageUrls?: string[]) => {
    if (!imageUrls || imageUrls.length === 0) {
      return [FALLBACK_PRODUCT_IMAGE];
    }
    return imageUrls;
  };

  // Helper: Check if product is a Bundle
  const isProductBundle = (item: Product | Bundle | null): item is Bundle => {
    return item !== null && "bundle_items" in item;
  };

  // Helper: Get stock (bundle always available, product has remaining_stock)
  const getStock = () => {
    if (!product) return 0;
    if (isProductBundle(product)) return 999; // Bundle always available
    return product.remaining_stock;
  };

  const bundleItems = useMemo(() => {
    if (!product || !isProductBundle(product) || !product.bundle_items) {
      return [];
    }
    return product.bundle_items.map((item) => {
      const detail = catalogProducts.find((p) => p.id === item.product_id);
      const availableSizes =
        detail && Array.isArray(detail.available_sizes)
          ? detail.available_sizes
          : [];
      return {
        ...item,
        name: detail?.name ?? `Produk #${item.product_id}`,
        category: detail?.category ?? undefined,
        availableSizes,
      };
    });
  }, [product, catalogProducts]);

  const sizeOptions = useMemo(() => {
    if (!product || isProductBundle(product)) return [];
    const sizes = Array.isArray(product.available_sizes)
      ? product.available_sizes
      : [];
    return sizes
      .map((size) => size?.trim())
      .filter((size): size is string => Boolean(size));
  }, [product]);

  useEffect(() => {
    if (!product || isProductBundle(product)) {
      setSelectedSize("");
      return;
    }
    const sizes = Array.isArray(product.available_sizes)
      ? product.available_sizes
      : [];
    setSelectedSize((current) =>
      current && sizes.includes(current) ? current : sizes[0] ?? ""
    );
  }, [product]);

  useEffect(() => {
    if (!product || !isProductBundle(product)) {
      setBundleSizeSelections({});
      return;
    }
    setBundleSizeSelections((current) => {
      const nextSelections: Record<number, string> = {};
      for (const item of bundleItems) {
        const currentValue = current[item.product_id];
        if (
          currentValue &&
          item.availableSizes.includes(currentValue)
        ) {
          nextSelections[item.product_id] = currentValue;
        }
      }
      return nextSelections;
    });
  }, [product, bundleItems]);


  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // Determine if fetching bundle or product
        const endpoint = isBundle ? "bundle" : "product";
        const url = `${API_URL}/${endpoint}/${itemId}`;

        console.log(`Fetching ${endpoint} with ID:`, itemId);
        console.log("Fetch URL:", url);

        const response = await fetch(url, {
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        });

        console.log("Response status:", response.status);
        console.log("Response ok:", response.ok);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Error response:", errorText);
          throw new Error(`${endpoint} not found: ${response.status}`);
        }

        const result: ApiResponse<Product | Bundle> = await response.json();
        console.log("API Response:", result);

        if (result.success && result.data) {
          console.log(`${endpoint} loaded:`, result.data);
          if ("remaining_stock" in result.data) {
            console.log("Remaining stock:", result.data.remaining_stock);
          }
          setProduct(result.data);
        } else {
          console.error(`No ${endpoint} data in response`);
          throw new Error(`${endpoint} not found`);
        }
      } catch (error) {
        console.error(
          `Error fetching ${isBundle ? "bundle" : "product"}:`,
          error
        );
        toast.error(
          `Gagal memuat ${isBundle ? "bundel" : "produk"}: ${
            error instanceof Error ? error.message : "Kesalahan tidak diketahui"
          }`
        );
        navigate("/catalog");
      } finally {
        setLoading(false);
      }
    };

    if (itemId) {
      fetchProduct();
    }
  }, [itemId, navigate, isBundle]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Silakan login untuk menambahkan ke keranjang.");
      return;
    }
    if (sizeOptions.length > 0 && !selectedSize) {
      toast.error("Silakan pilih ukuran terlebih dahulu");
      return;
    }

    let bundleSelectionsPayload:
      | { productId: number; size: string }[]
      | undefined;
    if (product && isProductBundle(product)) {
      bundleSelectionsPayload = [];
      for (const bundleItem of bundleItems) {
        if (bundleItem.availableSizes.length === 0) continue;
        const chosenSize = bundleSizeSelections[bundleItem.product_id];
        if (!chosenSize) {
          toast.error(
            `Pilih ukuran untuk ${bundleItem.name ?? "produk di bundle"}`
          );
          return;
        }
        bundleSelectionsPayload.push({
          productId: bundleItem.product_id,
          size: chosenSize,
        });
      }
    }

    try {
      const requestBody = isProductBundle(product)
        ? {
            bundleId: product.id,
            quantity,
            bundleSelections: bundleSelectionsPayload,
          }
        : product
        ? {
            productId: product.id,
            quantity,
            size:
              sizeOptions.length > 0 && selectedSize ? selectedSize : undefined,
          }
        : null;

      if (!requestBody) {
        throw new Error("Produk tidak ditemukan");
      }

      console.log("Adding to cart:", requestBody);

      const response = await fetch(`${API_URL}/cart/items`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Add to cart response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Add to cart error:", errorData);
        throw new Error(
          errorData.message || "Gagal menambahkan produk ke keranjang"
        );
      }

      const result = await response.json();
      console.log("Add to cart success:", result);

      toast.success(`Berhasil menambahkan ${product?.name} ke keranjang!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(
        `Gagal menambahkan ke keranjang: ${
          error instanceof Error ? error.message : "Kesalahan tidak diketahui"
        }`
      );
    }
  };

  const incrementQuantity = () => {
    const stock = getStock();
    if (product && quantity < stock) {
      setQuantity(quantity + 1);
      console.log("Incremented to:", quantity + 1);
    } else {
      console.log("Cannot increment. Quantity:", quantity, "Stock:", stock);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
      console.log("Decremented to:", quantity - 1);
    } else {
      console.log("Cannot decrement below 1");
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (value === "") {
      setQuantity(1);
      return;
    }

    const numValue = parseInt(value, 10);

    if (!isNaN(numValue)) {
      const stock = getStock();
      if (numValue >= 1 && numValue <= stock) {
        setQuantity(numValue);
        console.log("Quantity changed to:", numValue);
      } else if (numValue > stock) {
        setQuantity(stock);
        toast.error(`Maksimal banyaknya ${stock} sesuai stock`);
        console.log("Quantity capped at stock:", stock);
      } else if (numValue < 1) {
        setQuantity(1);
        console.log("Quantity minimum is 1");
      }
    }
  };

  const handleBundleSizeChange = (productId: number, size: string) => {
    setBundleSizeSelections((prev) => ({
      ...prev,
      [productId]: size,
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p>Produk tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto px-4 py-6 max-w-4xl sm:px-6 lg:py-10">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-[#FFEABB]">
            <li>
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li>
              <Link
                to="/catalog"
                className="hover:text-white transition-colors"
              >
                Catalog
              </Link>
            </li>
            <ChevronRight className="w-4 h-4" />
            <li className="font-semibold text-[#FFD88C]">{product.name}</li>
          </ol>
        </nav>
        {/* Product Detail Card */}
        <div className="rounded-2xl border border-white/0 bg-[#463B8B]/15 p-6 md:p-10 max-w-4xl mx-auto">
          <div className="flex flex-col justify-center md:flex-row gap-20">
            {/* Left: Product Images */}
            <div className="md:w-[45%]">
              {/* Main Image */}
              <div className="bg-plain-green rounded-lg mb-3 aspect-square flex items-center justify-center overflow-hidden border border-gray-200">
                <img
                  src={
                    getProductImages(product.image_urls)[selectedImage] ||
                    product.image_urls?.[0] ||
                    FALLBACK_PRODUCT_IMAGE
                  }
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2">
                {getProductImages(product.image_urls).map(
                  (image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`bg-plain-green rounded aspect-square flex items-center justify-center overflow-hidden border-2 transition-all w-24 h-24 flex-1 ${
                        selectedImage === index
                          ? "border-[#ffd88c]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-contain p-2"
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Right: Product Info */}
            <div className="flex flex-col text-[#FFEABB] md:flex-1">
              {/* Merch Type & Stock */}
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold uppercase tracking-wide text-[#FFD88C]">
                  {product.category}
                </span>
                <span className="text-xs font-semibold text-[#FFEABB]">
                  {getStock() > 0 ? `Tersedia (Stock: ${getStock()})` : "Habis"}
                </span>
              </div>

              {/* Product Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-[#FFD88C] drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] mb-3">
                {product.name}
              </h1>

              {/* Price */}
              <p className="text-2xl md:text-3xl font-bold text-[#FFC76E] mb-5">
                {product.price.toLocaleString("id-ID")}
              </p>

              {sizeOptions.length > 0 && (
                <div className="mb-5">
                  <h3 className="text-sm font-body font-bold text-[#FFD88C] mb-2">
                    Ukuran
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {sizeOptions.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-1.5 rounded-full border-2 font-semibold text-sm transition-colors ${
                          selectedSize === size
                            ? "bg-[#c62d76] text-[#ffeabb] border-[#c62d76]"
                            : "bg-transparent text-[#ffeabb] border-[#ffeabb]/60 hover:bg-[#ffeabb]/15"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Description */}
              <div className="mb-6 grow">
                <h3 className="text-sm font-body font-bold text-[#FFD88C] mb-2">
                  Deskripsi Produk
                </h3>
                <p className="text-sm leading-relaxed text-[#FFD88C]">
                  {product.description}
                </p>
                {isProductBundle(product) && bundleItems.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/10 p-4">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[#FFD88C]">
                      Isi Bundle
                    </p>
                    <div className="space-y-3">
                      {bundleItems.map((bundleItem) => (
                        <div
                          key={`${bundleItem.product_id}-${bundleItem.amount}`}
                          className="rounded-xl bg-white/5 p-3 text-sm text-[#FFEABB]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex flex-col">
                              <span className="font-semibold">
                                {bundleItem.name}
                              </span>
                              {bundleItem.category && (
                                <span className="text-xs text-[#FFEABB]/70">
                                  {bundleItem.category}
                                </span>
                              )}
                            </span>
                            <span className="text-sm font-bold text-[#FFD88C]">
                              x{bundleItem.amount}
                            </span>
                          </div>
                          {bundleItem.availableSizes.length > 0 ? (
                            <div className="mt-2">
                              <p className="text-xs font-semibold text-[#FFEABB]/80">
                                Pilih ukuran
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {bundleItem.availableSizes.map((size) => {
                                  const isActive =
                                    bundleSizeSelections[bundleItem.product_id] ===
                                    size;
                                  return (
                                    <button
                                      key={`${bundleItem.product_id}-${size}`}
                                      type="button"
                                      onClick={() =>
                                        handleBundleSizeChange(
                                          bundleItem.product_id,
                                          size
                                        )
                                      }
                                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase transition ${
                                        isActive
                                          ? "border-[#c62d76] bg-[#c62d76] text-white"
                                          : "border-white/40 text-[#FFEABB] hover:bg-white/10"
                                      }`}
                                    >
                                      {size}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : (
                            <p className="mt-1 text-xs text-[#FFEABB]/70">
                              Ukuran bebas / satu ukuran
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#FFEABB]">
                    Jumlah
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center rounded-2xl border-2 border-[#050836] bg-plain-green text-[#050836] shadow">
                      <button
                        type="button"
                        onClick={decrementQuantity}
                        className="flex h-12 w-12 items-center justify-center border-r-2 border-[#050836] hover:bg-black/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={quantity <= 1}
                        aria-label="Kurangi jumlah"
                      >
                        <img src={minusImg} alt="Kurangi" className="h-5 w-5" />
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={handleQuantityChange}
                        min="1"
                        max={getStock()}
                        className="h-12 w-16 bg-transparent text-center text-xl font-bold text-[#050836] outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={incrementQuantity}
                        className="flex h-12 w-12 items-center justify-center border-l-2 border-[#050836] hover:bg-black/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={!product || quantity >= getStock()}
                        aria-label="Tambah jumlah"
                      >
                        <img src={plusImg} alt="Tambah" className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={getStock() === 0 || !isAuthenticated}
                  className={`mt-2 block w-full rounded-lg py-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
                    getStock() === 0 || !isAuthenticated
                      ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                      : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
                  }`}
                >
                  {getStock() === 0
                    ? "Stok Habis"
                    : !isAuthenticated
                    ? "Login terlebih dahulu"
                    : "Tambah ke Keranjang"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <h2 className="text-3xl font-bold text-[#FFD88C] mb-8 drop-shadow-[0.5px_3px_0px_rgba(0,0,0,0.3)] text-center">
          Pilihan Untuk Kamu
        </h2>
        <ProductGrid showSearch={false} maxItems={30} />
      </div>
    </>
  );
}
