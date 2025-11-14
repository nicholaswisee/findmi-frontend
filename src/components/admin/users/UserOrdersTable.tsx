"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../data-table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/TablePagination";
import type { Order, UserWithOrders } from "@/types/types";

type UserOrdersTableProps = {
  data: UserWithOrders[];
  pageIndex?: number;
  pageSize?: number;
  total?: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNextPage?: () => void;
  onPreviousPage?: () => void;
  onOrderClick?: (order: Order, user: UserWithOrders) => void;
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

function OrderItemsList({
  orders,
  user,
  onOrderClick,
}: {
  orders: Order[];
  user: UserWithOrders;
  onOrderClick?: (order: Order, user: UserWithOrders) => void;
}) {
  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Belum memiliki pesanan.</p>
    );
  }

  return (
    <div className="flex max-h-72 flex-col gap-3 overflow-y-auto pr-2">
      {orders.map((order) => (
        <button
          type="button"
          key={order.id}
          onClick={() => onOrderClick?.(order, user)}
          className="w-full rounded-lg border p-3 text-left shadow-sm transition hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <p className="text-sm font-semibold">Order #{order.id}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.created_at)}
              </p>
            </div>
            <Badge variant="secondary">{order.payment_status}</Badge>
          </div>
          <p className="text-sm font-medium text-primary">
            {formatCurrency(order.total_amount)}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span className="font-medium text-foreground">
                  {item.bundle?.name ?? item.product?.name ?? "Item"} x{" "}
                  {item.quantity}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency((item.unit_price ?? 0) * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
        </button>
      ))}
    </div>
  );
}

export default function UserOrdersTable({
  data,
  pageIndex,
  pageSize,
  total,
  hasNextPage,
  loading,
  onNextPage,
  onPreviousPage,
  onOrderClick,
}: UserOrdersTableProps) {
  const columns = useMemo<ColumnDef<UserWithOrders>[]>(() => {
    return [
      {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-semibold">{row.original.name}</p>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>NIM: {row.original.nim || "-"}</p>
              <p>WA: {row.original.no_wa || "-"}</p>
              <p>Line: {row.original.line_id || "-"}</p>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "department",
        header: "Department / Division",
        cell: ({ row }) => (
          <div className="space-y-1">
            <Badge variant="outline">{row.original.department}</Badge>
            <p className="text-xs text-muted-foreground">
              {row.original.division}
            </p>
          </div>
        ),
      },
      {
        id: "orders",
        header: "Orders",
        cell: ({ row }) => (
          <div className="space-y-2">
            <Badge variant="secondary">
              {row.original.orders.length}{" "}
              {row.original.orders.length === 1 ? "order" : "orders"}
            </Badge>
            <OrderItemsList
              orders={row.original.orders}
              user={row.original}
              onOrderClick={onOrderClick}
            />
          </div>
        ),
      },
    ];
  }, [onOrderClick]);

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

  const resolvedTotal =
    typeof total === "number" ? total : pageIndex! * pageSize! + data.length;

  return (
    <div className="flex h-[88svh] flex-col space-y-4">
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
          label="users"
        />
      )}
    </div>
  );
}
