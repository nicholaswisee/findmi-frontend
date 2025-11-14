import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  label = "items",
  getItemKey,
  emptyState,
  layout = "list",
  layoutClassName,
}: PaginatedListProps<T>) {
  const currentCount = data.length;
  const resolvedTotal =
    typeof total === "number" ? total : pageIndex * pageSize + currentCount;
  const start =
    resolvedTotal === 0 || currentCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end =
    currentCount === 0 ? 0 : pageIndex * pageSize + currentCount;
  const computedHasNext =
    typeof hasNextPage === "boolean" ? hasNextPage : end < resolvedTotal;
  const disablePrev = loading || pageIndex === 0 || !onPrevious;
  const disableNext = loading || !computedHasNext || !onNext;
  const containerClass =
    layout === "grid"
      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      : "flex flex-col gap-4";

  return (
    <div className="space-y-4">
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
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          {resolvedTotal === 0 || currentCount === 0
            ? "No entries on this page"
            : `Showing ${start}-${end} of ${resolvedTotal} ${label}`}
        </p>
        <Pagination className="w-fit sm:justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (disablePrev) return;
                  onPrevious?.();
                }}
                className={cn({
                  "pointer-events-none opacity-50": disablePrev,
                })}
                aria-disabled={disablePrev}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (disableNext) return;
                  onNext?.();
                }}
                className={cn({
                  "pointer-events-none opacity-50": disableNext,
                })}
                aria-disabled={disableNext}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
