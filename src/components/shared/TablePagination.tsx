import * as React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

type TablePaginationProps = {
  pageIndex: number;
  pageSize: number;
  total: number;
  currentCount: number;
  hasNextPage?: boolean;
  loading?: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  label?: string;
  className?: string;
};

export function TablePagination({
  pageIndex,
  pageSize,
  total,
  currentCount,
  hasNextPage,
  loading,
  onNext,
  onPrevious,
  label = "entries",
  className,
}: TablePaginationProps) {
  const start =
    total === 0 || currentCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end =
    currentCount === 0 ? 0 : pageIndex * pageSize + currentCount;
  const computedHasNext =
    typeof hasNextPage === "boolean"
      ? hasNextPage
      : end < total;
  const disablePrev = loading || pageIndex === 0 || !onPrevious;
  const disableNext = loading || !computedHasNext || !onNext;

  const handlePrevious = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (disablePrev) return;
    onPrevious?.();
  };

  const handleNext = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (disableNext) return;
    onNext?.();
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p>
        {total === 0 || currentCount === 0
          ? "No entries on this page"
          : `Showing ${start}-${end} of ${total} ${label}`}
      </p>
      <Pagination className="w-fit sm:justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={handlePrevious}
              className={cn({
                "pointer-events-none opacity-50": disablePrev,
              })}
              aria-disabled={disablePrev}
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={handleNext}
              className={cn({
                "pointer-events-none opacity-50": disableNext,
              })}
              aria-disabled={disableNext}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
