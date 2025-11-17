import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProductStore, INITIAL_CATEGORY } from "@/store/catalogStore";

export interface SearchBarProps {
  defaultCategoryLabel?: string;
  className?: string;
}

const SEARCH_DEBOUNCE_MS = 600;

export default function SearchBar({
  defaultCategoryLabel = INITIAL_CATEGORY,
  className,
}: SearchBarProps) {
  const bodyFontStyle = {
    fontFamily: "var(--font-subheading, 'Darker Grotesque')",
  };

  const rawCategories = useProductStore((s) => s.allCategories);
  const category = useProductStore((s) => s.category);
  const query = useProductStore((s) => s.query);
  const setQuery = useProductStore((s) => s.setQuery);
  const setCategory = useProductStore((s) => s.setCategory);
  const resetFilters = useProductStore((s) => s.resetFilters);

  const [localQuery, setLocalQuery] = useState(query);
  useEffect(() => setLocalQuery(query), [query]);

  const categories =
    rawCategories && rawCategories.length > 0
      ? rawCategories
      : [defaultCategoryLabel];

  const normalizedCategory = categories.includes(category)
    ? category
    : defaultCategoryLabel;

  const handleReset = () => {
    resetFilters();
    setLocalQuery("");
    setQuery("");
  };

  useEffect(() => {
    const trimmed = localQuery.trim();
    const normalized = (query ?? "").trim();
    if (trimmed === normalized) return;

    const timeout = window.setTimeout(() => {
      setQuery(trimmed);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [localQuery, query, setQuery]);

  return (
    <div
      className={cn(
        "rounded-2xl border border-white/15 bg-white/5 p-4 shadow-lg backdrop-blur-sm sm:p-6",
        className
      )}
    >
      <div className="grid gap-4 sm:grid-cols-[220px_1fr] items-center">
        <div className="space-y-2">
          <Select
            value={normalizedCategory}
            onValueChange={(value) => setCategory(value)}
          >
            <SelectTrigger
              id="catalog-category"
              className="h-11 w-full rounded-lg border-white/30 bg-plain-green text-sm font-semibold text-[#FFD88C] shadow-sm"
              style={bodyFontStyle}
            >
              <SelectValue placeholder={defaultCategoryLabel} />
            </SelectTrigger>
            <SelectContent className="max-h-60 rounded-lg bg-plain-green shadow-xl">
              {categories.map((opt) => (
                <SelectItem
                  key={opt}
                  value={opt}
                  className="font-semibold text-[#FFD88C]"
                  style={bodyFontStyle}
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Input
              id="catalog-search"
              type="search"
              placeholder="Cari nama atau deskripsi produk…"
              value={localQuery}
              onChange={(event) => setLocalQuery(event.target.value)}
              className="h-11 w-full rounded-lg border-white/30 bg-plain-green text-sm font-semibold text-[#FFD88C] placeholder:text-[#FFD88C] shadow-sm"
              style={bodyFontStyle}
            />
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-lg border-[#FFD88C]/60 bg-plain-green font-bold text-[#FFD88C] backdrop-blur-sm transition hover:bg-[#FFD88C]/5 sm:w-auto sm:px-6 hover:text-[#ffd88c]"
              onClick={handleReset}
            >
              Reset Filter
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
