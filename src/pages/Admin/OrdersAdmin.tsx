import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import OrdersTable from "@/components/admin/orders/OrdersTable";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
type PickupFilterValue = "all" | "taken" | "pending";

export default function OrdersAdmin() {
  const orders = useAdminStore((state) => state.orders);
  const loading = useAdminStore((state) => state.loadingOrders);
  const fetchOrders = useAdminStore((state) => state.fetchOrders);
  const pageIndex = useAdminStore((state) => state.orderPageIndex);
  const pageSize = useAdminStore((state) => state.orderPageSize);
  const hasNextPage = useAdminStore((state) => state.orderHasNext);
  const updateOrderAdmin = useAdminStore((state) => state.updateOrderAdmin);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [pickupFilter, setPickupFilter] = useState<PickupFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  useEffect(() => {
    if (orders.length === 0) {
      fetchOrders().catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load orders",
        );
      });
    }
  }, [fetchOrders, orders.length]);

  useEffect(() => {
    const param = searchParams.get("orderId");
    if (!param) {
      setActiveOrderId(null);
      return;
    }
    const parsed = Number(param);
    if (Number.isNaN(parsed)) {
      setActiveOrderId(null);
      return;
    }
    setActiveOrderId(parsed);
  }, [searchParams]);

  useEffect(() => {
    if (loading) return;
    if (
      activeOrderId !== null &&
      !orders.some((order) => order.id === activeOrderId)
    ) {
      setActiveOrderId(null);
      if (searchParams.get("orderId")) {
        const next = new URLSearchParams(searchParams);
        next.delete("orderId");
        setSearchParams(next);
      }
    }
  }, [activeOrderId, loading, orders, searchParams, setSearchParams]);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesDepartment =
        departmentFilter === "all" ||
        order.user.department === departmentFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        order.user.name.toLowerCase().includes(normalizedSearch);
      const matchesPickup =
        pickupFilter === "all"
          ? true
          : pickupFilter === "taken"
            ? order.is_taken
            : !order.is_taken;

      return matchesDepartment && matchesSearch && matchesPickup;
    });
  }, [departmentFilter, orders, pickupFilter, searchTerm]);

  const handleRefresh = () => {
    fetchOrders({
      limit: pageSize,
      offset: pageIndex * pageSize,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to refresh");
    });
  };

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchOrders({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load page");
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchOrders({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Failed to load page");
    });
  };

  const handleUpdateOrder = useCallback(
    async (
      orderId: number,
      values: { admin_note?: string | null; is_taken?: boolean },
    ) => {
      try {
        await updateOrderAdmin(orderId, values);
        toast.success("Order updated");
      } catch (err) {
        toast.error((err as Error).message ?? "Failed to update order");
      }
    },
    [updateOrderAdmin],
  );

  const resetFilters = () => {
    setDepartmentFilter("all");
    setPickupFilter("all");
    setSearchTerm("");
  };

  const handleDialogOpenChange = useCallback(
    (orderId: number, open: boolean) => {
      if (open) {
        setActiveOrderId(orderId);
        const next = new URLSearchParams(searchParams);
        next.set("orderId", String(orderId));
        setSearchParams(next);
      } else {
        setActiveOrderId((current) => (current === orderId ? null : current));
        if (searchParams.get("orderId")) {
          const next = new URLSearchParams(searchParams);
          next.delete("orderId");
          setSearchParams(next);
        }
      }
    },
    [searchParams, setSearchParams],
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Orders Overview</p>
          <p className="text-sm text-muted-foreground">
            Review customer orders, add notes, and track pickup status.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          Refresh
        </Button>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
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
          <Label>Pickup status</Label>
          <Select
            value={pickupFilter}
            onValueChange={(value) =>
              setPickupFilter(value as PickupFilterValue)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending pickup</SelectItem>
              <SelectItem value="taken">Taken</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="order-search">Search by buyer</Label>
          <Input
            id="order-search"
            placeholder="Search by buyer name..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="lg:col-span-4 flex justify-end">
          <Button variant="secondary" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <OrdersTable
          data={filteredOrders}
          pageIndex={pageIndex}
          pageSize={pageSize}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          activeOrderId={activeOrderId}
          onDialogOpenChange={handleDialogOpenChange}
          onEditOrder={(order, values) => handleUpdateOrder(order.id, values)}
        />
      )}
    </section>
  );
}
