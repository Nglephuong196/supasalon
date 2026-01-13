<script lang="ts">
    import { Card, CardContent } from "$lib/components/ui/card";
    import { cn } from "$lib/utils";
    import type { Component } from "svelte";
    import { TrendingUp, TrendingDown } from "@lucide/svelte";

    interface Props {
        title: string;
        value: string;
        description: string;
        icon: Component<{ class?: string }>;
        trend?: "up" | "down";
        trendValue?: string;
        iconBgColor?: string;
        iconColor?: string;
    }

    let {
        title,
        value,
        description,
        icon: Icon,
        trend,
        trendValue,
        iconBgColor = "bg-primary/10" /* Lavender tint */,
        iconColor = "text-primary" /* Deep Purple */,
    }: Props = $props();
</script>

<Card
    class="card-hover border border-border/60 shadow-sm bg-white hover:bg-white transition-all rounded-xl overflow-hidden"
>
    <CardContent class="p-5">
        <div class="flex items-start justify-between mb-4">
            <div class="p-2.5 rounded-xl {iconBgColor} {iconColor}">
                <Icon class="h-5 w-5" />
            </div>
            {#if trend && trendValue}
                <div
                    class={cn(
                        "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full",
                        trend === "up" && "bg-emerald-50 text-emerald-600",
                        trend === "down" && "bg-rose-50 text-rose-600",
                    )}
                >
                    {#if trend === "up"}
                        <TrendingUp class="h-3 w-3" />
                    {:else}
                        <TrendingDown class="h-3 w-3" />
                    {/if}
                    {trendValue}
                </div>
            {/if}
        </div>

        <div class="space-y-1">
            <span class="text-sm font-medium text-muted-foreground block"
                >{title}</span
            >
            <span
                class="text-2xl font-bold tracking-tight text-foreground block"
                >{value}</span
            >
            <span class="text-xs text-muted-foreground block"
                >{description}</span
            >
        </div>
    </CardContent>
</Card>
