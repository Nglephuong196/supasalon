<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { AlertCircle, ArrowUpRight, PackageOpen } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";

    const lowStockProducts = [
        {
            id: 1,
            name: "Loreal Shampoo",
            stock: 3,
            minStock: 10,
            status: "critical",
        },
        {
            id: 2,
            name: "Hair Dye #5",
            stock: 5,
            minStock: 15,
            status: "warning",
        },
        {
            id: 3,
            name: "Hairspray Extra",
            stock: 8,
            minStock: 20,
            status: "warning",
        },
        {
            id: 4,
            name: "Conditioner Repair",
            stock: 2,
            minStock: 10,
            status: "critical",
        },
    ];
</script>

<Card
    class="border border-border/60 shadow-sm rounded-xl bg-white overflow-hidden"
>
    <CardHeader
        class="flex flex-row items-center justify-between pb-3 border-b border-border/30 space-y-0 bg-gray-50/30"
    >
        <CardTitle class="text-sm font-semibold text-foreground tracking-tight">
            Sắp hết hàng
        </CardTitle>
        <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 -mr-2 text-primary hover:bg-primary/5 hover:text-primary"
        >
            <ArrowUpRight class="h-4 w-4" />
        </Button>
    </CardHeader>
    <CardContent class="p-0">
        {#each lowStockProducts as product}
            <div
                class="flex items-center gap-3 px-5 py-4 hover:bg-purple-50/30 transition-colors border-b border-border/30 last:border-0 group"
            >
                <div
                    class={cn(
                        "flex items-center justify-center h-9 w-9 rounded-xl transition-all shadow-sm",
                        product.status === "critical" &&
                            "text-rose-600 bg-rose-50 border border-rose-100",
                        product.status === "warning" &&
                            "text-amber-600 bg-amber-50 border border-amber-100",
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
                        Tối thiểu: <span class="font-medium text-foreground"
                            >{product.minStock}</span
                        >
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
            </div>
        {/each}
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
