import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";

export default function UsersAdmin() {
  const users = useAdminStore((state) => state.users);
  const loading = useAdminStore((state) => state.loadingUsers);
  const fetchUsers = useAdminStore((state) => state.fetchUsers);
  const pageIndex = useAdminStore((state) => state.userPageIndex);
  const pageSize = useAdminStore((state) => state.userPageSize);
  const hasNextPage = useAdminStore((state) => state.userHasNext);
  const total = useAdminStore((state) => state.userTotal);
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (users.length === 0) {
      fetchUsers().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load users",
        );
      });
    }
  }, [fetchUsers, users.length]);

  const refetch = useCallback(() => {
    fetchUsers({
      limit: pageSize,
      offset: pageIndex * pageSize,
      search: appliedSearchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh users",
      );
    });
  }, [appliedSearchTerm, fetchUsers, pageIndex, pageSize]);

  const handleNextPage = useCallback(() => {
    if (loading || !hasNextPage) return;
    fetchUsers({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
      search: appliedSearchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to load next page",
      );
    });
  }, [fetchUsers, hasNextPage, loading, pageIndex, pageSize]);

  const handlePreviousPage = useCallback(() => {
    if (loading || pageIndex === 0) return;
    fetchUsers({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      search: appliedSearchTerm,
    }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to load previous page",
      );
    });
  }, [fetchUsers, loading, pageIndex, pageSize]);

  const handleOrderClick = useCallback(
    (orderId: number) => {
      navigate(`/dashboard/orders?orderId=${orderId}`);
    },
    [navigate],
  );

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;
      return matchesDepartment;
    });
  }, [departmentFilter, users]);

  const handleSearch = useCallback(() => {
    const term = searchTerm.trim();
    setAppliedSearchTerm(term);
    fetchUsers({ limit: pageSize, offset: 0, search: term }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to search users",
      );
    });
  }, [fetchUsers, pageSize, searchTerm]);

  const handleResetFilters = () => {
    setDepartmentFilter("all");
    setSearchTerm("");
    setAppliedSearchTerm("");
    fetchUsers({ limit: pageSize, offset: 0, search: "" }).catch((err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to refresh users",
      );
    });
  };

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
              setDepartmentFilter(value as DepartmentFilterValue)
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
          <div className="flex gap-2">
            <Input
              id="user-search"
              placeholder="Type user name..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button onClick={handleSearch} disabled={loading}>
              Search
            </Button>
          </div>
        </div>
        <div className="flex items-end">
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
          data={filteredUsers}
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
