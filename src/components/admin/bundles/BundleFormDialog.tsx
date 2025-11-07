"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useFieldArray, useForm } from "react-hook-form";

import type { Bundle } from "@/types/types";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
export type BundleFormValues = {
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  is_hidden: boolean;
  bundle_items: Array<{ product_id: number; amount: number }>;
};

type BundleFormDialogProps = {
  bundle: Bundle;
  onSubmit?: (values: BundleFormValues) => Promise<void> | void;
  trigger?: ReactNode;
};

const toFormValues = (bundle: Bundle): BundleFormValues => ({
  name: bundle.name,
  price: bundle.price,
  category: bundle.category ?? "",
  description: bundle.description ?? "",
  image_url: bundle.image_url ?? "",
  is_hidden: bundle.is_hidden,
  bundle_items:
    bundle.bundle_items.length > 0
      ? bundle.bundle_items.map((item) => ({
          product_id: item.product_id,
          amount: item.amount,
        }))
      : [{ product_id: 1, amount: 1 }],
});

export function BundleFormDialog({
  bundle,
  onSubmit,
  trigger,
}: BundleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BundleFormValues>({
    defaultValues: toFormValues(bundle),
  });

  const { register, control, handleSubmit, reset } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: "bundle_items",
  });

  useEffect(() => {
    reset(toFormValues(bundle));
  }, [bundle, reset, open]);

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      await onSubmit?.(values);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            Edit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit bundle</DialogTitle>
            <DialogDescription>
              Update all fields for <strong>{bundle.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="bundle-name">Name</Label>
              <Input id="bundle-name" {...register("name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bundle-price">Price (IDR)</Label>
              <Input
                id="bundle-price"
                type="number"
                min={0}
                step="1000"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bundle-category">Category</Label>
              <Input id="bundle-category" {...register("category")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bundle-image">Image URL</Label>
              <Input id="bundle-image" {...register("image_url")} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bundle-description">Description</Label>
            <Textarea
              id="bundle-description"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="bundle-hidden"
              type="checkbox"
              className="size-4"
              checked={form.watch("is_hidden")}
              onChange={(event) =>
                form.setValue("is_hidden", event.target.checked)
              }
            />
            <Label htmlFor="bundle-hidden" className="text-sm">
              Hidden from storefront
            </Label>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bundle items</p>
                <p className="text-xs text-muted-foreground">
                  Specify each product and quantity included in this bundle.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: 1, amount: 1 })}
              >
                Add item
              </Button>
            </div>

            <div className="space-y-3">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto]"
                >
                  <div className="grid gap-2">
                    <Label>Product ID</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`bundle_items.${index}.product_id`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min={1}
                      {...register(`bundle_items.${index}.amount`, {
                        valueAsNumber: true,
                      })}
                    />
                  </div>
                  <div className="flex items-end justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
