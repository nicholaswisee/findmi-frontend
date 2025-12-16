"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import { CircleEllipsisIcon, X } from "lucide-react";

import type { Product, ProductOption } from "@/types/types";
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
import { ImageUploadPool } from "@/components/admin/media/ImageUploadPool";

const SIZE_PRIORITY = ["XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"] as const;
const sizePriorityMap = new Map<string, number>(
  SIZE_PRIORITY.map((size, index) => [size, index])
);

const normalizeSizeValue = (value: string) => value.trim().toUpperCase();

const formatSizes = (values: string[] = []) => {
  const normalized = values
    .map((value) => normalizeSizeValue(value))
    .filter((value) => value.length > 0);
  const unique = Array.from(new Set(normalized));
  unique.sort((a, b) => {
    const priorityA = sizePriorityMap.get(a);
    const priorityB = sizePriorityMap.get(b);
    if (priorityA !== undefined && priorityB !== undefined) {
      return priorityA - priorityB;
    }
    if (priorityA !== undefined) return -1;
    if (priorityB !== undefined) return 1;
    return a.localeCompare(b);
  });
  return unique;
};

const normalizeOptionLabel = (value: string) => value.trim();

const formatOptions = (options: ProductOption[] = []) => {
  const normalized = options
    .map((opt) => ({
      label: normalizeOptionLabel(opt.label),
      additional_price: Number.isFinite(opt.additional_price)
        ? Math.max(0, Number(opt.additional_price))
        : 0,
    }))
    .filter((opt) => opt.label.length > 0);

  const deduped = new Map<string, ProductOption>();
  normalized.forEach((opt) => {
    if (!deduped.has(opt.label)) {
      deduped.set(opt.label, opt);
    }
  });
  return Array.from(deduped.values());
};

