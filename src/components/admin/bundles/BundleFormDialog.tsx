"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  Controller,
  useFieldArray,
  useForm,
  type UseFormReturn,
} from "react-hook-form";

import type { Bundle, Product } from "@/types/types";
import { useAdminStore } from "@/store/adminStore";
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
import { CircleEllipsisIcon } from "lucide-react";
import { DEPARTMENTS } from "@/constants/departments";
import { ImageUploadPool } from "@/components/admin/media/ImageUploadPool";

export type BundleFormValues = {
  name: string;
  price: number;
  category?: string;
  description?: string;
  image_urls?: string[];
  is_hidden: boolean;
  bundle_items: Array<{ product_id: number; amount: number }>;
};

type BundleFormDialogProps = {
  bundle: Bundle;
  onSubmit?: (values: BundleFormValues) => Promise<void> | void;
  trigger?: ReactNode;
  title?: string;
  description?: ReactNode;
  submitLabel?: string;
};

const toFormValues = (bundle: Bundle): BundleFormValues => ({
  name: bundle.name,
  price: bundle.price,
  category: bundle.category ?? "none",
  description: bundle.description ?? "",
  image_urls: bundle.image_urls ?? [],
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
  title,
  description,
  submitLabel,
}: BundleFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BundleFormValues>({
    defaultValues: toFormValues(bundle),
  });

  const { register, control, handleSubmit, reset, setValue, watch } = form;
  const imageValues = watch("image_urls");
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

  const dialogTitle = title ?? "Edit bundle";
  const dialogDescription =
    description ??
    (bundle.name ? (
      <>Update all fields for {bundle.name}.</>
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
      <DialogContent className="sm:max-w-lg max-h-[88svh] overflow-y-auto">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="font-sans">{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
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
            <div className="grid gap-2 md:col-span-2">
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
            <ImageUploadPool
              values={imageValues}
              onChange={(urls) =>
                setValue("image_urls", urls, { shouldDirty: true })
              }
              label="Bundle images"
            />
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
                <BundleItemRow
                  key={field.id}
                  index={index}
                  form={form}
                  disableRemove={fields.length === 1}
                  onRemove={() => remove(index)}
                />
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
              {primaryActionLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type BundleItemRowProps = {
  index: number;
  form: UseFormReturn<BundleFormValues>;
  onRemove: () => void;
  disableRemove: boolean;
};

function BundleItemRow({
  index,
  form,
  onRemove,
  disableRemove,
}: BundleItemRowProps) {
  const { control, setValue, watch } = form;
  const productId = watch(`bundle_items.${index}.product_id`);
  const searchProducts = useAdminStore((state) => state.searchProducts);

  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string | null>(null);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    setSearching(true);
    setSearchError(null);

    searchProducts(searchTerm.trim(), controller.signal)
      .then((products) => {
        if (!cancelled) setResults(products ?? []);
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        if (!cancelled) {
          setSearchError(
            err instanceof Error ? err.message : "Failed to search products"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchProducts, searchTerm]);

  const handleSelectProduct = (product: Product) => {
    setValue(`bundle_items.${index}.product_id`, product.id, {
      shouldDirty: true,
    });
    setSelectedName(product.name);
    setSearchTerm("");
    setResults([]);
  };

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
        <div className="grid gap-2 items-start">
          <Label>Selected product</Label>
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            {productId ? (
              <span className="font-medium">
                ID #{productId}
                {selectedName ? (
                  <span className="text-muted-foreground">
                    {` · ${selectedName}`}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="text-muted-foreground">No product selected</span>
            )}
          </div>
          <Controller
            control={control}
            name={`bundle_items.${index}.product_id`}
            render={({ field }) => (
              <input type="hidden" {...field} value={field.value ?? ""} />
            )}
          />
          <p className="text-xs text-muted-foreground">
            Use the search below to choose a product.
          </p>
        </div>
        <div className="grid gap-2 items-start h-fit">
          <Label>Quantity</Label>
          <Controller
            control={control}
            name={`bundle_items.${index}.amount`}
            render={({ field }) => (
              <Input
                type="number"
                min={1}
                value={field.value ?? ""}
                onChange={(event) => {
                  const value = event.target.value;
                  const parsed = value === "" ? "" : Number(event.target.value);
                  field.onChange(parsed);
                }}
                onBlur={field.onBlur}
                ref={field.ref}
              />
            )}
          />
        </div>
        <div className="flex items-start justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disableRemove}
          >
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`bundle-item-search-${index}`}>Search product</Label>
        <Input
          id={`bundle-item-search-${index}`}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Type at least 2 characters"
        />
        {searching && (
          <p className="text-xs text-muted-foreground">Searching...</p>
        )}
        {searchError && <p className="text-xs text-red-600">{searchError}</p>}
        {!searching && results.length > 0 && (
          <div className="space-y-1 rounded-md border bg-muted/40 p-2">
            {results.map((product) => (
              <button
                key={product.id}
                type="button"
                className="flex w-full flex-col rounded-md px-2 py-1 text-left hover:bg-background"
                onClick={() => handleSelectProduct(product)}
              >
                <span className="font-medium">{product.name}</span>
                <span className="text-xs text-muted-foreground">
                  ID #{product.id} · Rp {product.price.toLocaleString("id-ID")}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
