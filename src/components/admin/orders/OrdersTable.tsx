"use client";

import { useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/shared/TablePagination";
import type { OrderItem, OrderWithUser } from "@/types/types";
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

const computeOrderTotals = (order: OrderWithUser) => {
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

const buildItemSummary = (order: OrderWithUser) => {
  if (order.items.length === 0) return ["No items"];
  const summaryLines: string[] = [];

  order.items.slice(0, 3).forEach((item) => {
    const isBundle = Boolean(item.bundle);

    if (!isBundle) {
      const name = item.product?.name ?? `Produk #${item.product_id ?? item.id}`;
      const detailParts = [`${item.quantity}x`];
      if (item.selected_size) {
        detailParts.push(`Size ${item.selected_size}`);
      }
      if (item.selected_option) {
        detailParts.push(`Option ${item.selected_option}`);
      }
      summaryLines.push(`${name} — ${detailParts.join(" · ")}`);
      return;
    }

    const bundleName = item.bundle?.name ?? `Bundle #${item.bundle_id ?? item.id}`;
    const selections = Array.isArray(item.selected_bundle_items)
      ? item.selected_bundle_items
      : [];
    const bundleItems = Array.isArray(item.bundle?.bundle_items)
      ? item.bundle.bundle_items
      : [];

    const bundleDetails = bundleItems
      .map((bundleItem) => {
        const productName =
          bundleItem.product?.name ?? `Produk #${bundleItem.product_id}`;
        const amount =
          typeof bundleItem.amount === "number" && bundleItem.amount > 0
            ? bundleItem.amount
            : 1;
        const selection = selections.find(
          (sel) => sel.product_id === bundleItem.product_id
        );
        const sizeLabel = selection?.size ? `Size ${selection.size}` : null;
        const optionLabel = selection?.option
          ? `Option ${selection.option}`
          : null;
        const extras = [sizeLabel, optionLabel]
          .filter((value): value is string => Boolean(value))
          .join(" | ");
        return extras
          ? `${productName} x${amount} (${extras})`
          : `${productName} x${amount}`;
      })
      .filter(Boolean)
      .join("; ");

    const detailParts = [`${item.quantity}x`];
    if (bundleDetails) detailParts.push(`[${bundleDetails}]`);

    summaryLines.push(`${bundleName} — ${detailParts.join(" · ")}`);
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
        cell: ({ row }) => {
          const pricing = computeOrderTotals(row.original);
          return (
            <div className="space-y-0.5">
              <span className="font-semibold">
                {formatCurrency(pricing.grandTotal)}
              </span>
              <p className="text-[11px] text-muted-foreground">
                Termasuk biaya layanan 2%
              </p>
            </div>
          );
        },
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













