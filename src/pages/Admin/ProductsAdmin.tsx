import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductTable from "@/components/admin/products/ProductTable";
import { useAdminStore } from "@/store/adminStore";
import type { ProductFormValues } from "@/components/admin/products/ProductFormDialog";

export default function ProductsAdmin() {
  const products = useAdminStore((state) => state.products);
  const loading = useAdminStore((state) => state.loadingProducts);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const pageIndex = useAdminStore((state) => state.productPageIndex);
  const pageSize = useAdminStore((state) => state.productPageSize);
  const hasNextPage = useAdminStore((state) => state.productHasNext);
  const updateProduct = useAdminStore((state) => state.updateProduct);

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts();
    }
  }, [fetchProducts, products.length]);

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchProducts({ limit: pageSize, offset: (pageIndex + 1) * pageSize });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchProducts({ limit: pageSize, offset: (pageIndex - 1) * pageSize });
  };

  const handleEditProduct = useCallback(
    async (productId: number, values: ProductFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;

      try {
        await updateProduct(productId, {
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          imageUrl: mapString(values.image_url),
          stock: values.remaining_stock,
        });
        await fetchProducts({
          limit: pageSize,
          offset: pageIndex * pageSize,
        });
        toast.success("Product updated");
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update product");
      }
    },
    [fetchProducts, pageIndex, pageSize, updateProduct],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Product Catalog</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchProducts();
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      {loading && products.length === 0 ? (
        <Skeleton className="h-full w-full rounded-xl" />
      ) : (
        <ProductTable
          data={products}
          pageIndex={pageIndex}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onEditProduct={(product, values) =>
            handleEditProduct(product.id, values)
          }
        />
      )}
    </section>
  );
}
