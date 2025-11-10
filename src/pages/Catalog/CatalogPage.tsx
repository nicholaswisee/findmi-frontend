import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function CatalogPage() {
  return (
    // yang ini gw bikin buat dummy aja buat pindah page dlu
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8">Catalog Page</h1>
      
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
  );
}
