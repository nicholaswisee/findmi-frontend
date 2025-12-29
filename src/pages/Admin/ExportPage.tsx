import { useCallback, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEPARTMENTS } from "@/constants/departments";
import { DIVISIONS } from "@/constants/divisions";
import { apiRequest } from "@/lib/api";
import type {
  OrderWithUser,
  OrdersWithUsersResponse,
  UserDepartmentEnum,
  UserDivisionEnum,
} from "@/types/types";

type DepartmentFilterValue = UserDepartmentEnum | "all";
type PickupFilterValue = "all" | "taken" | "pending";
type CategoryFilterValue =
  | "all"
  | "Umum"
  | "Panitia"
  | "Tutor"
  | "CASIO x Zebra x FindMi";
type DivisionFilterValue = UserDivisionEnum | "all";

const CATEGORY_OPTIONS: { label: string; value: CategoryFilterValue }[] = [
  { label: "All Categories", value: "all" },
  { label: "Umum", value: "Umum" },
  { label: "Kit Panitia", value: "Panitia" },
  { label: "Tutor", value: "Tutor" },
  { label: "CASIO x Zebra x FindMi", value: "CASIO x Zebra x FindMi" },
];

const BIDANG_OPTIONS: UserDepartmentEnum[] = DEPARTMENTS.filter(
  (dept) =>
    !["Umum", "Panitia", "Tutor", "CASIO x Zebra x FindMi", "All"].includes(
      dept
    )
);

