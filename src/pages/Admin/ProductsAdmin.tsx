import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductTable from "@/components/admin/products/ProductTable";
import { useAdminStore } from "@/store/adminStore";
import type { ProductFormValues } from "@/components/admin/products/ProductFormDialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";
import type { UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";

export default function ProductsAdmin() {
  const products = useAdminStore((state) => state.products);
  const loading = useAdminStore((state) => state.loadingProducts);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const pageIndex = useAdminStore((state) => state.productPageIndex);
  const pageSize = useAdminStore((state) => state.productPageSize);
  const hasNextPage = useAdminStore((state) => state.productHasNext);
  const updateProduct = useAdminStore((state) => state.updateProduct);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load products",
        );
      });
    }
  }, [fetchProducts, products.length]);

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchProducts({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
      department: departmentFilter,
      search: searchTerm,
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchProducts({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      department: departmentFilter,
      search: searchTerm,
    });
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
          department: departmentFilter,
          search: searchTerm,
        });
        toast.success("Product updated");
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update product");
      }
    },
    [
      departmentFilter,
      fetchProducts,
      pageIndex,
      pageSize,
      searchTerm,
      updateProduct,
    ],
  );

  const handleDepartmentChange = (value: DepartmentFilterValue) => {
    setDepartmentFilter(value);
    fetchProducts({
      limit: pageSize,
      offset: 0,
      department: value,
      search: searchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply filter",
      );
    });
  };

  const handleSearchSubmit = () => {
    fetchProducts({
      limit: pageSize,
      offset: 0,
      department: departmentFilter,
      search: searchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply search",
      );
    });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Product Catalog</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            fetchProducts({
              limit: pageSize,
              offset: pageIndex * pageSize,
              department: departmentFilter,
              search: searchTerm,
            }).catch((err) => {
              toast.error(
                err instanceof Error ? err.message : "Failed to refresh",
              );
            });
          }}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr_auto]">
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={departmentFilter}
            onValueChange={(value) =>
              handleDepartmentChange(value as DepartmentFilterValue)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="product-search">Search by name</Label>
          <Input
            id="product-search"
            placeholder="Type product name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSearchSubmit();
              }
            }}
          />
        </div>
        <div className="flex items-end">
          <Button
            onClick={handleSearchSubmit}
            className="w-full"
            variant="secondary"
            disabled={loading}
          >
            Apply Filters
          </Button>
        </div>
      </div>

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
