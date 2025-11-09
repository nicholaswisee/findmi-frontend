"use client";

import { useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/admin/data-table";
import type { Bundle } from "@/types/types";
import { Button } from "@/components/ui/button";
import { BundleFormDialog, type BundleFormValues } from "./BundleFormDialog";

type BundleTableProps = {
  data: Bundle[];
  pageIndex?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onEditBundle?: (bundle: Bundle, values: BundleFormValues) => Promise<void>;
};

export default function BundleTable({
  data,
  pageIndex,
  pageSize,
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  onEditBundle,
}: BundleTableProps) {
  const columns = useMemo<ColumnDef<Bundle>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            #{row.original.id}
          </span>
        ),
      },
      {
        accessorKey: "image_url",
        header: "Image",
        cell: ({ row }) => {
          const imgUrl = row.getValue("image_url");

          return (
            <div className="aspect-square relative w-8 h-8 overflow-hidden flex items-center justify-center">
              <img
                src={`${imgUrl ? imgUrl : "https://picsum.photos/200/300"}`}
                alt="Product Image"
                className="object-contain w-full h-full"
              />
            </div>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.name}</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {row.original.description || "No description"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) =>
          row.original.category ? (
            <Badge variant="secondary">{row.original.category}</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => (
          <span className="font-medium">{`Rp ${row
            .getValue<number>("price")
            .toLocaleString("id-ID")}`}</span>
        ),
      },
      {
        accessorKey: "bundle_items",
        header: "Items",
        cell: ({ row }) => (
          <span className="font-medium">
            {row.original.bundle_items.length} items
          </span>
        ),
      },
      // {
      //   accessorKey: "is_hidden",
      //   header: "Visibility",
      //   cell: ({ row }) =>
      //     row.original.is_hidden ? (
      //       <Badge variant="outline" className="text-muted-foreground">
      //         Hidden
      //       </Badge>
      //     ) : (
      //       <Badge className="bg-green-600 hover:bg-green-600">Visible</Badge>
      //     ),
      // },
      {
        accessorKey: "action",
        header: "Modify",
        cell: ({ row }) =>
          onEditBundle ? (
            <BundleFormDialog
              bundle={row.original}
              onSubmit={(values) => onEditBundle(row.original, values)}
            />
          ) : null,
      },
    ],
    [onEditBundle]
  );

  const manualPagination =
    pageIndex !== undefined && pageSize !== undefined && pageSize > 0;

  const start =
    manualPagination && data.length > 0
      ? pageIndex! * pageSize! + 1
      : data.length === 0
      ? 0
      : 1;
  const end =
    manualPagination && data.length > 0
      ? pageIndex! * pageSize! + data.length
      : data.length;

  return (
    <div className="space-y-4 flex flex-col h-[88svh]">
      <DataTable columns={columns} data={data} />
      {manualPagination && (
        <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {data.length === 0
              ? "No entries on this page"
              : `Showing ${start}-${end}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onPreviousPage}
              disabled={loading || !onPreviousPage || pageIndex === 0}
            >
              Previous
            </Button>
            <span className="text-xs sm:text-sm">Page {pageIndex! + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={loading || !onNextPage || !hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
