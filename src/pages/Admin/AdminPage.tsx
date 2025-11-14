import { useCallback, useEffect, useMemo, useState, useId } from "react";
import {
  Wallet,
  BarChart2,
  LineChart,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DEPARTMENTS } from "@/constants/departments";
import type {
  RevenueAnalyticsResponse,
  UserDepartmentEnum,
} from "@/types/types";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("VITE_API_URL is not defined");
}

type DepartmentFilterValue = UserDepartmentEnum | "all";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

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

const formatWeekLabel = (raw: string) => {
  const match = raw.match(/W(\d{1,2}) (\d{4})/i);
  if (!match) return raw;
  const [, weekNumberRaw, year] = match;
  const weekNumber = Number(weekNumberRaw);
  const startOfWeek = new Date(Number(year), 0, weekNumber * 7 - 6);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${formatter.format(startOfWeek)} - ${formatter.format(endOfWeek)}`;
};

const formatPercentChange = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export default function AdminPage() {
  const [departmentFilter, setDepartmentFilter] =
    useState<DepartmentFilterValue>("all");
  const [data, setData] = useState<RevenueAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [ordersPage, setOrdersPage] = useState(0);
  const ORDERS_PER_PAGE = 30;

  const fetchAnalytics = useCallback(async (dept: DepartmentFilterValue) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (dept !== "all") {
        params.set("department", dept);
      }
      const queryString = params.toString();
      const res = await fetch(
        `${API_URL}/analytics/dashboard${queryString ? `?${queryString}` : ""}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        throw new Error("Failed to fetch analytics");
      }
      const payload = (await res.json()) as {
        success: boolean;
        data: RevenueAnalyticsResponse;
        message: string;
      };
      setData(payload.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load analytics data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(departmentFilter).catch(() => {
      // Errors handled inside fetchAnalytics
    });
  }, [departmentFilter, fetchAnalytics]);

  useEffect(() => {
    setOrdersPage(0);
  }, [departmentFilter, data?.recentOrders.length]);

  const weeklyRevenue = data?.weeklyRevenue ?? [];
  const chartData = useMemo(
    () =>
      weeklyRevenue.map((entry) => ({
        weekRaw: entry.week,
        label: formatWeekLabel(entry.week),
        revenue: entry.revenue,
      })),
    [weeklyRevenue]
  );
  const chartLegendEntries = useMemo(
    () => chartData.slice(-6).reverse(),
    [chartData]
  );
  const totalOrdersCount = data?.recentOrders.length ?? 0;
  const totalOrderPages = totalOrdersCount
    ? Math.max(Math.ceil(totalOrdersCount / ORDERS_PER_PAGE), 1)
    : 1;
  const paginatedOrders = useMemo(() => {
    if (!data) return [];
    const start = ordersPage * ORDERS_PER_PAGE;
    return data.recentOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [data, ordersPage]);
  const ordersStartIndex =
    totalOrdersCount === 0 ? 0 : ordersPage * ORDERS_PER_PAGE + 1;
  const ordersEndIndex = Math.min(
    (ordersPage + 1) * ORDERS_PER_PAGE,
    totalOrdersCount
  );
  const latestRevenue = weeklyRevenue.at(-1)?.revenue ?? 0;
  const previousRevenue = weeklyRevenue.at(-2)?.revenue ?? 0;
  const weeklyChangePct =
    previousRevenue > 0
      ? ((latestRevenue - previousRevenue) / previousRevenue) * 100
      : 0;
  const metricCards = useMemo(() => {
    if (!data) return [];
    return [
      {
        title: "Weekly Profit",
        value: formatCurrency(latestRevenue),
        helper: "Last completed week",
        description: "vs previous week",
        icon: LineChart,
        change: weeklyChangePct,
      },
      {
        title: "Lifetime Profit",
        value: formatCurrency(data.summary.totalRevenue),
        helper: `${data.summary.totalOrders} paid orders recorded`,
        description: "All-time revenue across FindMI",
        icon: Wallet,
      },
      {
        title: "Avg Order Value",
        value: formatCurrency(data.summary.averageOrderValue),
        helper: "Across paid transactions",
        description: "Helps plan bundle pricing",
        icon: BarChart2,
      },
    ];
  }, [data, latestRevenue, weeklyChangePct]);
  const chartConfig = useMemo(
    () => ({
      revenue: {
        label: "Profit",
        color: "hsl(var(--primary))",
      },
    }),
    []
  );
  const gradientUniqueId = useId().replace(/:/g, "");
  const chartGradientId = useMemo(
    () => `revenue-gradient-${gradientUniqueId}`,
    [gradientUniqueId]
  );

  const handleOrdersNext = () => {
    if (ordersPage < totalOrderPages - 1) {
      setOrdersPage((prev) => prev + 1);
    }
  };

  const handleOrdersPrevious = () => {
    if (ordersPage > 0) {
      setOrdersPage((prev) => prev - 1);
    }
  };

  const totalDepartmentRevenue = useMemo(() => {
    if (!data) return 0;
    return data.departmentBreakdown.reduce((acc, row) => acc + row.revenue, 0);
  }, [data]);

  return (
    <section className="space-y-6">
      <header className="flex flex-wrap items-start gap-4 lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p className="text-2xl font-semibold">Analytics</p>
          <p className="text-sm text-muted-foreground">Analyze profit</p>
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end sm:justify-end">
          <div className="space-y-1 w-full sm:w-48">
            <Label className="text-xs uppercase text-muted-foreground">
              Department
            </Label>
            <Select
              value={departmentFilter}
              onValueChange={(value) =>
                setDepartmentFilter(value as DepartmentFilterValue)
              }
            >
              <SelectTrigger className="w-full whitespace-normal text-left">
                <SelectValue placeholder="Semua Departemen" />
              </SelectTrigger>
              <SelectContent className="max-h-72 w-64">
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
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => fetchAnalytics(departmentFilter)}
            disabled={loading}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </header>

      {error && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive">
          <CardContent className="py-4 text-sm">
            {error}. Silakan coba muat ulang dasbor.
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {metricCards.map((metric) => {
              const changePositive = (metric.change ?? 0) >= 0;
              const ChangeIcon = changePositive ? TrendingUp : TrendingDown;
              return (
                <Card key={metric.title} className="@container/card">
                  <CardHeader>
                    <div className="space-y-2">
                      <CardDescription>{metric.title}</CardDescription>
                      {typeof metric.change === "number" ? (
                        <Badge
                          variant="outline"
                          className="flex min-w-0 flex-wrap items-center justify-start gap-1 whitespace-normal text-left text-xs font-medium sm:flex-nowrap sm:text-sm"
                        >
                          <ChangeIcon className="h-4 w-4" />
                          {formatPercentChange(metric.change)}
                        </Badge>
                      ) : (
                        <metric.icon className="h-5 w-5 text-muted-foreground" />
                      )}
                      <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                        {metric.value}
                      </CardTitle>
                    </div>
                    <CardAction />
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1.5 text-sm">
                    {metric.helper && (
                      <div className="font-semibold text-foreground">
                        {metric.helper}
                      </div>
                    )}
                    {metric.description && (
                      <div className="text-muted-foreground">
                        {metric.description}
                      </div>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="relative">
              <CardHeader className="flex flex-col gap-1 space-y-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Profit Curve</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Rolling 12-week revenue trend
                  </p>
                </div>
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                {chartData.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No paid orders recorded for this selection.
                  </p>
                ) : (
                  <>
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-[240px] w-full lg:h-[300px]"
                    >
                      <AreaChart
                        data={chartData}
                        margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id={chartGradientId}
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="var(--color-revenue, hsl(var(--primary)))"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="var(--color-revenue, hsl(var(--primary)))"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="4 4"
                          vertical={false}
                          className="stroke-muted"
                        />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          axisLine={false}
                          tickMargin={8}
                          minTickGap={16}
                        />
                        <ChartTooltip
                          cursor={{ strokeDasharray: "3 3" }}
                          content={
                            <ChartTooltipContent
                              hideLabel
                              formatter={(value) =>
                                formatCurrency(Number(value ?? 0))
                              }
                            />
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="var(--color-revenue, hsl(var(--primary)))"
                          fill={`url(#${chartGradientId})`}
                          fillOpacity={1}
                          strokeWidth={3}
                        />
                      </AreaChart>
                    </ChartContainer>
                    {chartLegendEntries.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        {chartLegendEntries.map((entry) => (
                          <Badge
                            key={entry.weekRaw}
                            variant="outline"
                            className="font-mono"
                          >
                            {entry.label} · {formatCurrency(entry.revenue)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Contribution</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto lg:max-h-[400px] lg:overflow-y-auto lg:pr-2">
                {data.departmentBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No department data available for this filter.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Share</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.departmentBreakdown.map((row, index) => {
                        const share =
                          totalDepartmentRevenue > 0
                            ? (row.revenue / totalDepartmentRevenue) * 100
                            : 0;
                        return (
                          <TableRow
                            key={row.department}
                            className={index === 0 ? "bg-muted/40" : undefined}
                          >
                            <TableCell className="font-semibold">
                              {row.department}
                              <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                                <span
                                  className="block h-full rounded-full bg-primary"
                                  style={{ width: `${share}%` }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {row.orders}{" "}
                              <span className="text-muted-foreground">
                                {row.orders === 1 ? "order" : "orders"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm font-medium">
                              {share.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {formatCurrency(row.revenue)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Recent Paid Orders</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {totalOrdersCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recent paid orders.
                </p>
              ) : (
                <>
                  <div className="rounded-lg border">
                    <div className="max-h-96 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell className="font-semibold">
                                #{order.id}
                              </TableCell>
                              <TableCell className="min-w-[140px] whitespace-normal">
                                {order.user.name}
                              </TableCell>
                              <TableCell className="min-w-[140px] whitespace-normal">
                                {order.user.department}
                              </TableCell>
                              <TableCell>
                                {formatCurrency(order.total_amount)}
                              </TableCell>
                              <TableCell>
                                {formatDate(order.created_at)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">
                                  {order.payment_status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Showing{" "}
                      <span className="font-medium text-foreground">
                        {ordersStartIndex}-{ordersEndIndex}
                      </span>{" "}
                      of {totalOrdersCount}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOrdersPrevious}
                        disabled={ordersPage === 0}
                      >
                        Previous
                      </Button>
                      <span className="text-xs text-muted-foreground sm:text-sm">
                        Page {ordersPage + 1} of {totalOrderPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleOrdersNext}
                        disabled={ordersPage >= totalOrderPages - 1}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {lastUpdated && (
            <p className="text-right text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Analytics data is not available right now.
          </CardContent>
        </Card>
      )}
    </section>
  );
}
