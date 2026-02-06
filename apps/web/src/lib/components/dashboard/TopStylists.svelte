<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { ArrowUpRight } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";

  interface Props {
    contextLabel?: string;
    items?: Array<{
      id: string;
      name: string;
      revenue: number;
      revenuePercent: number;
      appointments: number;
      avatar: string;
    }>;
    loading?: boolean;
  }

  let { contextLabel = "Tháng này", items = [], loading = false }: Props = $props();

  function formatCurrency(value: number) {
    return value.toLocaleString("vi-VN") + " ₫";
  }
</script>

<Card class="border border-border/60 shadow-sm rounded-xl bg-white overflow-hidden">
  <CardHeader
    class="flex flex-row items-center justify-between pb-3 border-b border-border/30 space-y-0 bg-gray-50/30"
  >
    <div>
      <CardTitle class="text-sm font-semibold text-foreground tracking-tight">
        Top doanh thu
      </CardTitle>
      <p class="text-[11px] text-muted-foreground mt-1">
        {contextLabel} · Xếp hạng theo doanh thu
      </p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 -mr-2 text-primary hover:bg-primary/5 hover:text-primary"
    >
      <ArrowUpRight class="h-4 w-4" />
    </Button>
  </CardHeader>
  <CardContent class="p-0">
    {#if loading}
      {#each Array(4).fill(0) as _}
        <div class="flex items-center gap-3 px-5 py-4 border-b border-border/30 last:border-0">
          <div class="h-4 w-4 bg-muted/40 rounded animate-pulse"></div>
          <div class="h-9 w-9 bg-muted/40 rounded-full animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-28 bg-muted/40 rounded animate-pulse"></div>
            <div class="h-2 w-24 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div class="h-4 w-16 bg-muted/40 rounded animate-pulse"></div>
        </div>
      {/each}
    {:else if items.length === 0}
      <div class="px-6 py-8 text-center text-sm text-muted-foreground">
        Chưa có dữ liệu doanh thu.
      </div>
    {:else}
      {#each items as stylist, index}
        <div
          class="flex items-center gap-3 px-5 py-4 hover:bg-purple-50/30 transition-colors border-b border-border/30 last:border-0 group"
        >
          <div
            class="text-sm font-semibold text-muted-foreground w-4 text-center group-hover:text-primary transition-colors"
          >
            {index + 1}
          </div>

          <!-- Avatar with soft ring -->
          <div
            class="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center text-xs font-bold text-primary ring-2 ring-white shadow-sm"
          >
            {stylist.avatar}
          </div>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-foreground truncate">
              {stylist.name}
            </p>
            <div class="flex items-center gap-2 mt-1">
              <!-- Progress Bar -->
              <div class="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-[120px]">
                <div
                  class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  style="width: {stylist.revenuePercent}%"
                ></div>
              </div>
              <span class="text-[10px] text-muted-foreground">{stylist.appointments} lượt</span>
            </div>
          </div>

          <div class="text-sm font-bold text-foreground tabular-nums">
            {formatCurrency(stylist.revenue)}
          </div>
        </div>
      {/each}
    {/if}
    <div class="p-2 bg-gray-50/30 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        class="w-full text-xs font-medium text-muted-foreground hover:text-primary h-8"
        >Xem tất cả</Button
      >
    </div>
  </CardContent>
</Card>
