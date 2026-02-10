<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
import { cn } from "$lib/utils";
import { CalendarRange } from "@lucide/svelte";

interface Props {
  contextLabel?: string;
  items?: Array<{
    id: number | string;
    time: string;
    customer: string;
    service: string;
    staff: string;
    status: string;
  }>;
  loading?: boolean;
}

let { contextLabel = "Hôm nay", items = [], loading = false }: Props = $props();

const statusLabel: Record<string, string> = {
  confirmed: "Đã xác nhận",
  pending: "Chờ xác nhận",
};

const statusBadge: Record<string, string> = {
  confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};
</script>

<Card
  class="premium-card h-full border border-border/60 shadow-sm rounded-xl bg-white overflow-hidden"
>
  <CardHeader
    class="flex flex-row items-center justify-between pb-3 border-b border-border/30 space-y-0 bg-gray-50/30"
  >
    <div>
      <CardTitle class="text-sm font-semibold text-foreground tracking-tight">
        Lịch hôm nay
      </CardTitle>
      <p class="text-[11px] text-muted-foreground mt-1">
        {contextLabel} · {items.length} lịch
      </p>
    </div>
    <Button
      variant="ghost"
      size="icon"
      class="h-8 w-8 -mr-2 text-primary hover:bg-primary/5 hover:text-primary"
    >
      <CalendarRange class="h-4 w-4" />
    </Button>
  </CardHeader>
  <CardContent class="p-0">
    {#if loading}
      {#each Array(4).fill(0) as _}
        <div class="flex items-center gap-4 px-5 py-4 border-b border-border/30 last:border-0">
          <div class="h-6 w-12 bg-muted/50 rounded animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-32 bg-muted/50 rounded animate-pulse"></div>
            <div class="h-3 w-24 bg-muted/40 rounded animate-pulse"></div>
          </div>
          <div class="h-5 w-16 bg-muted/40 rounded-full animate-pulse hidden sm:block"></div>
        </div>
      {/each}
    {:else if items.length === 0}
      <div class="px-6 py-8 text-center text-sm text-muted-foreground">
        Chưa có lịch hẹn trong ngày.
      </div>
    {:else}
      {#each items as appointment, index}
        <div
          class={cn(
            "flex items-center gap-4 px-5 py-4 hover:bg-purple-50/30 transition-colors border-b border-border/30 last:border-0 group",
          )}
        >
          <!-- Time Badge -->
          <div
            class="px-2 py-1 rounded-md bg-gray-100 text-xs font-bold text-gray-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
          >
            {appointment.time}
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors"
            >
              {appointment.customer}
            </p>
            <p class="text-xs text-muted-foreground truncate">
              {appointment.service}
            </p>
          </div>

          <!-- Staff -->
          <div
            class="text-xs font-medium text-muted-foreground hidden sm:block bg-gray-50 px-2 py-1 rounded-full border border-gray-200"
          >
            {appointment.staff}
          </div>

          <div
            class={cn(
              "text-[10px] font-semibold px-2 py-1 rounded-full border",
              statusBadge[appointment.status],
            )}
          >
            {statusLabel[appointment.status]}
          </div>

          <Button variant="ghost" size="sm" class="text-xs h-7 px-2">
            {appointment.status === "pending" ? "Check-in" : "Chi tiết"}
          </Button>
        </div>
      {/each}
    {/if}
    <div class="p-2 bg-gray-50/30 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        class="w-full text-xs font-medium text-muted-foreground hover:text-primary h-8"
        >Xem lịch</Button
      >
    </div>
  </CardContent>
</Card>
