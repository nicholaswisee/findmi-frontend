import { Button } from "@/components/ui/button";
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
  const end = currentCount === 0 ? 0 : pageIndex * pageSize + currentCount;
  const computedHasNext =
    typeof hasNextPage === "boolean" ? hasNextPage : end < total;
  const disablePrev = loading || pageIndex === 0 || !onPrevious;
  const disableNext = loading || !computedHasNext || !onNext;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p>
        {total === 0 || currentCount === 0
          ? "Tidak ada entri pada halaman ini"
          : `Memperlihatkan ${start}-${end} dari ${total} ${label}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={disablePrev}
        >
          Previous
        </Button>
        <span className="text-xs sm:text-sm">Page {pageIndex + 1}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={disableNext}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
