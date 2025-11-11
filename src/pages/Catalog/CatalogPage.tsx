import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CatalogPage() {
  return (
    // yang ini gw bikin buat dummy aja buat pindah page dlu
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8">Catalog Page</h1>
      
      <div className="space-y-6">
        {/* Products */}
        <div>
          <h2 className="text-xl font-bold mb-4">Products</h2>
          <div className="flex gap-4">
            <Link to="/catalog/1">
              <Button>Go to Product 1 Detail</Button>
            </Link>
            <Link to="/catalog/2">
              <Button>Go to Product 2 Detail</Button>
            </Link>
            <Link to="/catalog/3">
              <Button>Go to Product 3 Detail</Button>
            </Link>
          </div>
        </div>

        {/* Bundles */}
        <div>
          <h2 className="text-xl font-bold mb-4">Bundles</h2>
                <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Bundles</h2>
        <div className="flex gap-4">
          <Link to="/catalog/bundle/1">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Go to Bundle 1 Detail
            </button>
          </Link>
          <Link to="/catalog/bundle/2">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Go to Bundle 2 Detail
            </button>
          </Link>
          <Link to="/catalog/bundle/3">
            <button className="bg-blue-500 text-white px-4 py-2 rounded">
              Go to Bundle 3 Detail
            </button>
          </Link>
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}