export type ProductFormValues = {
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_urls?: string[];
  remaining_stock: number;
  available_sizes: string[];
  options?: ProductOption[];
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
  image_urls: product.image_urls ?? [],
  remaining_stock: product.remaining_stock,
  available_sizes: formatSizes(product.available_sizes ?? []),
  options: formatOptions(product.options ?? []),
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

  const { register, handleSubmit, reset, control, setValue, watch } =
    useForm<ProductFormValues>({
      defaultValues: toFormValues(product),
    });

  useEffect(() => {
    reset(toFormValues(product));
  }, [product, reset, open]);

  const imageValues = watch("image_urls");
  const sizeValues = watch("available_sizes") ?? [];
  const optionValues = watch("options") ?? [];
  const [sizeInput, setSizeInput] = useState("");
  const [optionLabel, setOptionLabel] = useState("");
  const [optionPrice, setOptionPrice] = useState<string>("");

  const updateSizes = (next: string[]) => {
    setValue("available_sizes", formatSizes(next), { shouldDirty: true });
  };

  const handleAddSize = (raw: string) => {
    const normalized = normalizeSizeValue(raw);
    if (!normalized) return;
    if (
      sizeValues.some((size) => size.toUpperCase() === normalized.toUpperCase())
    ) {
      setSizeInput("");
      return;
    }
    updateSizes([...sizeValues, normalized]);
    setSizeInput("");
  };

  const handleRemoveSize = (target: string) => {
    updateSizes(sizeValues.filter((size) => size !== target));
  };

  const togglePresetSize = (preset: string) => {
    const normalized = normalizeSizeValue(preset);
    if (sizeValues.includes(normalized)) {
      updateSizes(sizeValues.filter((size) => size !== normalized));
    } else {
      updateSizes([...sizeValues, normalized]);
    }
  };

  const presetSizes = SIZE_PRIORITY;

  const updateOptions = (next: ProductOption[]) => {
    setValue("options", formatOptions(next), { shouldDirty: true });
  };

  const handleAddOption = () => {
    const label = normalizeOptionLabel(optionLabel);
    if (!label) {
      setOptionLabel("");
      setOptionPrice("");
      return;
    }
    const priceValue = Number(optionPrice);
    const additional_price = Number.isFinite(priceValue)
      ? Math.max(0, Math.round(priceValue))
      : 0;
    updateOptions([
      ...optionValues.filter((opt) => opt.label !== label),
      { label, additional_price },
    ]);
    setOptionLabel("");
    setOptionPrice("");
  };

  const handleRemoveOption = (label: string) => {
    updateOptions(optionValues.filter((opt) => opt.label !== label));
  };

  const handleFormSubmit = handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const normalizedSizes = formatSizes(values.available_sizes ?? []);
      const normalizedOptions = formatOptions(values.options ?? []);
      await onSubmit?.({
        ...values,
        available_sizes: normalizedSizes,
        options: normalizedOptions,
      });
      setOpen(false);
    } finally {
      setSubmitting(false);
    }
  });

  const dialogTitle = title ?? "Edit product";
  const dialogDescription =
    description ??
    (product.name ? (
      <>Update the details for {product.name}.</>
    ) : (
      "Fill out the details below."
    ));
  const primaryActionLabel = submitting
    ? "Saving..."
    : submitLabel ?? "Save changes";
  const CATEGORY_OPTIONS = [
    "Umum",
    "Panitia",
    "Tutor",
    "CASIO x Zebra x FindMi",
  ] as const;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="icon">
            <CircleEllipsisIcon className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[88svh] overflow-y-auto">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-sans">{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="product-name">Name</Label>
              <Input id="product-name" {...register("name")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="product-price">Price (IDR)</Label>
              <Input
                id="product-price"
                type="number"
                min={0}
                step="1000"
                {...register("price", { valueAsNumber: true })}
              />
            </div>
            <div className="grid gap-2">
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
                      {CATEGORY_OPTIONS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <ImageUploadPool
              values={imageValues}
              onChange={(urls) =>
                setValue("image_urls", urls, { shouldDirty: true })
              }
              label="Product images"
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
            <div>
              <Label>Available sizes</Label>
              <p className="text-xs text-muted-foreground">
                Kosongkan jika produk tidak memiliki variasi ukuran.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {presetSizes.map((preset) => {
                const normalized = normalizeSizeValue(preset);
                const isActive = sizeValues.includes(normalized);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => togglePresetSize(preset)}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      isActive
                        ? "border-[#c62d76] bg-[#c62d76] text-white"
                        : "border-white/40 text-[#1b165e]"
                    }`}
                  >
                    {preset}
                  </button>
                );
              })}
            </div>
            {sizeValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sizeValues.map((size) => (
                  <span
                    key={size}
                    className="inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase text-[#1b165e]"
                  >
                    {size}
                    <button
                      type="button"
                      aria-label={`Hapus ukuran ${size}`}
                      onClick={() => handleRemoveSize(size)}
                      className="text-[#c62d76] transition hover:text-[#a41d60]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Input
                value={sizeInput}
                onChange={(event) => setSizeInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddSize(sizeInput);
                  }
                }}
                placeholder="Ukuran custom (misal: FREESIZE)"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleAddSize(sizeInput)}
              >
                Tambah
              </Button>
            </div>
          </div>

          <div className="grid gap-3">
            <div>
              <Label>Options (optional)</Label>
              <p className="text-xs text-muted-foreground">
                Tambahkan pilihan berbayar, misal packaging khusus. Harga
                tambahan diterapkan per item.
              </p>
            </div>
            {optionValues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {optionValues.map((opt) => (
                  <span
                    key={opt.label}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-[#1b165e]"
                  >
                    {opt.label}
                    <span className="text-[#c62d76] font-bold">
                      +Rp{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        Math.max(0, opt.additional_price ?? 0)
                      )}
                    </span>
                    <button
                      type="button"
                      aria-label={`Hapus opsi ${opt.label}`}
                      onClick={() => handleRemoveOption(opt.label)}
                      className="text-[#c62d76] transition hover:text-[#a41d60]"
                    >
                      <X className="size-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Input
                value={optionLabel}
                onChange={(event) => setOptionLabel(event.target.value)}
                placeholder="Nama opsi (contoh: Packaging premium)"
              />
              <Input
                type="number"
                min={0}
                step="500"
                value={optionPrice}
                onChange={(event) => setOptionPrice(event.target.value)}
                placeholder="Biaya tambahan"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddOption}
              >
                Tambah opsi
              </Button>
            </div>
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
