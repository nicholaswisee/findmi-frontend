"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "../data-table";
import { Badge } from "@/components/ui/badge";
import { TablePagination } from "@/components/shared/TablePagination";
import type { Order, OrderItem, UserWithOrders } from "@/types/types";

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

const SIZE_SURCHARGE = 15000;
const SERVICE_FEE_RATE = 0.02;

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value) || 0;

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

const isAboveXL = (size?: string | null) => {
  const normalized = size?.trim().toUpperCase();
  if (!normalized || !normalized.endsWith("L")) return false;
  const numericMatch = normalized.match(/^(\d+)XL$/);
  if (numericMatch) return Number(numericMatch[1]) >= 2;
  const xMatch = normalized.match(/^(X+)L$/);
  return !!(xMatch?.[1] && xMatch[1].length >= 2);
};

const computeProductUnitPrice = (item: OrderItem) => {
  const base =
    typeof item.product?.price === "number"
      ? item.product.price
      : typeof item.unit_price === "number"
      ? item.unit_price
      : 0;
  const optionPrice =
    item.selected_option && Array.isArray(item.product?.options)
      ? item.product.options.find(
          (opt) =>
            opt?.label?.toUpperCase() === item.selected_option?.toUpperCase()
        )?.additional_price ?? 0
      : 0;
  const sizeExtra =
    item.selected_size && isAboveXL(item.selected_size) ? SIZE_SURCHARGE : 0;
  return base + optionPrice + sizeExtra;
};

const computeBundleUnitPrice = (item: OrderItem) => {
  const bundle = item.bundle;
  if (!bundle)
    return typeof item.unit_price === "number" ? item.unit_price : 0;
  const base =
    typeof bundle.price === "number"
      ? bundle.price
      : typeof item.unit_price === "number"
      ? item.unit_price
      : 0;
  const selections = item.selected_bundle_items ?? [];
  const bundleItems = Array.isArray(bundle.bundle_items)
    ? bundle.bundle_items
    : [];
  let extras = 0;
  for (const sel of selections) {
    const productInfo = bundleItems.find(
      (b) => b.product_id === sel.product_id
    )?.product;
    const amount =
      bundleItems.find((b) => b.product_id === sel.product_id)?.amount ?? 1;
    const optPrice =
      sel.option && Array.isArray(productInfo?.options)
        ? productInfo.options.find(
            (opt) => opt?.label?.toUpperCase() === sel.option?.toUpperCase()
          )?.additional_price ?? 0
        : 0;
    const sizeExtra = sel.size && isAboveXL(sel.size) ? SIZE_SURCHARGE : 0;
    extras += (optPrice + sizeExtra) * amount;
  }
  return base + extras;
};

const computeItemUnitPrice = (item: OrderItem) => {
  if (item.product) return computeProductUnitPrice(item);
  if (item.bundle) return computeBundleUnitPrice(item);
  return typeof item.unit_price === "number" ? item.unit_price : 0;
};

const computeOrderTotals = (order: Order) => {
  const itemSubtotal = order.items.reduce((acc, item) => {
    const unit = computeItemUnitPrice(item);
    return acc + unit * (item.quantity ?? 0);
  }, 0);
  const deliveryFee = toNumber(order.delivery_fee);
  const baseTotal = itemSubtotal + deliveryFee;
  const defaultServiceFee = Math.ceil(baseTotal * SERVICE_FEE_RATE);
  const computedTotal = baseTotal + defaultServiceFee;
  const backendTotal = toNumber(order.total_amount);
  const grandTotal =
    backendTotal > 0 ? Math.max(backendTotal, computedTotal) : computedTotal;
  const serviceFee = Math.max(0, grandTotal - baseTotal);
  return { itemSubtotal, deliveryFee, serviceFee, grandTotal };
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
          {(() => {
            const pricing = computeOrderTotals(order);
            return (
              <div className="space-y-0.5 text-sm font-medium text-primary">
                <p>{formatCurrency(pricing.grandTotal)}</p>
                <p className="text-[11px] text-muted-foreground">
                  Termasuk biaya layanan 2%
                </p>
              </div>
            );
          })()}
          <ul className="mt-2 space-y-1 text-xs">
            {order.items.map((item) => {
              const unit = computeItemUnitPrice(item);
              const subtotal = unit * (item.quantity ?? 0);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between"
                >
                  <span className="font-medium text-foreground">
                    {item.bundle?.name ?? item.product?.name ?? "Item"} x{" "}
                    {item.quantity}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(subtotal)}
                  </span>
                </li>
              );
            })}
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
