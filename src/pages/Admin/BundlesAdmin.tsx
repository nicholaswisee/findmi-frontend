import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import BundleTable from "@/components/admin/bundles/BundleTable";
import type { BundleFormValues } from "@/components/admin/bundles/BundleFormDialog";
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
import type { UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";

export default function BundlesAdmin() {
  const bundles = useAdminStore((state) => state.bundles);
  const loading = useAdminStore((state) => state.loadingBundles);
  const fetchBundles = useAdminStore((state) => state.fetchBundles);
  const pageIndex = useAdminStore((state) => state.bundlePageIndex);
  const pageSize = useAdminStore((state) => state.bundlePageSize);
  const hasNextPage = useAdminStore((state) => state.bundleHasNext);
  const updateBundle = useAdminStore((state) => state.updateBundle);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (bundles.length === 0) {
      fetchBundles().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load bundles",
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
        search: params?.search ?? searchTerm,
      }),
    [departmentFilter, fetchBundles, pageIndex, pageSize, searchTerm],
  );

  const refetchCurrentPage = useCallback(async () => {
    await fetchWithFilters();
  }, [fetchWithFilters]);

  const handleEditBundle = useCallback(
    async (bundleId: number, values: BundleFormValues) => {
      const mapString = (value?: string) =>
        value && value.trim().length > 0 ? value.trim() : undefined;

      try {
        await updateBundle(bundleId, {
          name: values.name,
          price: values.price,
          category: mapString(values.category),
          description: mapString(values.description),
          image_url: mapString(values.image_url),
          is_hidden: values.is_hidden,
          bundle_items: values.bundle_items,
        });
        await refetchCurrentPage();
        toast.success("Bundle updated");
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update bundle");
      }
    },
    [refetchCurrentPage, updateBundle],
  );

  const handleDepartmentChange = (value: DepartmentFilterValue) => {
    setDepartmentFilter(value);
    fetchWithFilters({ offset: 0, department: value }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply filter",
      );
    });
  };

  const handleSearchSubmit = () => {
    fetchWithFilters({ offset: 0, search: searchTerm }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to apply search",
      );
    });
  };

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchWithFilters({ offset: (pageIndex + 1) * pageSize }).catch((err) => {
      toast.error((err as Error).message ?? "Failed to load next page");
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchWithFilters({ offset: (pageIndex - 1) * pageSize }).catch((err) => {
      toast.error((err as Error).message ?? "Failed to load previous page");
    });
  };

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Bundle Catalog</p>
        </div>
        <Button
          variant="outline"
          onClick={refetchCurrentPage}
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
          <Label htmlFor="bundle-search">Search by name</Label>
          <Input
            id="bundle-search"
            placeholder="Type bundle name..."
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
          onEditBundle={(bundle, values) => handleEditBundle(bundle.id, values)}
        />
      )}
    </section>
  );
}
