import { useEffect, useMemo, useState, type ReactElement } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/admin/data-table";
import { TablePagination } from "@/components/shared/TablePagination";
import { useAdminStore } from "@/store/adminStore";
import type {
  ManualPaymentProofWithOrderUser,
  OrderPaymentStatusEnum,
  UserDepartmentEnum,
} from "@/types/types";

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number | string | null | undefined) =>
  currencyFormatter.format(
    typeof value === "string" ? Number(value) || 0 : value ?? 0
  );

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusTone: Record<
  OrderPaymentStatusEnum,
  { label: string; variant: string; icon: ReactElement }
> = {
  Pending: {
    label: "Pending",
    variant: "outline",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
  Paid: {
    label: "Paid",
    variant: "default",
    icon: <ShieldCheck className="h-4 w-4" />,
  },
  Failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="h-4 w-4" />,
  },
  Refunded: {
    label: "Refunded",
    variant: "outline",
    icon: <ShieldAlert className="h-4 w-4" />,
  },
};

export default function ManualPaymentsAdmin() {
  const proofs = useAdminStore((s) => s.manualProofs);
  const total = useAdminStore((s) => s.manualProofTotal);
  const pageIndex = useAdminStore((s) => s.manualProofPageIndex);
  const pageSize = useAdminStore((s) => s.manualProofPageSize);
  const hasNext = useAdminStore((s) => s.manualProofHasNext);
  const storedStatus = useAdminStore((s) => s.manualProofStatus);
  const storedSearch = useAdminStore((s) => s.manualProofSearch);
  const fetchManualProofs = useAdminStore((s) => s.fetchManualProofs);
  const reviewManualProof = useAdminStore((s) => s.reviewManualProof);

  const [statusFilter, setStatusFilter] = useState(storedStatus);
  const [search, setSearch] = useState(storedSearch ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(storedSearch ?? "");
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null);
  const [selectedProof, setSelectedProof] =
    useState<ManualPaymentProofWithOrderUser | null>(null);

  useEffect(() => {
    setStatusFilter(storedStatus);
  }, [storedStatus]);

  useEffect(() => {
    setSearch(storedSearch ?? "");
    setDebouncedSearch(storedSearch ?? "");
  }, [storedSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    if (selectedProof) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [selectedProof]);

  useEffect(() => {
    fetchManualProofs({
      status: statusFilter,
      search: debouncedSearch,
      limit: pageSize,
      offset: 0,
    }).catch((err) =>
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memuat bukti pembayaran manual."
      )
    );
  }, [statusFilter, debouncedSearch, fetchManualProofs, pageSize]);

  const handleDecision = async (
    proofId: number,
    decision: "approve" | "reject"
  ) => {
    setIsSubmitting(proofId);
    try {
      await reviewManualProof(proofId, decision);
      toast.success(
        decision === "approve"
          ? "Bukti pembayaran disetujui."
          : "Bukti pembayaran ditolak."
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal memperbarui status pembayaran."
      );
    } finally {
      setIsSubmitting(null);
    }
  };

  const handleNext = () => {
    if (!hasNext) return;
    fetchManualProofs({
      status: statusFilter,
      search: debouncedSearch,
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
    }).catch(() => {});
  };

  const handlePrev = () => {
    if (pageIndex === 0) return;
    const nextOffset = (pageIndex - 1) * pageSize;
    fetchManualProofs({
      status: statusFilter,
      search: debouncedSearch,
      limit: pageSize,
      offset: nextOffset,
    }).catch(() => {});
  };

  const columns = useMemo<ColumnDef<ManualPaymentProofWithOrderUser>[]>(
    () => [
      {
        id: "proof",
        header: "Bukti",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 overflow-hidden rounded-md border border-white/10 bg-white/10">
              <img
                src={row.original.image_url}
                alt={`Bukti #${row.original.id}`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <p>ID: {row.original.id}</p>
              <p>
                Uploaded:{" "}
                {formatDate(
                  row.original.created_at ?? row.original.order.created_at
                )}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "order",
        header: "Order",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-semibold">#{row.original.order.id}</div>
            <div className="text-xs text-muted-foreground">
              {formatDate(row.original.order.created_at)}
            </div>
            {/* <div className="text-[11px] text-muted-foreground">
              Tx: {row.original.order.transaction_id ?? "-"}
            </div> */}
          </div>
        ),
      },
      {
        id: "buyer",
        header: "Pembeli",
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-semibold">{row.original.user.name}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.user.department as UserDepartmentEnum} •{" "}
              {row.original.user.nim || "-"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const tone =
            statusTone[
              row.original.order.payment_status as OrderPaymentStatusEnum
            ];
          return (
            <div className="space-y-1">
              <Badge
                variant={tone.variant as "default" | "outline" | "destructive"}
              >
                <span className="mr-1 inline-flex">{tone.icon}</span>
                {tone.label}
              </Badge>
              <div className="text-[11px] text-muted-foreground">
                Proof: {row.original.status}
              </div>
            </div>
          );
        },
      },
      {
        id: "total",
        header: "Total",
        cell: ({ row }) => (
          <div className="text-sm font-semibold">
            {formatCurrency(row.original.order.total_amount)}
            <div className="text-[11px] text-muted-foreground">
              Order: {row.original.order.payment_status}
            </div>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={isSubmitting === row.original.id}
              onClick={() => handleDecision(row.original.id, "reject")}
            >
              {isSubmitting === row.original.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="mr-2 h-4 w-4" />
              )}
              Tolak
            </Button>
            <Button
              size="sm"
              variant="default"
              disabled={isSubmitting === row.original.id}
              onClick={() => handleDecision(row.original.id, "approve")}
            >
              {isSubmitting === row.original.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Setujui
            </Button>
          </div>
        ),
      },
    ],
    [handleDecision, isSubmitting]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold">Manual Payment</p>
          <p className="text-sm text-muted-foreground">
            Review and approve pembayaran manual
          </p>
        </div>
        <Button variant="outline" onClick={() => fetchManualProofs()}>
          Refresh
        </Button>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <div className="space-y-2 min-w-0">
          <Label>Status bukti</Label>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as typeof statusFilter)}
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-48">
              <SelectItem
                value="all"
                className="whitespace-normal wrap-break-word text-left"
              >
                Semua Status
              </SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-0 lg:col-span-2">
          <Label htmlFor="manual-search">Cari nama/NIM/transaksi</Label>
          <Input
            id="manual-search"
            placeholder="Cari nama, NIM, atau transaksi"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full wrap-break-word"
          />
        </div>
      </div>

      <div className="flex h-[88svh] min-w-0 flex-col space-y-4">
        <DataTable
          columns={columns}
          data={proofs}
          onRowClick={(row) => setSelectedProof(row)}
        />
        <TablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          currentCount={proofs.length}
          hasNextPage={hasNext}
          onNext={handleNext}
          onPrevious={handlePrev}
          label="manual payment proofs"
        />
      </div>

      {selectedProof ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs px-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-white p-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">Bukti Pembayaran</p>
                <p className="text-sm">
                  Order #{selectedProof.order.id} •{" "}
                  {formatDate(selectedProof.order.created_at)}
                </p>
              </div>
              <Button variant="outline" onClick={() => setSelectedProof(null)}>
                Tutup
              </Button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-3 max-h-[80vh] overflow-y-auto">
              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-xl border border-black bg-white">
                  <img
                    src={selectedProof.image_url}
                    alt={`Bukti #${selectedProof.id}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs  tracking-wide">Pembeli</p>
                  <p className="font-semibold">{selectedProof.user.name}</p>
                  <p className="text-xs ">
                    {/* {selectedProof.user.department as UserDepartmentEnum} •{" "} */}
                    {selectedProof.user.nim || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs  tracking-wide">Order</p>
                  <p className="font-semibold">
                    Total {formatCurrency(selectedProof.order.total_amount)}
                  </p>
                  <p className="text-xs ">
                    Status: {selectedProof.order.payment_status}
                  </p>
                  {/* <p className="text-xs ">
                    Tx: {selectedProof.order.transaction_id ?? "-"}
                  </p> */}
                </div>
                <div>
                  <p className="text-xs  tracking-wide">Proof Status</p>
                  <p className="font-semibold">{selectedProof.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting === selectedProof.id}
                    onClick={() => handleDecision(selectedProof.id, "reject")}
                  >
                    {isSubmitting === selectedProof.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 h-4 w-4" />
                    )}
                    Tolak
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isSubmitting === selectedProof.id}
                    onClick={() => handleDecision(selectedProof.id, "approve")}
                  >
                    {isSubmitting === selectedProof.id ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-2 h-4 w-4" />
                    )}
                    Setujui
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
