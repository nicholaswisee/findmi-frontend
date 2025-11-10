import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
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

type ApiResponse = {
  success: boolean;
  message: string;
  data: Product; // Data adalah object, bukan array!
};

export default function ProductDetailPage() {
  const { product_id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        console.log("Fetching product with ID:", product_id);
        const url = `https://api.akumasukitb.com/product/${product_id}`;
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
          throw new Error(`Product not found: ${response.status}`);
        }
        
        const result: ApiResponse = await response.json();
        console.log("API Response:", result);
        
        if (result.success && result.data) {
          console.log("Product loaded:", result.data);
          setProduct(result.data); // Data sudah langsung object Product
        } else {
          console.error("No product data in response");
          throw new Error("Product not found");
        }
        
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error(`Failed to load product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        navigate("/catalog");
      } finally {
        setLoading(false);
      }
    };

    if (product_id) {
      fetchProduct();
    }
  }, [product_id, navigate]);

  const handleAddToCart = async () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }

    try {
      // TODO: Uncomment untuk POST ke backend
      // const response = await fetch("https://api.akumasukitb.com/cart", {
      //   method: "POST",
      //   credentials: 'include',
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     product_id: product?.id,
      //     quantity,
      //     size: selectedSize,
      //   }),
      // });
      // if (!response.ok) {
      //   throw new Error("Failed to add to cart");
      // }
      
      // Dummy success untuk development
      console.log("Adding to cart:", {
        product_id: product?.id,
        quantity,
        size: selectedSize,
      });
      
      toast.success(`Added ${quantity}x ${product?.name} (Size: ${selectedSize}) to cart!`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.remaining_stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
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
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Product Detail Card */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-dashed border-teal-600 p-6 md:p-10">
        <div className="flex flex-col md:flex-row gap-8">
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
                {product.remaining_stock > 0 ? "Tersedia" : "Habis"}
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
              <div className="flex items-center border-2 border-gray-800 rounded-full overflow-hidden bg-white">
                <button
                  onClick={decrementQuantity}
                  className="px-3 py-1.5 hover:bg-gray-100 transition-colors font-bold text-lg"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="px-4 py-1.5 font-bold min-w-[50px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={incrementQuantity}
                  className="px-3 py-1.5 hover:bg-gray-100 transition-colors font-bold text-lg"
                  disabled={quantity >= product.remaining_stock}
                >
                  +
                </button>
              </div>

              {/* Wishlist Button */}
              <Button
                variant="outline"
                size="icon"
                className="rounded-full border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white h-10 w-10"
              >
                <ShoppingCart className="size-5" />
              </Button>

              {/* Add to Cart Button */}
              <Button
                onClick={handleAddToCart}
                disabled={product.remaining_stock === 0}
                className="flex-1 bg-pink-500 hover:bg-pink-600 text-white rounded-full py-2.5 font-bold text-sm uppercase tracking-wide"
              >
                ADD TO CART
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
