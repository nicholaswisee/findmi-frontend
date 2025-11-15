import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ProductGrid from "@/components/catalog/ProductGrid";
import { useProductStore } from "@/store/catalogStore";

// Types based on API response
type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  description: string;
  image_url: string;
  remaining_stock: number;
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
  image_url: string;
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

  // Check if this is a bundle (URL contains /bundle/)
  const isBundle = window.location.pathname.includes("/bundle/");

  // Use bundle_id if available, otherwise use product_id
  const itemId = isBundle ? bundle_id : product_id;

  const [product, setProduct] = useState<Product | Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("M"); // Default size
  const [quantity, setQuantity] = useState(1);

  const status = useProductStore((s) => s.status);
  const fetchProducts = useProductStore((s) => s.fetchProducts);

  // Fetch products for recommendation section
  useEffect(() => {
    if (status === "idle") {
      fetchProducts();
    }
  }, [status, fetchProducts]);

  // Dummy sizes - karena API tidak return sizes
  const availableSizes = ["S", "M", "L", "XL", "XXL"];

  // Dummy multiple images - karena API hanya return 1 image_url
  const getProductImages = (imageUrl: string) => {
    return [imageUrl, imageUrl, imageUrl, imageUrl]; // Pakai image yang sama untuk semua thumbnail
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);

        // Determine if fetching bundle or product
        const endpoint = isBundle ? "bundle" : "product";
        const url = `https://api.akumasukitb.com/${endpoint}/${itemId}`;

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
    if (!selectedSize && !isProductBundle(product)) {
      toast.error("Silakan pilih ukuran terlebih dahulu");
      return;
    }

    try {
      const requestBody = isProductBundle(product)
        ? { bundleId: product.id, quantity }
        : product
        ? { productId: product.id, quantity }
        : null;

      if (!requestBody) {
        throw new Error("Produk tidak ditemukan");
      }

      console.log("Adding to cart:", requestBody);

      const response = await fetch("https://api.akumasukitb.com/cart/items", {
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
        <div className="backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-10 max-w-4xl mx-auto">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-12">
            {/* Left: Product Images */}
            <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
              {/* Main Image */}
              <div className="bg-white rounded-lg mb-3 aspect-square flex items-center justify-center overflow-hidden border border-gray-200">
                <img
                  src={
                    getProductImages(product.image_url)[selectedImage] ||
                    product.image_url
                  }
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
                />
              </div>

              {/* Thumbnail Images */}
              <div className="flex gap-2">
                {getProductImages(product.image_url).map(
                  (image: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`bg-white rounded aspect-square flex items-center justify-center overflow-hidden border-2 transition-all flex-1 ${
                        selectedImage === index
                          ? "border-teal-500"
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
            <div className="flex flex-col text-[#FFEABB]">
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

              {/* Size Selection */}
              <div className="mb-5">
                <h3 className="text-sm font-bold text-[#FFEABB] mb-2">SIZE</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-1.5 rounded-full border-2 font-semibold text-sm transition-colors ${
                        selectedSize === size
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-transparent text-gray-700 border-blue-600 hover:bg-blue-50"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Description */}
              <div className="mb-6 grow">
                <h3 className="text-sm font-bold text-[#FFEABB] mb-2">
                  PRODUCT DESCRIPTION
                </h3>
                <p className="text-sm leading-relaxed text-[#FFEABB]">
                  {product.description}
                </p>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col gap-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-[#FFEABB]">
                    Jumlah
                  </p>
                  <div className="flex items-center overflow-hidden rounded-xl border-2 border-[#FFE59A] bg-[#FFE59A]/10">
                    <button
                      type="button"
                      onClick={decrementQuantity}
                      className="px-4 py-2 text-xl font-bold text-[#1B165E] transition-colors hover:bg-[#FFE59A]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={handleQuantityChange}
                      min="1"
                      max={getStock()}
                      className="w-[70px] border-0 bg-transparent px-4 py-2 text-center text-lg font-bold text-[#1B165E] outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={incrementQuantity}
                      className="px-4 py-2 text-xl font-bold text-[#1B165E] transition-colors hover:bg-[#FFE59A]/30 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!product || quantity >= getStock()}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={getStock() === 0}
                  className={`mt-2 block w-full rounded-lg py-2 text-base font-semibold drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all ${
                    getStock() === 0
                      ? "cursor-not-allowed bg-[#7a1644] text-[#ffeabb]/60 opacity-80"
                      : "bg-[#c62d76] text-[#ffeabb] hover:brightness-105 active:brightness-95"
                  }`}
                >
                  {getStock() === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
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