export default function ExportPage() {
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [categoryFilter, setCategoryFilter] =
    useState<CategoryFilterValue>("all");
  const [divisionFilter, setDivisionFilter] =
    useState<DivisionFilterValue>("all");
  const [pickupFilter, setPickupFilter] = useState<PickupFilterValue>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [exporting, setExporting] = useState(false);

  const orderMatchesCategory = (
    order: OrderWithUser,
    category: CategoryFilterValue
  ) => {
    if (category === "all") return true;
    if (!Array.isArray(order.items)) return false;
    return order.items.some((item) => {
      const itemCategory =
        item.product?.category ?? item.bundle?.category ?? null;
      return itemCategory === category;
    });
  };

  const orderMatchesBidang = (
    order: OrderWithUser,
    bidang: DepartmentFilterValue
  ) => {
    if (bidang === "all") return true;
    return order.user.department === bidang;
  };

  const orderMatchesDivision = (
    order: OrderWithUser,
    division: DivisionFilterValue
  ) => {
    if (division === "all") return true;
    return order.user.division === division;
  };

  const buildItemsSummary = (order: OrderWithUser) => {
    if (!Array.isArray(order.items) || order.items.length === 0) return "-";
    return order.items
      .map((item) => {
        const isBundle = Boolean(item.bundle);

        if (!isBundle) {
          const label =
            item.product?.name ??
            (item.product_id ? `Produk #${item.product_id}` : `Item #${item.id}`);
          const size =
            item.selected_size && item.selected_size !== ""
              ? `Size: ${item.selected_size}`
              : "";
          const option =
            item.selected_option && item.selected_option !== ""
              ? `Option: ${item.selected_option}`
              : "";
          const details = [size, option].filter(Boolean).join(", ");
          return `${label} x${item.quantity}${
            details ? ` (${details})` : ""
          }`;
        }

        const bundleName =
          item.bundle?.name ?? `Bundle #${item.bundle_id ?? item.id}`;
        const bundleSelections = Array.isArray(item.selected_bundle_items)
          ? item.selected_bundle_items
          : [];
        const bundleItemDetails = Array.isArray(item.bundle?.bundle_items)
          ? item.bundle?.bundle_items
              .map((bundleItem) => {
                const productName =
                  bundleItem.product?.name ?? `Produk #${bundleItem.product_id}`;
                const amount =
                  typeof bundleItem.amount === "number" && bundleItem.amount > 0
                    ? bundleItem.amount
                    : 1;
                const selection = bundleSelections.find(
                  (sel) => sel.product_id === bundleItem.product_id
                );
                const sizeLabel =
                  selection?.size && selection.size.trim().length > 0
                    ? `Size: ${selection.size}`
                    : "";
                const optionLabel =
                  selection?.option && selection.option.trim().length > 0
                    ? `Option: ${selection.option}`
                    : "";
                const extras = [sizeLabel, optionLabel]
                  .filter(Boolean)
                  .join(", ");
                return extras
                  ? `${productName} x${amount} (${extras})`
                  : `${productName} x${amount}`;
              })
              .join("; ")
          : "";

        return `${bundleName} x${item.quantity}${
          bundleItemDetails ? ` [${bundleItemDetails}]` : ""
        }`;
      })
      .join(", ");
  };

  const computeOrderTotal = (order: OrderWithUser) => {
    const subtotal = Array.isArray(order.items)
      ? order.items.reduce((acc, item) => {
          const unit = Number(item.unit_price) || 0;
          const qty = Number(item.quantity) || 0;
          return acc + unit * qty;
        }, 0)
      : 0;
    const delivery = Number(order.delivery_fee) || 0;
    const base = subtotal + delivery;
    const fee = Math.ceil(base * 0.02);
    return base + fee;
  };

  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true);
      const limit = 100;
      let offset = 0;
      const allOrders: OrderWithUser[] = [];

      while (true) {
        const params = new URLSearchParams({
          limit: String(limit),
          offset: String(offset),
        });

        const trimmedSearch = searchTerm.trim();
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

      const filteredOrders = allOrders.filter(
        (order) =>
          orderMatchesBidang(order, departmentFilter) &&
          orderMatchesCategory(order, categoryFilter) &&
          orderMatchesDivision(order, divisionFilter)
      );

      if (filteredOrders.length === 0) {
        toast.info("Tidak ada pesanan yang cocok dengan filter.");
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
        "Multikampus",
        "Payment Status",
        "Payment Method",
        "Total Amount",
        "Is Taken",
        "Fulfillment",
        "Delivery Contact",
        "Delivery Phone",
        "Delivery Address",
        "Delivery Notes",
        "Created At",
        "Admin Note",
        "Items",
      ];

      const rows = filteredOrders.map((order) => [
        order.id,
        order.user.name,
        order.user.nim,
        order.user.department,
        order.user.division,
        order.user.multikampus,
        order.payment_status,
        order.payment_method,
        computeOrderTotal(order),
        order.is_taken ? "Taken" : "Pending",
        order.fulfillment_method,
        order.delivery_contact_name ?? "",
        order.delivery_phone ?? "",
        order.delivery_address ?? "",
        order.delivery_notes ?? "",
        new Date(order.created_at).toLocaleString("id-ID"),
        order.admin_note ?? "",
        buildItemsSummary(order),
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
    } finally {
      setExporting(false);
    }
  }, [
    categoryFilter,
    departmentFilter,
    divisionFilter,
    pickupFilter,
    searchTerm,
  ]);

  const resetFilters = () => {
    setDepartmentFilter("all");
    setCategoryFilter("all");
    setDivisionFilter("all");
    setPickupFilter("all");
    setSearchTerm("");
  };

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <p className="text-2xl font-semibold">Data Export</p>
        <p className="text-sm text-muted-foreground">
          Unduh data pesanan sebagai CSV. Sesuaikan filter jika diperlukan lalu
          tekan tombol export.
        </p>
      </header>

      <div className="grid min-w-0 gap-4 lg:grid-cols-4">
        <div className="space-y-2 min-w-0">
          <Label>By Category</Label>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as CategoryFilterValue)
            }
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="w-full min-w-48">
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="whitespace-normal wrap-break-word text-left"
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 min-w-0">
          <Label>By Bidang</Label>
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
                All Bidang
              </SelectItem>
              {BIDANG_OPTIONS.map((dept) => (
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
          <Label>By Divisi</Label>
          <Select
            value={divisionFilter}
            onValueChange={(value) =>
              setDivisionFilter(value as DivisionFilterValue)
            }
          >
            <SelectTrigger className="w-full whitespace-normal text-left">
              <SelectValue placeholder="All Divisi" />
            </SelectTrigger>
            <SelectContent className="max-h-72 w-full min-w-48">
              <SelectItem
                value="all"
                className="whitespace-normal wrap-break-word text-left"
              >
                All Divisi
              </SelectItem>
              {DIVISIONS.map((div) => (
                <SelectItem
                  key={div}
                  value={div}
                  className="whitespace-normal wrap-break-word text-left"
                >
                  {div}
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleExportCsv}
          disabled={exporting}
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? "Exporting..." : "Export CSV"}
        </Button>
        <Button
          variant="secondary"
          className="w-full sm:w-auto"
          onClick={resetFilters}
          disabled={exporting}
        >
          Reset Filters
        </Button>
        <p className="text-sm text-muted-foreground sm:ml-2">
          Export mengikuti filter yang dipilih dan otomatis memuat semua halaman
          data (permintaan per halaman dibatasi 100 oleh backend).
        </p>
      </div>
    </section>
  );
}
