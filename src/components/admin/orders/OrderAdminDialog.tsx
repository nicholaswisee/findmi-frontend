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

  const getBundleSelectionLabel = (item: OrderItem) => {
    if (!item.selected_bundle_items?.length || !item.bundle) return null;
    const labels = item.selected_bundle_items
      .map((selection) => {
        const bundleProduct = item.bundle?.bundle_items?.find(
          (bundleItem) => bundleItem.product_id === selection.product_id
        );
        const productName =
          bundleProduct?.product?.name ??
          (selection.product_id ? `Product ${selection.product_id}` : null);
        if (!productName) return null;
        return `${productName} (${selection.size})`;
      })
      .filter((value): value is string => Boolean(value));

    if (!labels.length) return null;
    return labels.join(", ");
  };

  const getItemTypeLabel = (item: OrderItem) => {
    if (item.product) return "Product";
    if (item.bundle) return "Bundle";
    return "Custom item";
  };

  const calculateSubtotal = (item: OrderItem) =>
    (item.unit_price ?? 0) * (item.quantity ?? 0);

  const contactFields = [
    { label: "Department", value: order.user.department, alwaysShow: true },
    { label: "Division", value: order.user.division },
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
                  {formatCurrency(order.total_amount)}
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
                <p className="text-sm font-semibold uppercase text-muted-foreground">
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
              <p className="text-sm font-semibold uppercase text-muted-foreground">
                Buyer info
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {contactFields.map((field) => (
                  <div key={field.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {field.label}
                    </p>
                    <p className="text-sm font-medium break-all">
                      {field.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold uppercase text-muted-foreground">
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
                    const bundleLabel = getBundleSelectionLabel(item);
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
                            {formatCurrency(calculateSubtotal(item))}
                          </p>
                        </div>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            Qty {item.quantity}
                            {item.selected_size
                              ? ` · Size ${item.selected_size}`
                              : ""}
                          </p>
                          {bundleLabel ? (
                            <p>Bundle selections: {bundleLabel}</p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 font-semibold">
                <span>Total</span>
                <span>{formatCurrency(order.total_amount)}</span>
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
