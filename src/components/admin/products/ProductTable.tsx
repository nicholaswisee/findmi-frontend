"use client";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/types";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../data-table";
import { Button } from "@/components/ui/button";
import {
  ProductFormDialog,
  type ProductFormValues,
} from "./ProductFormDialog";

type ProductTableProps = {
  data: Product[];
  pageIndex?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onEditProduct?: (product: Product, values: ProductFormValues) => Promise<void>;
};

export default function ProductTable({
  data,
  pageIndex,
  pageSize,
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  onEditProduct,
}: ProductTableProps) {
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
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
      },
      {
        accessorKey: "price",
        header: "Price",
        cell: ({ row }) => {
          return (
            <p>
              Rp{" "}
              {`${(row.getValue("price") as Number).toLocaleString("id-ID")}`}
            </p>
          );
        },
      },
      {
        accessorKey: "category",
        header: "Category",
        cell: ({ row }) => {
          return (
            <Badge variant={"secondary"}>{row.getValue("category")}</Badge>
          );
        },
      },
      {
        accessorKey: "action",
        header: "Modify",
        cell: ({ row }) =>
          onEditProduct ? (
            <ProductFormDialog
              product={row.original}
              onSubmit={(values) => onEditProduct(row.original, values)}
            />
          ) : null,
      },
    ],
    [onEditProduct]
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
