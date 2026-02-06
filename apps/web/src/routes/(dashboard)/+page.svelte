<script lang="ts">
  import { Card, CardContent } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { CalendarDays, Users, DollarSign, TrendingUp, Plus, BarChart3 } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import StatsCard from "$lib/components/dashboard/StatsCard.svelte";
  import TodaySchedule from "$lib/components/dashboard/TodaySchedule.svelte";
  import TopStylists from "$lib/components/dashboard/TopStylists.svelte";
  import LowStockAlerts from "$lib/components/dashboard/LowStockAlerts.svelte";
  import { goto } from "$app/navigation";
  import { page, navigating } from "$app/stores";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let formattedDate = $state("");
  let lastUpdated = $state("");
  type RangeKey = "today" | "week" | "month" | "year";
  let selectedRange = $state<RangeKey>("week");

  $effect(() => {
    selectedRange = data.range || "week";
    const today = new Date();
    formattedDate = today.toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    lastUpdated = today.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  });

  let chartData = $derived(data.chart?.data || []);
  let chartLabels = $derived(data.chart?.labels || []);
  let chartMax = $derived(Math.max(...((data.chart?.data || [1]) as number[])));
  let chartTitle = $derived(data.chart?.title || "Doanh thu");
  let chartUnit = $derived(data.chart?.unit || "₫");
  let chartContext = $derived(data.chart?.context || "");
  let chartCompare = $derived(data.chart?.compare || "");
  let isLoading = $derived(!!$navigating);
  let placeholderBars = $derived(Array(Math.max(chartLabels.length, 7)).fill(0));

  function formatCurrency(value: number) {
    return value.toLocaleString("vi-VN");
  }

  function setRange(range: RangeKey) {
    selectedRange = range;
    const params = new URLSearchParams($page.url.searchParams);
    params.set("range", range);
    goto(`${$page.url.pathname}?${params.toString()}`);
  }
</script>

