import { useCallback, useEffect } from "react";
import { toast } from "sonner";

import BundleTable from "@/components/admin/bundles/BundleTable";
import type { BundleFormValues } from "@/components/admin/bundles/BundleFormDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/store/adminStore";

export default function BundlesAdmin() {
  const bundles = useAdminStore((state) => state.bundles);
  const loading = useAdminStore((state) => state.loadingBundles);
  const fetchBundles = useAdminStore((state) => state.fetchBundles);
  const pageIndex = useAdminStore((state) => state.bundlePageIndex);
  const pageSize = useAdminStore((state) => state.bundlePageSize);
  const hasNextPage = useAdminStore((state) => state.bundleHasNext);
  const updateBundle = useAdminStore((state) => state.updateBundle);

  useEffect(() => {
    if (bundles.length === 0) {
      fetchBundles();
    }
  }, [bundles.length, fetchBundles]);

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
        await fetchBundles({
          limit: pageSize,
          offset: pageIndex * pageSize,
        });
        toast.success("Bundle updated");
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update bundle");
      }
    },
    [fetchBundles, pageIndex, pageSize, updateBundle],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Bundle Catalog</p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            fetchBundles({ limit: pageSize, offset: pageIndex * pageSize })
          }
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      {loading && bundles.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <BundleTable
          data={bundles}
          pageIndex={pageIndex}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={() =>
            hasNextPage &&
            fetchBundles({
              limit: pageSize,
              offset: (pageIndex + 1) * pageSize,
            })
          }
          onPreviousPage={() =>
            pageIndex > 0 &&
            fetchBundles({
              limit: pageSize,
              offset: (pageIndex - 1) * pageSize,
            })
          }
          onEditBundle={(bundle, values) => handleEditBundle(bundle.id, values)}
        />
      )}
    </section>
  );
}
