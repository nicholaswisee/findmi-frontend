import { useEffect } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/store/adminStore";

export default function BundlesAdmin() {
  const bundles = useAdminStore((state) => state.bundles);
  const loading = useAdminStore((state) => state.loadingBundles);
  const fetchBundles = useAdminStore((state) => state.fetchBundles);

  useEffect(() => {
    if (bundles.length === 0) {
      fetchBundles();
    }
  }, [bundles.length, fetchBundles]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Bundles overview
          </h1>
          <p className="text-muted-foreground">
            Craft curated bundles and control their visibility.
          </p>
        </div>
        <Button variant="outline" onClick={fetchBundles} disabled={loading}>
          Refresh
        </Button>
      </header>

      {loading && bundles.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bundles.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No bundles available.
                  </TableCell>
                </TableRow>
              ) : (
                bundles.map((bundle) => (
                  <TableRow key={bundle.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{bundle.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Category: {bundle.category ?? "–"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{`Rp ${bundle.price.toLocaleString(
                      "id-ID"
                    )}`}</TableCell>
                    <TableCell>{bundle.bundle_items.length}</TableCell>
                    <TableCell>
                      {bundle.is_hidden ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Hidden
                        </Badge>
                      ) : (
                        <Badge className="bg-green-600 hover:bg-green-600">
                          Visible
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
