"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/TablePagination";
import type { OrderWithUser } from "@/types/types";
type OrdersTableProps = {
  data: OrderWithUser[];
  pageIndex?: number;
  pageSize?: number;
  total?: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onSelectOrder?: (order: OrderWithUser) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | null | undefined) =>
  currencyFormatter.format(
    typeof value === "string" ? Number(value) || 0 : value ?? 0
  );

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const buildItemSummary = (order: OrderWithUser) => {
  if (order.items.length === 0) return ["No items"];
  const summaryLines: string[] = [];

  order.items.slice(0, 3).forEach((item) => {
    const name = item.product?.name ?? item.bundle?.name ?? "Item";
    const details: string[] = [];
    details.push(`${item.quantity}x`);
    if (item.selected_size) {
      details.push(`Size ${item.selected_size}`);
    }
    if (item.selected_bundle_items?.length) {
      const bundleSizes = item.selected_bundle_items
        .map((selection) => {
          if (!selection.product_id || !item.bundle?.bundle_items) return null;
          const productName =
            item.bundle.bundle_items.find(
              (bundleItem) => bundleItem.product_id === selection.product_id
            )?.product?.name ?? "Item";
          return `${productName} (${selection.size})`;
        })
        .filter((value): value is string => Boolean(value));
      if (bundleSizes.length) {
        details.push(bundleSizes.join(", "));
      }
    }
    summaryLines.push(`${name} • ${details.join(" · ")}`);
  });

  if (order.items.length > 3) {
    summaryLines.push(`+${order.items.length - 3} more item(s)`);
  }

  return summaryLines;
};

export default function OrdersTable({
  data,
  pageIndex,
  pageSize,
  total,
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  onSelectOrder,
}: OrdersTableProps) {
  const columns = useMemo<ColumnDef<OrderWithUser>[]>(() => {
    return [
      {
        accessorKey: "id",
        header: "Order",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold">#{row.original.id}</p>
            <p className="text-xs text-muted-foreground">
              {formatDate(row.original.created_at)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "user",
        header: "Buyer",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">{row.original.user.name}</p>
            <p className="text-xs text-muted-foreground">
              {row.original.user.department} - {row.original.user.nim}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "total_amount",
        header: "Total",
        cell: ({ row }) => (
          <span className="font-semibold">
            {formatCurrency(row.original.total_amount)}
          </span>
        ),
      },
      {
        accessorKey: "items",
        header: "Items & Sizes",
        cell: ({ row }) => {
          const summary = buildItemSummary(row.original);
          return (
            <div className="space-y-1 text-xs text-muted-foreground">
              {summary.map((line, index) => (
                <p
                  key={`${row.original.id}-item-${index}`}
                  className={index === 0 ? "text-sm text-foreground" : ""}
                >
                  {line}
                </p>
              ))}
            </div>
          );
        },
      },
      {
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.payment_status}</Badge>
        ),
      },
      {
        accessorKey: "fulfillment_method",
        header: "Fulfillment",
        cell: ({ row }) => {
          const fee = Number(row.original.delivery_fee) || 0;
          const label =
            row.original.fulfillment_method === "Delivery"
              ? "Delivery"
              : "Ambil di Tempat";
          return (
            <div className="space-y-0.5">
              <p className="font-semibold">{label}</p>
              <p className="text-xs text-muted-foreground">
                {fee > 0 ? `+ ${formatCurrency(fee)}` : "Gratis"}
              </p>
              {row.original.fulfillment_method === "Delivery" ? (
                <p className="text-xs text-muted-foreground">
                  {row.original.delivery_contact_name || "Nama belum diisi"}
                </p>
              ) : null}
            </div>
          );
        },
      },
      {
        accessorKey: "is_taken",
        header: "Pickup",
        cell: ({ row }) =>
          row.original.is_taken ? (
            <Badge className="bg-green-600 hover:bg-green-600">Taken</Badge>
          ) : (
            <Badge variant="outline">Pending pickup</Badge>
          ),
      },
      {
        accessorKey: "admin_note",
        header: "Admin Notes",
        cell: ({ row }) => {
          const note = row.original.admin_note?.trim() ?? "";
          return (
            <p className="max-w-sm break-words whitespace-pre-wrap text-sm text-muted-foreground">
              {note.length > 0 ? note : "Tidak ada catatan"}
            </p>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          onSelectOrder ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSelectOrder(row.original)}
            >
              Edit
            </Button>
          ) : null,
      },
    ];
  }, [onSelectOrder]);

  const manualPagination =
    pageIndex !== undefined && pageSize !== undefined && pageSize > 0;

  // const start =
  //   manualPagination && data.length > 0
  //     ? pageIndex! * pageSize! + 1
  //     : data.length === 0
  //     ? 0
  //     : 1;
  // const end =
  //   manualPagination && data.length > 0
  //     ? pageIndex! * pageSize! + data.length
  //     : data.length;

  const resolvedTotal =
    typeof total === "number" ? total : pageIndex! * pageSize! + data.length;

  return (
    <div className="flex h-[88svh] min-w-0 flex-col space-y-4">
      <DataTable columns={columns} data={data} />
      {manualPagination && (
        <TablePagination
          pageIndex={pageIndex!}
          pageSize={pageSize!}
          total={resolvedTotal}
          currentCount={data.length}
          hasNextPage={hasNextPage}
          loading={loading}
          onNext={onNextPage}
          onPrevious={onPreviousPage}
          label="orders"
        />
      )}
    </div>
  );
}