<svelte:head>
  <title>Tổng quan | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
  <!-- Header Section -->
  <div
    class="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-white/95 via-white/90 to-secondary/40 p-5 sm:p-6 shadow-[0_24px_45px_-36px_rgba(70,39,161,0.55)]"
  >
    <div
      class="pointer-events-none absolute -right-16 -top-14 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
    ></div>
    <div
      class="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-indigo-300/30 blur-2xl"
    ></div>
    <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-foreground">Tổng quan</h1>
        <p class="text-muted-foreground mt-1">Hiệu suất salon của bạn trong nháy mắt.</p>
      </div>
      <div class="flex items-center gap-3">
        <span
          class="text-sm font-medium text-muted-foreground hidden sm:block border border-border/80 px-3 py-1.5 rounded-lg bg-white/90 shadow-[0_8px_18px_-16px_rgba(40,23,86,0.85)]"
        >
          {formattedDate}
        </span>
        <div class="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
          <span class="px-2 py-1 rounded-full border border-border bg-white/80">
            Dữ liệu: {chartContext}
          </span>
          <span>Cập nhật lúc {lastUpdated}</span>
        </div>
        <Button class="btn-gradient shadow-sm">
          <Plus class="h-4 w-4 mr-2" />
          Đặt lịch mới
        </Button>
      </div>
    </div>
  </div>

  <!-- Range Filter -->
  <div
    class="premium-card flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl px-4 py-3 shadow-sm"
  >
    <div class="flex items-center gap-2 flex-wrap">
      {#each ["today", "week", "month", "year"] as RangeKey[] as range}
        <Button
          variant="ghost"
          class={cn(
            "text-xs px-3 py-1.5 rounded-full font-medium h-auto border",
            selectedRange === range
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-muted-foreground border-border hover:text-foreground",
          )}
          onclick={() => setRange(range)}
        >
          {range === "today"
            ? "Hôm nay"
            : range === "week"
              ? "7 ngày"
              : range === "month"
                ? "Tháng"
                : "Năm"}
        </Button>
      {/each}
    </div>
    <div class="text-xs text-muted-foreground">
      So sánh: <span class="font-medium text-foreground">{chartCompare}</span>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <StatsCard
      title="Tổng doanh thu"
      value={`${formatCurrency(data.stats?.revenue || 0)} ₫`}
      description={chartCompare}
      context={chartContext}
      icon={DollarSign}
      trend={data.stats?.trend?.revenue >= 0 ? "up" : "down"}
      trendValue={`${data.stats?.trend?.revenue ?? 0}%`}
      loading={isLoading}
    />
    <StatsCard
      title="Cuộc hẹn"
      value={`${data.stats?.appointments || 0}`}
      description={chartCompare}
      context={chartContext}
      icon={CalendarDays}
      trend={data.stats?.trend?.appointments >= 0 ? "up" : "down"}
      trendValue={`${data.stats?.trend?.appointments ?? 0}%`}
      loading={isLoading}
    />
    <StatsCard
      title="Khách hàng mới"
      value={`${data.stats?.newCustomers || 0}`}
      description={chartCompare}
      context={chartContext}
      icon={Users}
      trend={data.stats?.trend?.newCustomers >= 0 ? "up" : "down"}
      trendValue={`${data.stats?.trend?.newCustomers ?? 0}%`}
      loading={isLoading}
    />
    <StatsCard
      title="Hóa đơn trung bình"
      value={`${formatCurrency(data.stats?.avgInvoice || 0)} ₫`}
      description={chartCompare}
      context={chartContext}
      icon={TrendingUp}
      trend={data.stats?.trend?.avgInvoice >= 0 ? "up" : "down"}
      trendValue={`${data.stats?.trend?.avgInvoice ?? 0}%`}
      loading={isLoading}
    />
  </div>

  <!-- Main Content Grid -->
  <div class="grid gap-6 lg:grid-cols-3">
    <!-- Revenue Chart Placeholder - Takes 2 columns -->
    <div class="lg:col-span-2">
      <Card class="premium-card h-full border border-border shadow-sm rounded-lg bg-card">
        <CardContent class="p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
              <BarChart3 class="h-4 w-4 text-muted-foreground" />
              <h3 class="text-sm font-semibold text-foreground">
                {chartTitle} · {chartContext}
              </h3>
            </div>
            <div class="flex gap-1 p-1 bg-muted/50 rounded-lg">
              <Button
                variant="ghost"
                class="text-xs px-3 py-1 rounded-md bg-background shadow-sm text-foreground font-medium h-auto hover:bg-background"
                >{selectedRange === "today"
                  ? "Hôm nay"
                  : selectedRange === "week"
                    ? "7 ngày"
                    : selectedRange === "month"
                      ? "Tháng"
                      : "Năm"}</Button
              >
              <span class="text-[11px] text-muted-foreground px-2 py-1">
                Đơn vị: {chartUnit}
              </span>
            </div>
          </div>

          <!-- Chart -->
          <div class="grid grid-cols-[42px_1fr] gap-3">
            <div class="flex flex-col justify-between text-[10px] text-muted-foreground">
              <span>{formatCurrency(chartMax)} {chartUnit}</span>
              <span>{formatCurrency(Math.round(chartMax * 0.75))} {chartUnit}</span>
              <span>{formatCurrency(Math.round(chartMax * 0.5))} {chartUnit}</span>
              <span>{formatCurrency(Math.round(chartMax * 0.25))} {chartUnit}</span>
              <span>0</span>
            </div>
            <div class="flex flex-col gap-2">
              <div class="h-64 flex items-end justify-between gap-2 px-2 pb-4">
                {#if isLoading}
                  {#each placeholderBars as _}
                    <div class="w-full bg-muted/50 rounded-t-sm animate-pulse h-[40%]"></div>
                  {/each}
                {:else}
                  {#each chartData as value}
                    <div
                      class="w-full bg-gradient-to-t from-primary/85 via-primary/65 to-indigo-300/70 hover:brightness-110 transition-all rounded-t-sm relative group"
                      style="height: {Math.max(6, Math.round((value / chartMax) * 100))}%"
                    >
                      <div
                        class="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-border pointer-events-none"
                      >
                        {formatCurrency(value)}
                        {chartUnit}
                      </div>
                    </div>
                  {/each}
                {/if}
              </div>
              <div
                class="flex justify-between px-2 pt-2 border-t border-border/40 text-xs text-muted-foreground font-medium"
              >
                {#if isLoading}
                  {#each placeholderBars as _}
                    <span class="inline-block w-6 h-3 bg-muted/40 rounded animate-pulse"></span>
                  {/each}
                {:else}
                  {#each chartLabels as label}
                    <span>{label}</span>
                  {/each}
                {/if}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Today's Schedule - Takes 1 column -->
    <div class="lg:col-span-1">
      <TodaySchedule contextLabel={chartContext} items={data.schedule} loading={isLoading} />
    </div>
  </div>

  <!-- Bottom Section -->
  <div class="grid gap-6 md:grid-cols-2">
    <TopStylists contextLabel={chartContext} items={data.topStylists} loading={isLoading} />
    <LowStockAlerts items={data.lowStock} loading={isLoading} />
  </div>
</div>
