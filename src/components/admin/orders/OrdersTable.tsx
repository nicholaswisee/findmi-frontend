"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { OrderWithUser } from "@/types/types";
import { OrderAdminDialog } from "./OrderAdminDialog";

type OrdersTableProps = {
  data: OrderWithUser[];
  pageIndex?: number;
  pageSize?: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onEditOrder?: (
    order: OrderWithUser,
    values: { admin_note?: string | null; is_taken?: boolean },
  ) => Promise<void>;
  activeOrderId?: number | null;
  onDialogOpenChange?: (orderId: number, open: boolean) => void;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | null | undefined) =>
  currencyFormatter.format(
    typeof value === "string" ? Number(value) || 0 : (value ?? 0),
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

export default function OrdersTable({
  data,
  pageIndex,
  pageSize,
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  onEditOrder,
  activeOrderId,
  onDialogOpenChange,
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
              {row.original.user.department} · {row.original.user.nim}
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
        accessorKey: "payment_status",
        header: "Payment",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.payment_status}</Badge>
        ),
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
        cell: ({ row }) => (
          <p className="max-w-xs text-sm text-muted-foreground line-clamp-2">
            {row.original.admin_note || "—"}
          </p>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) =>
          onEditOrder ? (
            <OrderAdminDialog
              order={row.original}
              open={activeOrderId === row.original.id}
              onOpenChange={(open) =>
                onDialogOpenChange?.(row.original.id, open)
              }
              onSubmit={(values) => onEditOrder(row.original, values)}
            />
          ) : null,
      },
    ];
  }, [activeOrderId, onDialogOpenChange, onEditOrder]);

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
    <div className="flex h-[88svh] flex-col space-y-4">
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
              disabled={!onPreviousPage || loading || pageIndex === 0}
            >
              Previous
            </Button>
            <span className="text-xs sm:text-sm">Page {pageIndex! + 1}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={!onNextPage || loading || !hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
