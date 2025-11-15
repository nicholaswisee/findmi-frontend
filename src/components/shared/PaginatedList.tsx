import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
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
  const currentCount = data.length;
  const fallbackTotal = pageIndex * pageSize + currentCount;
  const resolvedTotal =
    typeof total === "number" && !Number.isNaN(total) ? total : fallbackTotal;
  const start =
    resolvedTotal === 0 || currentCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end =
    currentCount === 0 ? 0 : pageIndex * pageSize + currentCount;
  const computedHasNext =
    typeof hasNextPage === "boolean" ? hasNextPage : end < resolvedTotal;
  const disablePrev = loading || pageIndex === 0 || !onPrevious;
  const disableNext = loading || !computedHasNext || !onNext;
  const disablePageChange = loading || !onPageChange;
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

  const pageNumbers = React.useMemo(() => {
    const pages: Array<number | "ellipsis"> = [];
    if (pageCount <= 5) {
      for (let i = 0; i < pageCount; i++) pages.push(i);
      return pages;
    }

    pages.push(0);

    const start = Math.max(1, pageIndex - 1);
    const endRange = Math.min(pageCount - 2, pageIndex + 1);

    if (start > 1) {
      pages.push("ellipsis");
    }

    for (let i = start; i <= endRange; i++) {
      pages.push(i);
    }

    if (endRange < pageCount - 2) {
      pages.push("ellipsis-end");
    }

    pages.push(pageCount - 1);
    return pages;
  }, [pageCount, pageIndex]);

  const handlePageClick = (page: number) => {
    if (disablePageChange || page === pageIndex) return;
    onPageChange?.(page);
  };

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
      <div className="flex flex-col gap-3 text-sm">
        <p className="font-bold text-left">
          {resolvedTotal === 0 || currentCount === 0
            ? "No entries on this page"
            : `Showing ${start}-${end} of ${displayTotal} ${label}`}
        </p>

        <Pagination className="mx-auto font-bold">
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
            {pageNumbers.map((page, idx) =>
              typeof page === "number" ? (
                <PaginationItem key={`page-${page}`}>
                  <PaginationLink
                    href="#"
                    isActive={page === pageIndex}
                    onClick={(event) => {
                      event.preventDefault();
                      handlePageClick(page);
                    }}
                    className={cn({
                      "pointer-events-none opacity-50":
                        disablePageChange && page !== pageIndex,
                    })}
                    aria-disabled={disablePageChange && page !== pageIndex}
                  >
                    {page + 1}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`${page}-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}
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
