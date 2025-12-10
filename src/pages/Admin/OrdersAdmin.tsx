import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import OrdersTable from "@/components/admin/orders/OrdersTable";
import { OrderAdminDialog } from "@/components/admin/orders/OrderAdminDialog";
import { OrderQrScannerDialog } from "@/components/admin/orders/OrderQrScannerDialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminStore } from "@/store/adminStore";
import { decodeOrderPayload } from "@/utils/qrPayload";
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
import { apiRequest } from "@/lib/api";
import type {
  OrderWithUser,
  OrdersWithUsersResponse,
  UserDepartmentEnum,
} from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
type PickupFilterValue = "all" | "taken" | "pending";

export default function OrdersAdmin() {
  const orders = useAdminStore((state) => state.orders);
  const loading = useAdminStore((state) => state.loadingOrders);
  const fetchOrders = useAdminStore((state) => state.fetchOrders);
  const fetchOrderById = useAdminStore((state) => state.fetchOrderById);
  const pageIndex = useAdminStore((state) => state.orderPageIndex);
  const pageSize = useAdminStore((state) => state.orderPageSize);
  const hasNextPage = useAdminStore((state) => state.orderHasNext);
  const totalOrders = useAdminStore((state) => state.orderTotal);
  const storedOrderSearch = useAdminStore((state) => state.orderSearchQuery);
  const storedOrderDepartment = useAdminStore(
    (state) => state.orderDepartmentFilter
  );
  const storedOrderPickup = useAdminStore((state) => state.orderPickupFilter);
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
  const [scannerOpen, setScannerOpen] = useState(false);
  const locationOrder =
    (location.state as { order?: OrderWithUser } | null)?.order ?? null;

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
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      const decoded = decodeOrderPayload(tokenParam);
      if (typeof decoded === "number" && !Number.isNaN(decoded)) {
        setActiveOrderId(decoded);
        const next = new URLSearchParams(searchParams);
        next.delete("token");
        next.set("orderId", String(decoded));
        setSearchParams(next, { replace: true });
        return;
      }
    }

    const orderIdParam = searchParams.get("orderId");
    if (!orderIdParam) {
      setActiveOrderId(null);
      setActiveOrder(null);
      return;
    }

    const parsed = Number(orderIdParam);
    if (Number.isNaN(parsed)) {
      setActiveOrderId(null);
      setActiveOrder(null);
      return;
    }
    setActiveOrderId(parsed);
  }, [searchParams, setSearchParams]);

  const closeDialog = useCallback(() => {
    setActiveOrderId(null);
    setActiveOrder(null);
    const next = new URLSearchParams(searchParams);
    const hadOrderId = next.has("orderId");
    const hadToken = next.has("token");
    if (hadOrderId) {
      next.delete("orderId");
    }
    if (hadToken) {
      next.delete("token");
    }
    const hadSearchParamChanged = hadOrderId || hadToken;
    if (hadSearchParamChanged) {
      setSearchParams(next);
    }
    if (location.state || hadSearchParamChanged) {
      const searchString = next.toString();
      navigateRouter(
        {
          pathname: location.pathname,
          search: searchString ? `?${searchString}` : "",
        },
        { replace: true, state: null }
      );
    }
  }, [
    location.pathname,
    location.state,
    navigateRouter,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (activeOrderId === null) {
      setActiveOrder(null);
      return;
    }

    if (activeOrder && activeOrder.id === activeOrderId) {
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

    let isMounted = true;
    const toastId = toast.loading("Memuat detail pesanan...");
    fetchOrderById(activeOrderId)
      .then((order) => {
        if (isMounted) {
          setActiveOrder(order);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        const message =
          err instanceof Error ? err.message : "Pesanan tidak ditemukan.";
        toast.error(message);
        closeDialog();
      })
      .finally(() => {
        toast.dismiss(toastId);
      });

    return () => {
      isMounted = false;
      toast.dismiss(toastId);
    };
  }, [
    activeOrder,
    activeOrderId,
    closeDialog,
    fetchOrderById,
    location.pathname,
    location.search,
    locationOrder,
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
      toast.error(
        err instanceof Error ? err.message : "Gagal memuat ulang data"
      );
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

  const handleExportCsv = useCallback(async () => {
    try {
      const limit = 100;
      let offset = 0;
      const allOrders: OrderWithUser[] = [];

      // Fetch all pages with current filters (backend caps limit at 100)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });
        const trimmedSearch = debouncedSearch.trim();
        if (trimmedSearch) {
          params.set("search", trimmedSearch);
        }
        if (departmentFilter && departmentFilter !== "all") {
          params.set("department", departmentFilter);
        }
        if (pickupFilter && pickupFilter !== "all") {
          params.set("pickup", pickupFilter);
        }

        const data = await apiRequest<OrdersWithUsersResponse>(
          `/order/admin?${params.toString()}`
        );

        allOrders.push(...data.orders);

        if (data.offset + data.orders.length >= data.total) {
          break;
        }

        offset = data.offset + data.limit;
      }

      if (allOrders.length === 0) {
        toast.info("Tidak ada pesanan untuk diekspor.");
        return;
      }

      const escapeCsv = (value: unknown): string => {
        if (value === null || value === undefined) return "";
        const str = String(value);
        if (/[",\n]/.test(str)) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = [
        "Order ID",
        "Buyer Name",
        "Buyer NIM",
        "Department",
        "Division",
        "Payment Status",
        "Payment Method",
        "Total Amount",
        "Is Taken",
        "Fulfillment",
        "Delivery Fee",
        "Created At",
        "Admin Note",
      ];

      const rows = allOrders.map((order) => [
        order.id,
        order.user.name,
        order.user.nim,
        order.user.department,
        order.user.division,
        order.payment_status,
        order.payment_method,
        order.total_amount,
        order.is_taken ? "Taken" : "Pending",
        order.fulfillment_method,
        order.delivery_fee,
        new Date(order.created_at).toLocaleString("id-ID"),
        order.admin_note ?? "",
      ]);

      const csvLines = [
        headers.map(escapeCsv).join(","),
        ...rows.map((row) => row.map(escapeCsv).join(",")),
      ];
      const csvContent = csvLines.join("\r\n");

      const blob = new Blob([csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "orders-export.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Export orders ke CSV berhasil.");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Gagal mengekspor data pesanan ke CSV"
      );
    }
  }, [debouncedSearch, departmentFilter, pickupFilter]);

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

  const handleScanValue = useCallback(
    (value: string) => {
      const decodedId = decodeOrderPayload(value);
      if (typeof decodedId === "number" && !Number.isNaN(decodedId)) {
        setScannerOpen(false);
        openDialogForOrder(decodedId);
        return;
      }

      const extractOrderId = (input: string): number | null => {
        if (!input) return null;
        const paramMatch = input.match(/[?&]orderId=(\d+)/i);
        if (paramMatch) {
          return Number(paramMatch[1]);
        }
        const hashMatch = input.match(/order[^\d]*(\d+)/i);
        if (hashMatch) {
          return Number(hashMatch[1]);
        }
        const numeric = input.trim();
        if (/^\d+$/.test(numeric)) {
          return Number(numeric);
        }
        return null;
      };

      const orderId = extractOrderId(value);
      if (!orderId) {
        toast.error(
          "QR tidak valid. Pastikan menggunakan QR order dari pelanggan."
        );
        return;
      }
      setScannerOpen(false);
      openDialogForOrder(orderId);
    },
    [openDialogForOrder]
  );

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-semibold">Orders Overview</p>
          <p className="text-sm text-muted-foreground">
            Review customer orders, add notes, track pickup status, atau scan QR
            dari pembeli.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => setScannerOpen(true)}
          >
            Scan QR Order
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-4">
        <div className="space-y-2 min-w-0">
          <Label>Department</Label>
          <Select
            value={departmentFilter}
            onValueChange={(value) =>
              setDepartmentFilter(value as DepartmentFilterValue)
            }
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="max-h-72 w-full min-w-48">
              <SelectItem
                value="all"
                className="whitespace-normal wrap-break-word text-left"
              >
                All Departments
              </SelectItem>
              {DEPARTMENTS.map((dept) => (
                <SelectItem
                  key={dept}
                  value={dept}
                  className="whitespace-normal wrap-break-word text-left"
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
            onValueChange={(value) =>
              setPickupFilter(value as PickupFilterValue)
            }
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-48">
              <SelectItem
                value="all"
                className="whitespace-normal wrap-break-word text-left"
              >
                All
              </SelectItem>
              <SelectItem
                value="pending"
                className="whitespace-normal wrap-break-word text-left"
              >
                Pending pickup
              </SelectItem>
              <SelectItem
                value="taken"
                className="whitespace-normal wrap-break-word text-left"
              >
                Taken
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-0 lg:col-span-2">
          <Label htmlFor="order-search">Search by buyer name or NIM</Label>
          <Input
            className="w-full wrap-break-word"
            id="order-search"
            placeholder=""
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="lg:col-span-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            Export CSV
          </Button>
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
      <OrderQrScannerDialog
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleScanValue}
      />
    </section>
  );
}
