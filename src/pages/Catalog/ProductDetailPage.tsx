import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ChevronRight } from "lucide-react";
import { toast } from "sonner";

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
  const isBundle = window.location.pathname.includes('/bundle/');
  
  // Use bundle_id if available, otherwise use product_id
  const itemId = isBundle ? bundle_id : product_id;
  
  const [product, setProduct] = useState<Product | Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("M"); // Default size
  const [quantity, setQuantity] = useState(1);

  // Dummy sizes - karena API tidak return sizes
  const availableSizes = ["S", "M", "L", "XL", "XXL"];
  
  // Dummy multiple images - karena API hanya return 1 image_url
  const getProductImages = (imageUrl: string) => {
    return [imageUrl, imageUrl, imageUrl, imageUrl]; // Pakai image yang sama untuk semua thumbnail
  };

  // Helper: Check if product is a Bundle
  const isProductBundle = (item: Product | Bundle | null): item is Bundle => {
    return item !== null && 'bundle_items' in item;
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
        const endpoint = isBundle ? 'bundle' : 'product';
        const url = `https://api.akumasukitb.com/${endpoint}/${itemId}`;
        
        console.log(`Fetching ${endpoint} with ID:`, itemId);
        console.log("Fetch URL:", url);
        
        const response = await fetch(url, {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
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
          if ('remaining_stock' in result.data) {
            console.log("Remaining stock:", result.data.remaining_stock);
          }
          setProduct(result.data);
        } else {
          console.error(`No ${endpoint} data in response`);
          throw new Error(`${endpoint} not found`);
        }
        
      } catch (error) {
        console.error(`Error fetching ${isBundle ? 'bundle' : 'product'}:`, error);
        toast.error(`Failed to load ${isBundle ? 'bundle' : 'product'}: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      toast.error("Please select a size");
      return;
    }

    try {
      const requestBody = isProductBundle(product)
        ? { productId: null, bundleId: product.id, quantity }
        : { productId: product?.id, bundleId: null, quantity };

      console.log("Adding to cart:", requestBody);

      const response = await fetch("https://api.akumasukitb.com/cart/items", {
        method: "POST",
        credentials: 'include',
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Add to cart response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Add to cart error:", errorData);
        throw new Error(errorData.message || "Failed to add to cart");
      }

      const result = await response.json();
      console.log("Add to cart success:", result);
      
      toast.success(`Added ${quantity}x ${product?.name} to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(`Failed to add to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    if (value === '') {
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
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <ol className="flex items-center gap-2 text-sm text-white/80">
          <li>
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li>
            <Link to="/catalog" className="hover:text-white transition-colors">
              Catalog
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          <li className="text-white font-semibold">
            {product.name}
          </li>
        </ol>
      </nav>

      {/* Product Detail Card */}
      <div className=" backdrop-blur-sm rounded-lg shadow-lg p-6 md:p-10">
        <div className="flex flex-col  justify-center md:flex-row gap-15">
          {/* Left: Product Images */}
          <div className="md:w-[45%]">
            {/* Main Image */}
            <div className="bg-white rounded-lg mb-3 aspect-square flex items-center justify-center overflow-hidden border border-gray-200">
              <img
                src={getProductImages(product.image_url)[selectedImage] || product.image_url}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
            </div>

            {/* Thumbnail Images */}
            <div className="flex gap-2">
              {getProductImages(product.image_url).map((image: string, index: number) => (
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
              ))}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="flex flex-col">
            {/* Merch Type & Stock */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                {product.category}
              </span>
              <span className="text-xs font-semibold text-gray-700">
                {getStock() > 0 ? `Tersedia (Stock: ${getStock()})` : "Habis"}
              </span>
            </div>

            {/* Product Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              {product.name}
            </h1>

            {/* Price */}
            <p className="text-2xl md:text-3xl font-bold text-red-600 mb-5">
              {product.price.toLocaleString("id-ID")}
            </p>

            {/* Size Selection */}
            <div className="mb-5">
              <h3 className="font-bold text-sm mb-2 text-gray-900">SIZE</h3>
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
              <h3 className="font-bold text-sm mb-2 text-gray-900">PRODUCT DESCRIPTION</h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {product.description}
              </p>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border-2 border-teal-700 rounded-full overflow-hidden bg-teal-100/50 shrink-0">
                <button
                  type="button"
                  onClick={decrementQuantity}
                  className="px-4 py-2 hover:bg-teal-200/50 transition-colors font-bold text-xl text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
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
                  className="px-4 py-2 font-bold w-[70px] text-center text-teal-900 bg-transparent border-0 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={incrementQuantity}
                  className="px-4 py-2 hover:bg-teal-200/50 transition-colors font-bold text-xl text-teal-800 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  disabled={!product || quantity >= getStock()}
                >
                  +
                </button>
              </div>

              {/* Wishlist Button */}
              <Button
                variant="outline"
                size="icon"
                className="rounded-2xl border-2 border-pink-500 bg-pink-500 text-white hover:bg-pink-600 hover:border-pink-600 h-12 w-12 shrink-0"
              >
                <ShoppingCart className="size-5" />
              </Button>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={getStock() === 0}
                className={`flex-1 h-12 px-5 text-md font-semibold rounded-xl  shadow-lg drop-shadow-[0px_3.5px_0px_rgba(0,0,0,0.3)] transition-all uppercase tracking-wide ${
                  getStock() === 0
                    ? "bg-[#E13B25] text-[#FFE59A] cursor-not-allowed"
                    : "bg-[#C11B7D] text-[#FFE59A] hover:shadow-xl active:ring-2 active:ring-[#FFE59A]"
                }`}
              >
                {getStock() === 0 ? "STOK HABIS" : "ADD TO CART"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
