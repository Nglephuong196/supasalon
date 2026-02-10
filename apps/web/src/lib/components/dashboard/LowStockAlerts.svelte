<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
import { cn } from "$lib/utils";
import { AlertCircle, ArrowUpRight, PackageOpen } from "@lucide/svelte";

interface Props {
  items?: Array<{
    id: number | string;
    name: string;
    stock: number;
    minStock: number;
    status: string;
  }>;
  loading?: boolean;
}

let { items = [], loading = false }: Props = $props();
</script>

<Card class="premium-card border border-border/60 shadow-sm rounded-xl bg-white overflow-hidden">
  <CardHeader
    class="flex flex-row items-center justify-between pb-3 border-b border-border/30 space-y-0 bg-gray-50/30"
  >
    <div>
      <CardTitle class="text-sm font-semibold text-foreground tracking-tight">
        Sắp hết hàng
      </CardTitle>
      <p class="text-[11px] text-muted-foreground mt-1">
        Ưu tiên nhập hàng cho sản phẩm dưới mức tối thiểu
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
          <div class="h-9 w-9 bg-muted/40 rounded-xl animate-pulse"></div>
          <div class="flex-1 space-y-2">
            <div class="h-3 w-32 bg-muted/40 rounded animate-pulse"></div>
            <div class="h-3 w-24 bg-muted/30 rounded animate-pulse"></div>
          </div>
          <div class="h-5 w-16 bg-muted/40 rounded-full animate-pulse"></div>
        </div>
      {/each}
    {:else if items.length === 0}
      <div class="px-6 py-8 text-center text-sm text-muted-foreground">
        Tồn kho ổn định, không có cảnh báo.
      </div>
    {:else}
      {#each items as product}
        <div
          class="flex items-center gap-3 px-5 py-4 hover:bg-purple-50/30 transition-colors border-b border-border/30 last:border-0 group"
        >
          <div
            class={cn(
              "flex items-center justify-center h-9 w-9 rounded-xl transition-all shadow-sm",
              product.status === "critical" && "text-rose-600 bg-rose-50 border border-rose-100",
              product.status === "warning" && "text-amber-600 bg-amber-50 border border-amber-100",
            )}
          >
            {#if product.status === "critical"}
              <AlertCircle class="h-4.5 w-4.5" />
            {:else}
              <PackageOpen class="h-4.5 w-4.5" />
            {/if}
          </div>

          <div class="flex-1 min-w-0">
            <p
              class="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors"
            >
              {product.name}
            </p>
            <p class="text-xs text-muted-foreground">
              Tối thiểu:
              <span class="font-medium text-foreground">
                {product.minStock}
              </span>
            </p>
          </div>

          <div
            class={cn(
              "text-xs font-bold px-3 py-1 rounded-full border shadow-sm",
              product.status === "critical"
                ? "bg-rose-50 text-rose-700 border-rose-200"
                : "bg-amber-50 text-amber-700 border-amber-200",
            )}
          >
            {product.stock} còn lại
          </div>

          <Button variant="ghost" size="sm" class="text-xs h-7 px-2">Nhập hàng</Button>
        </div>
      {/each}
    {/if}
    <div class="p-2 bg-gray-50/30 border-t border-border/30">
      <Button
        variant="ghost"
        size="sm"
        class="w-full text-xs font-medium text-muted-foreground hover:text-primary h-8"
        >Báo cáo kho</Button
      >
    </div>
  </CardContent>
</Card>
