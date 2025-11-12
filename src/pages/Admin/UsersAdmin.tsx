import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UserOrdersTable from "@/components/admin/users/UserOrdersTable";
import { useAdminStore } from "@/store/adminStore";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";
import type { Order, UserDepartmentEnum, UserWithOrders } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
const SEARCH_DEBOUNCE_MS = 1000;

export default function UsersAdmin() {
  const users = useAdminStore((state) => state.users);
  const loading = useAdminStore((state) => state.loadingUsers);
  const fetchUsers = useAdminStore((state) => state.fetchUsers);
  const pageIndex = useAdminStore((state) => state.userPageIndex);
  const pageSize = useAdminStore((state) => state.userPageSize);
  const hasNextPage = useAdminStore((state) => state.userHasNext);
  const total = useAdminStore((state) => state.userTotal);
  const departmentFilter = useAdminStore((state) => state.userDepartmentFilter);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal memuat pengguna"
        );
      });
    }
  }, [fetchUsers, users.length]);

  const refetch = useCallback(() => {
    fetchUsers({
      limit: pageSize,
      offset: pageIndex * pageSize,
      search: appliedSearchTerm,
      department: departmentFilter,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat ulang pengguna"
      );
    });
  }, [appliedSearchTerm, departmentFilter, fetchUsers, pageIndex, pageSize]);

  const handleDepartmentChange = useCallback(
    (value: DepartmentFilterValue) => {
      fetchUsers({
        limit: pageSize,
        offset: 0,
        search: appliedSearchTerm,
        department: value,
      }).catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal memfilter pengguna"
        );
      });
    },
    [appliedSearchTerm, fetchUsers, pageSize]
  );

  const handleNextPage = useCallback(() => {
    if (loading || !hasNextPage) return;
    fetchUsers({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
      search: appliedSearchTerm,
      department: departmentFilter,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat halaman berikutnya"
      );
    });
  }, [
    appliedSearchTerm,
    departmentFilter,
    fetchUsers,
    hasNextPage,
    loading,
    pageIndex,
    pageSize,
  ]);

  const handlePreviousPage = useCallback(() => {
    if (loading || pageIndex === 0) return;
    fetchUsers({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      search: appliedSearchTerm,
      department: departmentFilter,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat halaman sebelumnya"
      );
    });
  }, [
    appliedSearchTerm,
    departmentFilter,
    fetchUsers,
    loading,
    pageIndex,
    pageSize,
  ]);

  const handleOrderClick = useCallback(
    (order: Order, user: UserWithOrders) => {
      navigate(`/dashboard/orders?orderId=${order.id}`, {
        state: { order: { ...order, user } },
      });
    },
    [navigate]
  );

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed === appliedSearchTerm) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setAppliedSearchTerm(trimmed);
      fetchUsers({
        limit: pageSize,
        offset: 0,
        search: trimmed,
        department: departmentFilter,
      }).catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Gagal mencari pengguna"
        );
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [appliedSearchTerm, departmentFilter, fetchUsers, pageSize, searchTerm]);

  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    fetchUsers({
      limit: pageSize,
      offset: 0,
      search: "",
      department: "all",
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat ulang pengguna"
      );
    });
  }, [fetchUsers, pageSize]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">User Purchases</p>
          <p className="text-sm text-muted-foreground">
            Lihat seluruh pengguna dan histori pesanan mereka.
          </p>
        </div>
        <Button variant="outline" onClick={refetch} disabled={loading}>
          Refresh
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-[200px_1fr_auto]">
        <div className="space-y-2">
          <Label>Department</Label>
          <Select
            value={departmentFilter}
            onValueChange={(value) =>
              handleDepartmentChange(value as DepartmentFilterValue)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-search">Search by name</Label>
          <Input
            id="user-search"
            placeholder="Type user name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Search updates automatically after a short pause.
          </p>
        </div>
        <div className="flex items-center">
          <Button
            variant="secondary"
            className="w-full"
            onClick={handleResetFilters}
            disabled={loading}
          >
            Reset Filters
          </Button>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <UserOrdersTable
          data={users}
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={total}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onOrderClick={handleOrderClick}
        />
      )}
    </section>
  );
}
