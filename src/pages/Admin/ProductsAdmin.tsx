import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ProductTable from "@/components/admin/products/ProductTable";
import {
  ProductFormDialog,
  type ProductFormValues,
} from "@/components/admin/products/ProductFormDialog";
import { useAdminStore } from "@/store/adminStore";
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
import type { Product, UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
const SEARCH_DEBOUNCE_MS = 1000;

const SIZE_PRIORITY = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"] as const;
const sizePriorityMap = new Map<string, number>(
  SIZE_PRIORITY.map((size, index) => [size, index])
);

const normalizeAndOrderSizes = (sizes?: string[]) => {
  if (!sizes) return [];
  const normalized = sizes
    .map((size) => size?.trim().toUpperCase())
    .filter((size): size is string => Boolean(size));
  const unique = Array.from(new Set(normalized));
  unique.sort((a, b) => {
    const priorityA = sizePriorityMap.get(a);
    const priorityB = sizePriorityMap.get(b);
    if (priorityA !== undefined && priorityB !== undefined) {
      return priorityA - priorityB;
    }
    if (priorityA !== undefined) return -1;
    if (priorityB !== undefined) return 1;
    return a.localeCompare(b);
  });
  return unique;
};

export default function ProductsAdmin() {
  const products = useAdminStore((state) => state.products);
  const loading = useAdminStore((state) => state.loadingProducts);
  const fetchProducts = useAdminStore((state) => state.fetchProducts);
  const pageIndex = useAdminStore((state) => state.productPageIndex);
  const pageSize = useAdminStore((state) => state.productPageSize);
  const hasNextPage = useAdminStore((state) => state.productHasNext);
  const totalProducts = useAdminStore((state) => state.productTotal);
  const updateProduct = useAdminStore((state) => state.updateProduct);
  const createProduct = useAdminStore((state) => state.createProduct);
  const deleteProduct = useAdminStore((state) => state.deleteProduct);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const emptyProduct = useMemo<Product>(
    () => ({
      id: 0,
      name: "",
      price: 0,
      category: "All",
      description: "",
      image_urls: [],
      remaining_stock: 0,
      available_sizes: [],
      options: [],
    }),
    []
  );

  useEffect(() => {
    if (products.length === 0) {
      fetchProducts().catch((err) => {
        toast.error(err instanceof Error ? err.message : "Gagal memuat produk");
      });
    }
  }, [fetchProducts, products.length]);

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchProducts({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
      department: departmentFilter,
      search: appliedSearchTerm,
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchProducts({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      department: departmentFilter,
      search: appliedSearchTerm,
    });
  };

  const handleEditProduct = useCallback(
    async (productId: number, values: ProductFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;
      const normalizeUrls = (urls?: string[]) => {
        if (!urls) return undefined;
        const trimmed = urls.map((url) => url.trim()).filter(Boolean);
        return trimmed.length ? trimmed : undefined;
      };
      try {
        await updateProduct(productId, {
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          image_urls: normalizeUrls(values.image_urls),
          stock: values.remaining_stock,
          available_sizes: normalizeAndOrderSizes(values.available_sizes),
          options: values.options,
        });
        await fetchProducts({
          limit: pageSize,
          offset: pageIndex * pageSize,
          department: departmentFilter,
          search: appliedSearchTerm,
        });
        toast.success("Produk berhasil diperbarui");
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal memperbarui produk");
      }
    },
    [
      departmentFilter,
      fetchProducts,
      pageIndex,
      pageSize,
      appliedSearchTerm,
      updateProduct,
    ]
  );

  const handleCreateProduct = useCallback(
    async (values: ProductFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;
      const normalizeUrls = (urls?: string[]) => {
        if (!urls) return undefined;
        const trimmed = urls.map((url) => url.trim()).filter(Boolean);
        return trimmed.length ? trimmed : undefined;
      };
      try {
        await createProduct({
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          image_urls: normalizeUrls(values.image_urls),
          stock: values.remaining_stock,
          available_sizes: normalizeAndOrderSizes(values.available_sizes),
          options: values.options,
        });
        toast.success("Produk berhasil dibuat");
        await fetchProducts({
          limit: pageSize,
          offset: pageIndex * pageSize,
          department: departmentFilter,
          search: appliedSearchTerm,
        });
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal membuat produk");
      }
    },
    [
      appliedSearchTerm,
      createProduct,
      departmentFilter,
      fetchProducts,
      pageIndex,
      pageSize,
    ]
  );

  const handleDepartmentChange = (value: DepartmentFilterValue) => {
    setDepartmentFilter(value);
    fetchProducts({
      limit: pageSize,
      offset: 0,
      department: value,
      search: appliedSearchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal menerapkan filter"
      );
    });
  };

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === appliedSearchTerm) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAppliedSearchTerm(trimmed);
      fetchProducts({
        limit: pageSize,
        offset: 0,
        department: departmentFilter,
        search: trimmed,
      }).catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal menerapkan pencarian"
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [
    appliedSearchTerm,
    departmentFilter,
    fetchProducts,
    pageSize,
    searchTerm,
  ]);

  const handleResetFilters = () => {
    setDepartmentFilter("all");
    setSearchTerm("");
    setAppliedSearchTerm("");
    fetchProducts({
      limit: pageSize,
      offset: 0,
      department: "all",
      search: "",
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengatur ulang filter"
      );
    });
  };

  const handleDeleteProduct = useCallback(
    async (productId: number) => {
      try {
        await deleteProduct(productId);
        const isLastItemOnPage = products.length === 1 && pageIndex > 0;
        const nextOffset = isLastItemOnPage
          ? (pageIndex - 1) * pageSize
          : pageIndex * pageSize;
        await fetchProducts({
          limit: pageSize,
          offset: nextOffset,
          department: departmentFilter,
          search: appliedSearchTerm,
        });
        toast.success("Produk berhasil dihapus");
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal menghapus produk");
      }
    },
    [
      appliedSearchTerm,
      deleteProduct,
      departmentFilter,
      fetchProducts,
      pageIndex,
      pageSize,
      products.length,
    ]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Product Catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProductFormDialog
            product={emptyProduct}
            onSubmit={handleCreateProduct}
            trigger={<Button type="button">Add Product</Button>}
            title="Add new product"
            description="Fill out the details to add a new product."
            submitLabel="Create product"
          />
          <Button
            variant="outline"
            onClick={() => {
              fetchProducts({
                limit: pageSize,
                offset: pageIndex * pageSize,
                department: departmentFilter,
                search: appliedSearchTerm,
              }).catch((err) => {
                toast.error(
                  err instanceof Error ? err.message : "Gagal memuat ulang data"
                );
              });
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
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
          />
          <p className="text-xs text-muted-foreground">
            Search updates automatically after a short pause.
          </p>
        </div>
        <div className="flex items-center">
          <Button
            onClick={handleResetFilters}
            className="w-full"
            variant="secondary"
            disabled={loading}
          >
            Reset Filters
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
          total={totalProducts}
          onEditProduct={(product, values) =>
            handleEditProduct(product.id, values)
          }
          onDeleteProduct={(product) => handleDeleteProduct(product.id)}
        />
      )}
    </section>
  );
}
