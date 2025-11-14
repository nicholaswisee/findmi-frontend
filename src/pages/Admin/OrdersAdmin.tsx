import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import OrdersTable from "@/components/admin/orders/OrdersTable";
import { OrderAdminDialog } from "@/components/admin/orders/OrderAdminDialog";
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
import type { OrderWithUser, UserDepartmentEnum } from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
type PickupFilterValue = "all" | "taken" | "pending";

export default function OrdersAdmin() {
  const orders = useAdminStore((state) => state.orders);
  const loading = useAdminStore((state) => state.loadingOrders);
  const fetchOrders = useAdminStore((state) => state.fetchOrders);
  const pageIndex = useAdminStore((state) => state.orderPageIndex);
  const pageSize = useAdminStore((state) => state.orderPageSize);
  const hasNextPage = useAdminStore((state) => state.orderHasNext);
  const totalOrders = useAdminStore((state) => state.orderTotal);
  const storedOrderSearch = useAdminStore((state) => state.orderSearchQuery);
  const storedOrderDepartment = useAdminStore(
    (state) => state.orderDepartmentFilter
  );
  const storedOrderPickup = useAdminStore(
    (state) => state.orderPickupFilter
  );
  const updateOrderAdmin = useAdminStore((state) => state.updateOrderAdmin);

  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>(storedOrderDepartment ?? "all");
  const [pickupFilter, setPickupFilter] = useState<PickupFilterValue>(
    storedOrderPickup ?? "all"
  );
  const [searchTerm, setSearchTerm] = useState(storedOrderSearch ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(
    storedOrderSearch ?? ""
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigateRouter = useNavigate();
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [activeOrder, setActiveOrder] = useState<OrderWithUser | null>(null);
  const locationOrder =
    ((location.state as { order?: OrderWithUser } | null)?.order) ?? null;

  useEffect(() => {
    setDepartmentFilter(storedOrderDepartment ?? "all");
  }, [storedOrderDepartment]);

  useEffect(() => {
    setPickupFilter(storedOrderPickup ?? "all");
  }, [storedOrderPickup]);

  useEffect(() => {
    setSearchTerm(storedOrderSearch ?? "");
    setDebouncedSearch(storedOrderSearch ?? "");
  }, [storedOrderSearch]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);
    return () => {
      window.clearTimeout(handle);
    };
  }, [searchTerm]);

  useEffect(() => {
    fetchOrders({
      limit: pageSize,
      offset: 0,
      search: debouncedSearch,
      department: departmentFilter,
      pickup: pickupFilter,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Gagal memuat pesanan");
    });
  }, [debouncedSearch, departmentFilter, pickupFilter, fetchOrders, pageSize]);

  useEffect(() => {
    const param = searchParams.get("orderId");
    if (!param) {
      setActiveOrderId(null);
      setActiveOrder(null);
      return;
    }
    const parsed = Number(param);
    if (Number.isNaN(parsed)) {
      setActiveOrderId(null);
      setActiveOrder(null);
      return;
    }
    setActiveOrderId(parsed);
  }, [searchParams]);

  const closeDialog = useCallback(() => {
    setActiveOrderId(null);
    setActiveOrder(null);
    const next = new URLSearchParams(searchParams);
    const hadOrderId = next.has("orderId");
    if (hadOrderId) {
      next.delete("orderId");
      setSearchParams(next);
    }
    if (location.state || hadOrderId) {
      const searchString = next.toString();
      navigateRouter(
        {
          pathname: location.pathname,
          search: searchString ? `?${searchString}` : "",
        },
        { replace: true, state: null }
      );
    }
  }, [location.pathname, location.state, navigateRouter, searchParams, setSearchParams]);

  useEffect(() => {
    if (activeOrderId === null) {
      setActiveOrder(null);
      return;
    }

    const existing = orders.find((order) => order.id === activeOrderId);
    if (existing) {
      setActiveOrder(existing);
      return;
    }

    if (locationOrder && locationOrder.id === activeOrderId) {
      setActiveOrder(locationOrder);
      navigateRouter(
        {
          pathname: location.pathname,
          search: location.search,
        },
        { replace: true, state: null }
      );
      return;
    }

    if (activeOrder) {
      return;
    }

    if (!loading) {
      toast.error("Pesanan tidak ditemukan pada halaman ini.");
      closeDialog();
    }
  }, [
    activeOrder,
    activeOrderId,
    closeDialog,
    location.pathname,
    location.search,
    locationOrder,
    loading,
    navigateRouter,
    orders,
  ]);

  const handleRefresh = () => {
    fetchOrders({
      limit: pageSize,
      offset: pageIndex * pageSize,
      search: debouncedSearch,
      department: departmentFilter,
      pickup: pickupFilter,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Gagal memuat ulang data");
    });
  };

  const handleNextPage = () => {
    if (loading || !hasNextPage) return;
    fetchOrders({
      limit: pageSize,
      offset: (pageIndex + 1) * pageSize,
      search: debouncedSearch,
      department: departmentFilter,
      pickup: pickupFilter,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Gagal memuat halaman");
    });
  };

  const handlePreviousPage = () => {
    if (loading || pageIndex === 0) return;
    fetchOrders({
      limit: pageSize,
      offset: (pageIndex - 1) * pageSize,
      search: debouncedSearch,
      department: departmentFilter,
      pickup: pickupFilter,
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Gagal memuat halaman");
    });
  };

  const handleUpdateOrder = useCallback(
    async (
      orderId: number,
      values: { admin_note?: string | null; is_taken?: boolean }
    ) => {
      try {
        await updateOrderAdmin(orderId, values);
        toast.success("Pesanan berhasil diperbarui");
      } catch (err) {
        toast.error((err as Error).message ?? "Gagal memperbarui pesanan");
      }
    },
    [updateOrderAdmin]
  );

  const handleActiveOrderSubmit = useCallback(
    (values: { admin_note?: string | null; is_taken?: boolean }) => {
      if (activeOrderId === null) {
        return Promise.resolve();
      }
      return handleUpdateOrder(activeOrderId, values);
    },
    [activeOrderId, handleUpdateOrder]
  );

    const resetFilters = () => {
      setDepartmentFilter("all");
      setPickupFilter("all");
      setSearchTerm("");
    };

  const openDialogForOrder = useCallback(
    (orderId: number) => {
      setActiveOrderId(orderId);
      const next = new URLSearchParams(searchParams);
      next.set("orderId", String(orderId));
      setSearchParams(next);
    },
    [searchParams, setSearchParams]
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
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-4">
        <div className="space-y-2 min-w-0">
          <Label>Department</Label>
          <Select
            value={departmentFilter}
            onValueChange={(value) => setDepartmentFilter(value as DepartmentFilterValue)}
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="max-h-72 w-full min-w-[12rem]">
              <SelectItem value="all" className="whitespace-normal break-words text-left">
                All Departments
              </SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem
                  key={dept}
                  value={dept}
                  className="whitespace-normal break-words text-left"
                >
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-0">
          <Label>Pickup status</Label>
          <Select
            value={pickupFilter}
            onValueChange={(value) => setPickupFilter(value as PickupFilterValue)}
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-[12rem]">
              <SelectItem value="all" className="whitespace-normal break-words text-left">
                All
              </SelectItem>
              <SelectItem value="pending" className="whitespace-normal break-words text-left">
                Pending pickup
              </SelectItem>
              <SelectItem value="taken" className="whitespace-normal break-words text-left">
                Taken
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-0 lg:col-span-2">
          <Label htmlFor="order-search">Search by buyer</Label>
          <Input
            className="w-full break-words"
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
          data={orders}
          pageIndex={pageIndex}
          pageSize={pageSize}
          total={totalOrders}
          hasNextPage={hasNextPage}
          loading={loading}
          onNextPage={handleNextPage}
          onPreviousPage={handlePreviousPage}
          onSelectOrder={(order) => openDialogForOrder(order.id)}
        />
      )}

      {activeOrder && (
        <OrderAdminDialog
          order={activeOrder}
          open
          onOpenChange={(open) => {
            if (!open) {
              closeDialog();
            }
          }}
          onSubmit={handleActiveOrderSubmit}
        />
      )}
    </section>
  );
}
