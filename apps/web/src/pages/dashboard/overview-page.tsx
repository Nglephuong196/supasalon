import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-client";
import { cn } from "@/lib/utils";
import { type DashboardData, type RangeKey, dashboardService } from "@/services/dashboard.service";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  CalendarDays,
  CalendarRange,
  DollarSign,
  Plus,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const emptyDashboard: DashboardData = {
  range: "week",
  chart: {
    labels: [],
    data: [],
    unit: "₫",
    title: "Doanh thu",
    context: "",
    compare: "",
  },
  stats: {
    revenue: 0,
    appointments: 0,
    newCustomers: 0,
    avgInvoice: 0,
    trend: {
      revenue: 0,
      appointments: 0,
      newCustomers: 0,
      avgInvoice: 0,
    },
  },
  schedule: [],
  topStylists: [],
  lowStock: [],
};

function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN");
}

function StatCard(props: {
  title: string;
  value: string;
  description: string;
  context?: string;
  loading: boolean;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}) {
  const Icon = props.icon;
  return (
    <Card className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          {typeof props.trend === "number" ? (
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold",
                props.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600",
              )}
            >
              {props.trend >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {props.trend}%
            </div>
          ) : null}
        </div>

        {props.loading ? (
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted/50" />
            <div className="h-7 w-28 animate-pulse rounded bg-muted/60" />
            <div className="h-3 w-32 animate-pulse rounded bg-muted/40" />
          </div>
        ) : (
          <div className="space-y-1">
            {props.context ? (
              <span className="block text-[10px] uppercase tracking-wide text-muted-foreground">
                {props.context}
              </span>
            ) : null}
            <span className="block text-sm font-medium text-muted-foreground">{props.title}</span>
            <span className="block text-2xl font-bold tracking-tight text-foreground">
              {props.value}
            </span>
            <span className="block text-xs text-muted-foreground">{props.description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function OverviewPage() {
  const [range, setRange] = useState<RangeKey>("week");

  useEffect(() => {
    document.title = "Tổng quan | SupaSalon";
  }, []);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboardOverview(range),
    queryFn: () => dashboardService.getOverview(range),
  });

  const loading = overviewQuery.isLoading;
  const error = overviewQuery.error instanceof Error ? overviewQuery.error.message : null;
  const data: DashboardData = overviewQuery.data ?? {
    ...emptyDashboard,
    range,
  };

  const now = useMemo(() => new Date(), [loading]);
  const formattedDate = now.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const lastUpdated = now.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const chartData = data.chart?.data ?? [];
  const chartLabels = data.chart?.labels ?? [];
  const chartMax = Math.max(...(chartData.length ? chartData : [1]));
  const placeholderBars = Array(Math.max(chartLabels.length, 7)).fill(0);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-linear-to-br from-white/95 via-white/90 to-secondary/40 p-5 shadow-[0_24px_45px_-36px_rgba(70,39,161,0.55)] sm:p-6">
        <div className="pointer-events-none absolute -top-14 -right-16 h-40 w-40 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-2 -left-10 h-24 w-24 rounded-full bg-indigo-300/30 blur-2xl" />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
            <p className="mt-1 text-muted-foreground">Hiệu suất salon của bạn trong nháy mắt.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg border border-border/80 bg-white/90 px-3 py-1.5 text-sm font-medium text-muted-foreground shadow-[0_8px_18px_-16px_rgba(40,23,86,0.85)] sm:block">
              {formattedDate}
            </span>
            <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex">
              <span className="rounded-full border border-border bg-white/80 px-2 py-1">
                Dữ liệu: {data.chart.context || "-"}
              </span>
              <span>Cập nhật lúc {lastUpdated}</span>
            </div>
            <Button className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" />
              Đặt lịch mới
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-white px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {(["today", "week", "month", "year"] as const).map((item) => (
            <Button
              key={item}
              variant="ghost"
              className={cn(
                "h-auto rounded-full border px-3 py-1.5 text-xs font-medium",
                range === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setRange(item)}
            >
              {item === "today"
                ? "Hôm nay"
                : item === "week"
                  ? "7 ngày"
                  : item === "month"
                    ? "Tháng"
                    : "Năm"}
            </Button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">
          So sánh: <span className="font-medium text-foreground">{data.chart.compare || "-"}</span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Tổng doanh thu"
          value={`${formatCurrency(data.stats.revenue)} ₫`}
          description={data.chart.compare || "-"}
          context={data.chart.context}
          loading={loading}
          icon={DollarSign}
          trend={data.stats.trend.revenue}
        />
        <StatCard
          title="Cuộc hẹn"
          value={`${data.stats.appointments}`}
          description={data.chart.compare || "-"}
          context={data.chart.context}
          loading={loading}
          icon={CalendarDays}
          trend={data.stats.trend.appointments}
        />
        <StatCard
          title="Khách hàng mới"
          value={`${data.stats.newCustomers}`}
          description={data.chart.compare || "-"}
          context={data.chart.context}
          loading={loading}
          icon={Users}
          trend={data.stats.trend.newCustomers}
        />
        <StatCard
          title="Hóa đơn trung bình"
          value={`${formatCurrency(data.stats.avgInvoice)} ₫`}
          description={data.chart.compare || "-"}
          context={data.chart.context}
          loading={loading}
          icon={TrendingUp}
          trend={data.stats.trend.avgInvoice}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="h-full rounded-lg border border-border bg-card shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm font-semibold text-foreground">
                    {data.chart.title || "Doanh thu"}{" "}
                    {data.chart.context ? `· ${data.chart.context}` : ""}
                  </h3>
                </div>
                <div className="flex gap-1 rounded-lg bg-muted/50 p-1">
                  <Button
                    variant="ghost"
                    className="h-auto rounded-md bg-background px-3 py-1 text-xs font-medium text-foreground shadow-sm hover:bg-background"
                  >
                    {range === "today"
                      ? "Hôm nay"
                      : range === "week"
                        ? "7 ngày"
                        : range === "month"
                          ? "Tháng"
                          : "Năm"}
                  </Button>
                  <span className="px-2 py-1 text-[11px] text-muted-foreground">
                    Đơn vị: {data.chart.unit || "₫"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-[42px_1fr] gap-3">
                <div className="flex flex-col justify-between text-[10px] text-muted-foreground">
                  <span>
                    {formatCurrency(chartMax)} {data.chart.unit || "₫"}
                  </span>
                  <span>
                    {formatCurrency(Math.round(chartMax * 0.75))} {data.chart.unit || "₫"}
                  </span>
                  <span>
                    {formatCurrency(Math.round(chartMax * 0.5))} {data.chart.unit || "₫"}
                  </span>
                  <span>
                    {formatCurrency(Math.round(chartMax * 0.25))} {data.chart.unit || "₫"}
                  </span>
                  <span>0</span>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex h-64 items-end justify-between gap-2 px-2 pb-4">
                    {(loading ? placeholderBars : chartData).map((value, index) => (
                      <div
                        key={`${index}-${value}`}
                        className={cn(
                          "w-full rounded-t-sm",
                          loading
                            ? "h-[40%] animate-pulse bg-muted/50"
                            : "group relative bg-linear-to-t from-primary/85 via-primary/65 to-indigo-300/70 transition-all hover:brightness-110",
                        )}
                        style={
                          loading
                            ? undefined
                            : {
                                height: `${Math.max(6, Math.round((value / chartMax) * 100))}%`,
                              }
                        }
                      >
                        {!loading ? (
                          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 rounded border border-border bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                            {formatCurrency(value)} {data.chart.unit || "₫"}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between border-t border-border/40 px-2 pt-2 text-xs font-medium text-muted-foreground">
                    {(loading ? placeholderBars : chartLabels).map((label, index) =>
                      loading ? (
                        <span
                          key={index}
                          className="inline-block h-3 w-6 animate-pulse rounded bg-muted/40"
                        />
                      ) : (
                        <span key={`${label}-${index}`}>{label}</span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-full overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
          <CardHeader className="space-y-0 border-b border-border/30 bg-gray-50/30 pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Lịch hôm nay
                </CardTitle>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {data.chart.context || "Hôm nay"} · {data.schedule.length} lịch
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mr-2 h-8 w-8 text-primary hover:bg-primary/5 hover:text-primary"
              >
                <CalendarRange className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 border-b border-border/30 px-5 py-4 last:border-0"
                >
                  <div className="h-6 w-12 animate-pulse rounded bg-muted/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted/50" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
                  </div>
                </div>
              ))
            ) : data.schedule.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Chưa có lịch hẹn trong ngày.
              </div>
            ) : (
              data.schedule.map((appointment) => (
                <div
                  key={appointment.id}
                  className="group flex items-center gap-4 border-b border-border/30 px-5 py-4 transition-colors last:border-0 hover:bg-purple-50/30"
                >
                  <div className="rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                    {appointment.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {appointment.customer}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{appointment.service}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
          <CardHeader className="border-b border-border/30 bg-gray-50/30 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Top doanh thu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b border-border/30 px-5 py-4 last:border-0"
                >
                  <div className="h-4 w-4 animate-pulse rounded bg-muted/40" />
                  <div className="h-9 w-9 animate-pulse rounded-full bg-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-28 animate-pulse rounded bg-muted/40" />
                    <div className="h-2 w-24 animate-pulse rounded bg-muted/30" />
                  </div>
                </div>
              ))
            ) : data.topStylists.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Chưa có dữ liệu doanh thu.
              </div>
            ) : (
              data.topStylists.map((stylist, index) => (
                <div
                  key={stylist.id}
                  className="group flex items-center gap-3 border-b border-border/30 px-5 py-4 transition-colors last:border-0 hover:bg-purple-50/30"
                >
                  <div className="w-4 text-center text-sm font-semibold text-muted-foreground transition-colors group-hover:text-primary">
                    {index + 1}
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-50 text-xs font-bold text-primary ring-2 ring-white shadow-sm">
                    {stylist.avatar}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{stylist.name}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 max-w-[120px] flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-purple-500 to-indigo-500"
                          style={{ width: `${stylist.revenuePercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {stylist.appointments} lượt
                      </span>
                    </div>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-foreground">
                    {formatCurrency(stylist.revenue)} ₫
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-xl border border-border/60 bg-white shadow-sm">
          <CardHeader className="border-b border-border/30 bg-gray-50/30 pb-3">
            <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
              Sắp hết hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 border-b border-border/30 px-5 py-4 last:border-0"
                >
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-muted/40" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted/40" />
                    <div className="h-3 w-24 animate-pulse rounded bg-muted/30" />
                  </div>
                </div>
              ))
            ) : data.lowStock.length === 0 ? (
              <div className="px-6 py-8 text-center text-sm text-muted-foreground">
                Tồn kho ổn định, không có cảnh báo.
              </div>
            ) : (
              data.lowStock.map((product) => (
                <div
                  key={product.id}
                  className="group flex items-center gap-3 border-b border-border/30 px-5 py-4 transition-colors last:border-0 hover:bg-purple-50/30"
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm",
                      product.status === "critical"
                        ? "border-rose-100 bg-rose-50 text-rose-600"
                        : "border-amber-100 bg-amber-50 text-amber-600",
                    )}
                  >
                    {product.status === "critical" ? "!" : "◌"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tối thiểu:{" "}
                      <span className="font-medium text-foreground">{product.minStock}</span>
                    </p>
                  </div>
                  <div
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-bold shadow-sm",
                      product.status === "critical"
                        ? "border-rose-200 bg-rose-50 text-rose-700"
                        : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {product.stock} còn lại
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
