"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { OrderItem, OrderWithUser } from "@/types/types";

const SIZE_SURCHARGE = 15000;
const SERVICE_FEE_RATE = 0.02;

const toNumber = (value: number | string | null | undefined) =>
  typeof value === "number" ? value : Number(value) || 0;

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

type OrderAdminDialogProps = {
  order: OrderWithUser;
  onSubmit: (values: {
    admin_note?: string | null;
    is_taken?: boolean;
  }) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function OrderAdminDialog({
  order,
  onSubmit,
  open: controlledOpen,
  onOpenChange,
}: OrderAdminDialogProps) {
  const isControlled = typeof controlledOpen === "boolean";
  const [internalOpen, setInternalOpen] = useState(false);
  const [note, setNote] = useState(order.admin_note ?? "");
  const [isTaken, setIsTaken] = useState(order.is_taken);
  const [submitting, setSubmitting] = useState(false);
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const formatCurrency = (value: number | string | null | undefined) =>
    currencyFormatter.format(
      typeof value === "string" ? Number(value) || 0 : value ?? 0
    );

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("id-ID", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const open = isControlled ? (controlledOpen as boolean) : internalOpen;

  const pricing = useMemo(() => computeOrderTotals(order), [order]);

  useEffect(() => {
    if (open) {
      setNote(order.admin_note ?? "");
      setIsTaken(order.is_taken);
    }
  }, [open, order.admin_note, order.is_taken]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        admin_note: note.trim().length > 0 ? note : null,
        is_taken: isTaken,
      });
      handleOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault();
    await handleSave();
  };

  // const getBundleSelectionLabel = (item: OrderItem) => {
  //   if (!item.selected_bundle_items?.length || !item.bundle) return null;
  //   const labels = item.selected_bundle_items
  //     .map((selection) => {
  //       const productName =
  //         selection.product_id != null
  //           ? `Produk #${selection.product_id}`
  //           : "Produk";
  //       const sizeLabel = selection.size ? `Ukuran: ${selection.size}` : null;
  //       const optionLabel = selection.option
  //         ? `Opsi: ${selection.option}`
  //         : null;
  //       const detail = [sizeLabel, optionLabel]
  //         .filter((v): v is string => Boolean(v))
  //         .join(" | ");
  //       return detail ? `${productName} (${detail})` : `${productName}`;
  //     })
  //     .filter((value): value is string => Boolean(value));

  //   if (!labels.length) return null;
  //   return labels.join(", ");
  // };

  const getItemTypeLabel = (item: OrderItem) => {
    if (item.product) return "Product";
    if (item.bundle) return "Bundle";
    return "Custom item";
  };

  const contactFields = [
    { label: "Department", value: order.user.department, alwaysShow: true },
    { label: "Division", value: order.user.division, alwaysShow: true },
    { label: "Rank", value: order.user.rank },
    { label: "NIM", value: order.user.nim, alwaysShow: true },
    { label: "WhatsApp", value: order.user.no_wa },
    { label: "Line ID", value: order.user.line_id },
  ].filter(
    (field) =>
      field.alwaysShow ||
      (typeof field.value === "string" &&
        field.value.length > 0 &&
        field.value !== "none")
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl h-[88svh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex h-full flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto py-2 pr-2">
            <DialogHeader>
              <DialogTitle className="font-sans">
                Order #{order.id} - {order.user.name}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                {order.user.department} - {order.user.nim}
              </p>
            </DialogHeader>

            <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-semibold">
                  {formatDate(order.created_at)}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Payment</p>
                <p className="text-sm font-semibold">{order.payment_method}</p>
                <Badge className="mt-1 w-fit">{order.payment_status}</Badge>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Total Amount</p>
                <p className="text-sm font-semibold">
                  {formatCurrency(pricing.grandTotal)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Termasuk biaya layanan 2%
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">
                  Fulfillment Method
                </p>
                <p className="text-sm font-semibold">
                  {order.fulfillment_method === "Delivery"
                    ? "Delivery"
                    : "Ambil di Tempat"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number(order.delivery_fee) > 0
                    ? `+ ${formatCurrency(order.delivery_fee)}`
                    : "Gratis"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs text-muted-foreground">Pickup Status</p>
                <Badge variant={order.is_taken ? "default" : "secondary"}>
                  {order.is_taken ? "Taken" : "Pending pickup"}
                </Badge>
              </div>
            </section>
            {order.fulfillment_method === "Delivery" && (
              <section className="space-y-2 rounded-xl border p-4">
                <p className="text-sm font-semibold text-muted-foreground">
                  Detail Pengiriman
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nama penerima
                    </p>
                    <p className="text-sm font-medium">
                      {order.delivery_contact_name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Nomor telepon
                    </p>
                    <p className="text-sm font-medium">
                      {order.delivery_phone || "-"}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Alamat</p>
                  <p className="text-sm font-medium whitespace-pre-wrap">
                    {order.delivery_address || "-"}
                  </p>
                </div>
                {order.delivery_notes ? (
                  <div>
                    <p className="text-xs text-muted-foreground">Catatan</p>
                    <p className="text-sm font-medium whitespace-pre-wrap">
                      {order.delivery_notes}
                    </p>
                  </div>
                ) : null}
              </section>
            )}

            <section className="space-y-2 rounded-xl border p-4">
              <p className="text-sm font-semibold text-muted-foreground">
                Buyer info
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {contactFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="text-sm font-medium break-all">
                      {field.value || "-"}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  Order items
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.items.length} item(s)
                </p>
              </div>
              <div className="rounded-xl border">
                <div className="divide-y">
                  {order.items.map((item) => {
                    const name =
                      item.product?.name ?? item.bundle?.name ?? "Item";
                    const unitPrice = computeItemUnitPrice(item);
                    const itemSubtotal = unitPrice * (item.quantity ?? 0);
                    // const bundleLabel = getBundleSelectionLabel(item);
                    return (
                      <div key={item.id} className="space-y-2 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {getItemTypeLabel(item)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatCurrency(itemSubtotal)}
                          </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            Qty {item.quantity}
                            {item.selected_size
                              ? ` · Size ${item.selected_size}`
                              : ""}
                          </p>
                          {item.selected_option ? (
                            <p className="text-sm text-muted-foreground">
                              Additional: {item.selected_option}
                            </p>
                          ) : null}
                          <p>Harga satuan: {formatCurrency(unitPrice)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1 rounded-lg border bg-muted/30 p-3 font-semibold">
                <div className="flex items-center justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(pricing.itemSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Biaya Pengiriman</span>
                  <span>{formatCurrency(pricing.deliveryFee)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Biaya Layanan (2%)</span>
                  <span>{formatCurrency(pricing.serviceFee)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 text-base">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.grandTotal)}</span>
                </div>
              </div>
            </section>

            <div className="grid gap-3">
              <Label htmlFor={`order-note-${order.id}`}>Admin Notes</Label>
              <Textarea
                id={`order-note-${order.id}`}
                rows={4}
                placeholder="Add pickup notes or reminders..."
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            <label className="flex items-center gap-3 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={isTaken}
                onChange={(event) => setIsTaken(event.target.checked)}
              />
              Mark as taken
            </label>
          </div>
          <DialogFooter className="border-t pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
