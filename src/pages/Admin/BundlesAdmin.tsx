import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import BundleTable from "@/components/admin/bundles/BundleTable";
import {
  BundleFormDialog,
  type BundleFormValues,
} from "@/components/admin/bundles/BundleFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Bundle, UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
const SEARCH_DEBOUNCE_MS = 1000;

export default function BundlesAdmin() {
  const bundles = useAdminStore((state) => state.bundles);
  const loading = useAdminStore((state) => state.loadingBundles);
  const fetchBundles = useAdminStore((state) => state.fetchBundles);
  const pageIndex = useAdminStore((state) => state.bundlePageIndex);
  const pageSize = useAdminStore((state) => state.bundlePageSize);
  const hasNextPage = useAdminStore((state) => state.bundleHasNext);
  const totalBundles = useAdminStore((state) => state.bundleTotal);
  const updateBundle = useAdminStore((state) => state.updateBundle);
  const createBundle = useAdminStore((state) => state.createBundle);
  const deleteBundle = useAdminStore((state) => state.deleteBundle);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const emptyBundle = useMemo<Bundle>(
    () => ({
      id: 0,
      name: "",
      description: "",
      image_urls: [],
      price: 0,
      category: "none",
      is_hidden: false,
      bundle_items: [{ product_id: 0, amount: 1 }],
    }),
    []
  );

  useEffect(() => {
    if (bundles.length === 0) {
      fetchBundles().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat bundel"
        );
      });
    }
  }, [bundles.length, fetchBundles]);

  const fetchWithFilters = useCallback(
    (params?: {
      limit?: number;
      offset?: number;
      department?: DepartmentFilterValue;
      search?: string;
    }) =>
      fetchBundles({
        limit: params?.limit ?? pageSize,
        offset: params?.offset ?? pageIndex * pageSize,
        department: params?.department ?? departmentFilter,
        search: params?.search ?? appliedSearchTerm,
      }),
    [appliedSearchTerm, departmentFilter, fetchBundles, pageIndex, pageSize]
  );

  const refetchCurrentPage = useCallback(async () => {
    await fetchWithFilters();
  }, [fetchWithFilters]);

  const handleEditBundle = useCallback(
    async (bundleId: number, values: BundleFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;
      const normalizeUrls = (urls?: string[]) => {
        if (!urls) return undefined;
        const trimmed = urls.map((url) => url.trim()).filter(Boolean);
        return trimmed.length ? trimmed : undefined;
      };

      try {
        await updateBundle(bundleId, {
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          image_urls: normalizeUrls(values.image_urls),
          is_hidden: values.is_hidden,
          bundle_items: values.bundle_items,
        });
        await refetchCurrentPage();
        toast.success("Bundel berhasil diperbarui");
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal memperbarui bundel");
      }
    },
    [refetchCurrentPage, updateBundle]
  );

  const handleCreateBundle = useCallback(
    async (values: BundleFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;
      const normalizeUrls = (urls?: string[]) => {
        if (!urls) return undefined;
        const trimmed = urls.map((url) => url.trim()).filter(Boolean);
        return trimmed.length ? trimmed : undefined;
      };
      try {
        await createBundle({
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          image_urls: normalizeUrls(values.image_urls),
          is_hidden: values.is_hidden,
          bundle_items: values.bundle_items.map((item) => ({
            product_id: item.product_id,
            amount: item.amount,
          })),
        });
        toast.success("Bundel berhasil dibuat");
        await fetchWithFilters({ offset: 0 });
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal membuat bundel");
      }
    },
    [createBundle, fetchWithFilters]
  );

  const handleDepartmentChange = (value: DepartmentFilterValue) => {
    setDepartmentFilter(value);
    fetchWithFilters({ offset: 0, department: value }).catch((err) => {
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
      fetchWithFilters({ offset: 0, search: trimmed }).catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal menerapkan pencarian"
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [appliedSearchTerm, fetchWithFilters, searchTerm]);

  const handleResetFilters = () => {
    setDepartmentFilter("all");
    setSearchTerm("");
    setAppliedSearchTerm("");
    fetchWithFilters({
      offset: 0,
      department: "all",
      search: "",
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengatur ulang filter"
      );
    });
  };

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchWithFilters({ offset: (pageIndex + 1) * pageSize }).catch((err) => {
      toast.error((err as Error).message ?? "Gagal memuat halaman berikutnya");
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchWithFilters({ offset: (pageIndex - 1) * pageSize }).catch((err) => {
      toast.error(
        (err as Error).message ?? "Gagal memuat halaman sebelumnya"
      );
    });
  };

  const handleDeleteBundle = useCallback(
    async (bundleId: number) => {
      try {
        await deleteBundle(bundleId);
        const isLastItemOnPage = bundles.length === 1 && pageIndex > 0;
        const nextOffset = isLastItemOnPage
          ? (pageIndex - 1) * pageSize
          : pageIndex * pageSize;
        await fetchWithFilters({ offset: nextOffset });
        toast.success("Bundel berhasil dihapus");
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal menghapus bundel");
      }
    },
    [bundles.length, deleteBundle, fetchWithFilters, pageIndex, pageSize]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Bundle Catalog</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BundleFormDialog
            bundle={emptyBundle}
            onSubmit={handleCreateBundle}
            trigger={<Button type="button">Add Bundle</Button>}
            title="Add new bundle"
            description="Configure products and pricing for the new bundle."
            submitLabel="Create bundle"
          />
          <Button
            variant="outline"
            onClick={refetchCurrentPage}
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
          <Label htmlFor="bundle-search">Search by name</Label>
          <Input
            id="bundle-search"
            placeholder="Type bundle name..."
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

      {loading && bundles.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <BundleTable
          data={bundles}
          pageIndex={pageIndex}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          total={totalBundles}
          onEditBundle={(bundle, values) => handleEditBundle(bundle.id, values)}
          onDeleteBundle={(bundle) => handleDeleteBundle(bundle.id)}
        />
      )}
    </section>
  );
}
