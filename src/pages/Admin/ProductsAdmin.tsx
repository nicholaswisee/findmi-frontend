import { useEffect } from "react";

import { columns } from "@/components/admin/products/columns";
import { DataTable } from "@/components/admin/products/data-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/store/adminStore";

export default function ProductsAdmin() {
  const products = useAdminStore((state) => state.products);
  const loading = useAdminStore((state) => state.loadingProducts);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Product Catalog</p>
        </div>
        <Button variant="outline" onClick={fetchProducts} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading && products.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <DataTable columns={columns} data={products} />
      )}
    </section>
  );
}
