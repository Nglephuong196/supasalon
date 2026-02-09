<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { X, Sparkles, ShoppingBag, Percent } from "@lucide/svelte";

let {
  item = $bindable(),
  index,
  removeItem,
  compact = false,
}: {
  item: any;
  index: number;
  removeItem: (index: number) => void;
  compact?: boolean;
} = $props();

function calculateTotal() {
  const subtotal = (item.unitPrice || 0) * (item.quantity || 1);
  let discount = 0;
  if (item.discountType === "percent") {
    discount = subtotal * ((item.discountValue || 0) / 100);
  } else {
    discount = item.discountValue || 0;
  }
  item.total = Math.max(0, subtotal - discount);
}

if (item.total === undefined) calculateTotal();

function formatPrice(value: number) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}
</script>

<div
  class="group relative overflow-hidden transition-all hover:shadow-md {compact
    ? 'min-w-[760px] rounded-lg border border-border/70 bg-card'
    : item.type === 'service'
      ? 'rounded-xl border-l-4 border-l-primary bg-card shadow-sm'
      : 'rounded-xl border-l-4 border-l-emerald-500 bg-card shadow-sm'}"
>
  {#if compact}
    <div
      class="grid grid-cols-[minmax(180px,1fr)_110px_64px_170px_120px_34px] items-center gap-2 px-3 py-2.5"
    >
      <h4 class="truncate text-sm font-semibold">{item.name || "Mục mới"}</h4>

      <div class="relative">
        <Input
          type="number"
          class="h-8 pr-7 text-right text-sm font-medium"
          bind:value={item.unitPrice}
          oninput={calculateTotal}
        />
        <span class="absolute right-2.5 top-2 text-xs text-muted-foreground">đ</span>
      </div>

      <Input
        type="number"
        min="1"
        class="h-8 text-sm text-center font-medium"
        bind:value={item.quantity}
        oninput={calculateTotal}
      />

      <div
        class="flex items-center overflow-hidden rounded-lg border border-gray-200 bg-background"
      >
        <Input
          type="number"
          class="h-8 border-0 text-right text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
          bind:value={item.discountValue}
          oninput={calculateTotal}
        />
        <div class="flex border-l border-gray-200">
          <button
            type="button"
            class="h-8 w-8 flex items-center justify-center text-xs transition-colors {item.discountType ===
            'percent'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground'}"
            onclick={() => {
              item.discountType = "percent";
              calculateTotal();
            }}
          >
            <Percent class="h-3 w-3" />
          </button>
          <button
            type="button"
            class="h-8 w-8 flex items-center justify-center border-l border-gray-200 text-xs transition-colors {item.discountType ===
            'fixed'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground'}"
            onclick={() => {
              item.discountType = "fixed";
              calculateTotal();
            }}
          >
            đ
          </button>
        </div>
      </div>

      <div
        class="h-8 px-3 flex items-center justify-end rounded-lg font-bold text-sm {item.type ===
        'service'
          ? 'bg-primary/10 text-primary'
          : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'}"
      >
        {formatPrice(item.total)}đ
      </div>

      <Button
        variant="ghost"
        size="icon"
        class="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all group-hover:text-muted-foreground"
        onclick={() => removeItem(index)}
      >
        <X class="h-4 w-4" />
      </Button>
    </div>
  {:else}
    <!-- Header -->
    <div
      class="px-4 py-3 flex items-center justify-between gap-3 {item.type === 'service'
        ? 'bg-primary/5'
        : 'bg-emerald-50/50 dark:bg-emerald-950/20'}"
    >
      <div class="flex items-center gap-3 min-w-0">
        <div
          class="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center {item.type ===
          'service'
            ? 'bg-primary/10'
            : 'bg-emerald-100 dark:bg-emerald-900'}"
        >
          {#if item.type === "service"}
            <Sparkles class="h-4 w-4 text-primary" />
          {:else}
            <ShoppingBag class="h-4 w-4 text-emerald-600" />
          {/if}
        </div>
        <div class="min-w-0">
          <h4 class="font-semibold text-sm truncate">
            {item.name || "Dịch vụ mới"}
          </h4>
          <p class="text-xs text-muted-foreground">
            {item.type === "service" ? "Dịch vụ" : "Sản phẩm"}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 shrink-0 text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-all group-hover:text-muted-foreground"
        onclick={() => removeItem(index)}
      >
        <X class="h-4 w-4" />
      </Button>
    </div>

    <!-- Content -->
    <div class="p-4">
      <div class="grid grid-cols-12 gap-3 items-end">
        <!-- Unit Price -->
        <div class="col-span-4">
          <Label class="text-[10px] mb-1.5 block text-muted-foreground uppercase tracking-wide">
            Đơn giá
          </Label>
          <div class="relative">
            <Input
              type="number"
              class="h-9 pr-7 text-right text-sm font-medium"
              bind:value={item.unitPrice}
              oninput={calculateTotal}
            />
            <span class="absolute right-2.5 top-2.5 text-xs text-muted-foreground">đ</span>
          </div>
        </div>

        <!-- Quantity -->
        <div class="col-span-2">
          <Label class="text-[10px] mb-1.5 block text-muted-foreground uppercase tracking-wide">
            SL
          </Label>
          <Input
            type="number"
            min="1"
            class="h-9 text-sm text-center font-medium"
            bind:value={item.quantity}
            oninput={calculateTotal}
          />
        </div>

        <!-- Discount -->
        <div class="col-span-3">
          <Label class="text-[10px] mb-1.5 block text-muted-foreground uppercase tracking-wide">
            Giảm giá
          </Label>
          <div
            class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-background"
          >
            <Input
              type="number"
              class="h-9 border-0 text-right text-sm font-medium focus-visible:ring-0 focus-visible:ring-offset-0"
              bind:value={item.discountValue}
              oninput={calculateTotal}
            />
            <div class="flex border-l border-gray-200">
              <button
                type="button"
                class="h-9 w-8 flex items-center justify-center text-xs transition-colors {item.discountType ===
                'percent'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'}"
                onclick={() => {
                  item.discountType = "percent";
                  calculateTotal();
                }}
              >
                <Percent class="h-3 w-3" />
              </button>
              <button
                type="button"
                class="h-9 w-8 flex items-center justify-center text-xs border-l border-gray-200 transition-colors {item.discountType ===
                'fixed'
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'}"
                onclick={() => {
                  item.discountType = "fixed";
                  calculateTotal();
                }}
              >
                đ
              </button>
            </div>
          </div>
        </div>

        <!-- Total -->
        <div class="col-span-3">
          <Label class="text-[10px] mb-1.5 block text-muted-foreground uppercase tracking-wide">
            Thành tiền
          </Label>
          <div
            class="h-9 px-3 flex items-center justify-end rounded-lg font-bold text-sm {item.type ===
            'service'
              ? 'bg-primary/10 text-primary'
              : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'}"
          >
            {formatPrice(item.total)}đ
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>
