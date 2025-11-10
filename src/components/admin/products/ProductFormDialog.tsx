"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { CircleEllipsisIcon } from "lucide-react";

import type { Product } from "@/types/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";

export type ProductFormValues = {
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_url?: string;
  remaining_stock: number;
};

type ProductFormDialogProps = {
  product: Product;
  onSubmit?: (values: ProductFormValues) => Promise<void> | void;
  trigger?: ReactNode;
  title?: string;
  description?: ReactNode;
  submitLabel?: string;
};

const toFormValues = (product: Product): ProductFormValues => ({
  name: product.name,
  price: product.price,
  category: product.category ?? "none",
  description: product.description ?? "",
  image_url: product.image_url ?? "",
  remaining_stock: product.remaining_stock,
});

export function ProductFormDialog({
  product,
  onSubmit,
  trigger,
  title,
  description,
  submitLabel,
}: ProductFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, control } = useForm<ProductFormValues>({
    defaultValues: toFormValues(product),
  });

  useEffect(() => {
    reset(toFormValues(product));
  }, [product, reset, open]);

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      await onSubmit?.(values);
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  });

  const dialogTitle = title ?? "Edit product";
  const dialogDescription =
    description ??
    (product.name ? (
      <>
        Update the details for <strong>{product.name}</strong>.
      </>
    ) : (
      "Fill out the details below."
    ));
  const primaryActionLabel = submitting
    ? "Saving..."
    : submitLabel ?? "Save changes";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon">
            <CircleEllipsisIcon className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Label htmlFor="product-name">Name</Label>
            <Input id="product-name" {...register("name")} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="product-price">Price (IDR)</Label>
            <Input
              id="product-price"
              type="number"
              min={0}
              step="1000"
              {...register("price", { valueAsNumber: true })}
            />
          </div>

          <div className="grid gap-3">
            <Label>Category</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select
                  value={field.value ?? "none"}
                  onValueChange={(value) => field.onChange(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={3}
              {...register("description")}
            />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="product-image">Image URL</Label>
            <Input id="product-image" {...register("image_url")} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="product-stock">Remaining stock</Label>
            <Input
              id="product-stock"
              type="number"
              min={0}
              {...register("remaining_stock", { valueAsNumber: true })}
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={submitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={submitting}>
              {primaryActionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
