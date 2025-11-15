import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type PaginatedListProps<T> = {
  data: T[];
  component: React.ComponentType<{ item: T }>;
  pageIndex: number;
  pageSize: number;
  total: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onPageChange?: (pageIndex: number) => void;
  label?: string;
  getItemKey?: (item: T, index: number) => React.Key;
  emptyState?: React.ReactNode;
  layout?: "list" | "grid";
  layoutClassName?: string;
};

export function PaginatedList<T>({
  data,
  component: ItemComponent,
  pageIndex,
  pageSize,
  total,
  hasNextPage,
  loading,
  onNext,
  onPrevious,
  onPageChange,
  label = "items",
  getItemKey,
  emptyState,
  layout = "list",
  layoutClassName,
}: PaginatedListProps<T>) {
  const bodyFontStyle = {
    fontFamily: "var(--font-subheading, 'Darker Grotesque')",
  };
  const currentCount = data.length;
  const fallbackTotal = pageIndex * pageSize + currentCount;
  const resolvedTotal =
    typeof total === "number" && !Number.isNaN(total) ? total : fallbackTotal;
  const start =
    resolvedTotal === 0 || currentCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = currentCount === 0 ? 0 : pageIndex * pageSize + currentCount;
  const computedHasNext =
    typeof hasNextPage === "boolean" ? hasNextPage : end < resolvedTotal;
  const hasPrevHandler = Boolean(onPrevious ?? onPageChange);
  const hasNextHandler = Boolean(onNext ?? onPageChange);
  const disablePrev = loading || pageIndex === 0 || !hasPrevHandler;
  const disableNext = loading || !computedHasNext || !hasNextHandler;
  const containerClass =
    layout === "grid"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : "flex flex-col gap-4";
  const safePageSize = pageSize > 0 ? pageSize : 1;
  let pageCount =
    resolvedTotal > 0
      ? Math.max(1, Math.ceil(resolvedTotal / safePageSize))
      : Math.max(1, pageIndex + 1);
  if (typeof total !== "number" && computedHasNext) {
    pageCount = Math.max(pageCount, pageIndex + 2);
  }
  const displayTotal =
    typeof total === "number"
      ? resolvedTotal.toString()
      : computedHasNext
      ? `${resolvedTotal}+`
      : `${resolvedTotal}`;

  return (
    <div className="space-y-4 text-black">
      {currentCount === 0 ? (
        emptyState ?? (
          <p className="text-sm text-muted-foreground">
            No {label} to display.
          </p>
        )
      ) : (
        <div className={cn(containerClass, layoutClassName)}>
          {data.map((item, index) => {
            const key = getItemKey?.(item, index) ?? index;
            return <ItemComponent key={key} item={item} />;
          })}
        </div>
      )}
      <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between text-muted-foreground">
        <p
          className="font-semibold text-left text-[#FFD88C] drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]"
          style={bodyFontStyle}
        >
          {resolvedTotal === 0 || currentCount === 0
            ? "Tidak ada entri pada halaman ini"
            : `Memperlihatkan ${start}-${end} dari ${displayTotal} ${label}`}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "rounded-xl border-[#FFD88C]/60 bg-transparent px-4 font-semibold text-[#FFD88C] hover:text-[#ffd88c] transition hover:bg-[#FFD88C]/10",
              disablePrev && "opacity-60"
            )}
            onClick={() => {
              if (disablePrev) return;
              if (pageIndex > 0) {
                if (onPrevious) {
                  onPrevious();
                } else {
                  onPageChange?.(pageIndex - 1);
                }
              }
            }}
            disabled={disablePrev}
          >
            Previous
          </Button>
          <span
            className="text-xs sm:text-sm font-semibold text-[#FFD88C]"
            style={bodyFontStyle}
          >
            Halaman {pageIndex + 1}
            {pageCount ? ` dari ${pageCount}` : ""}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={cn(
              "rounded-xl border-[#FFD88C]/60 bg-transparent px-4 font-semibold text-[#FFD88C] hover:text-[#ffd88c] transition hover:bg-[#FFD88C]/10",
              disableNext && "opacity-60"
            )}
            onClick={() => {
              if (disableNext) return;
              if (onNext) {
                onNext();
              } else {
                onPageChange?.(pageIndex + 1);
              }
            }}
            disabled={disableNext}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
