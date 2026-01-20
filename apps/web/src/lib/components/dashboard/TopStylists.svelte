<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { TrendingUp, ArrowUpRight } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";

    const stylists = [
        {
            id: 1,
            name: "Trần Văn B",
            revenue: "4.250.000đ",
            revenuePercent: 100,
            appointments: 28,
            avatar: "TB",
        },
        {
            id: 2,
            name: "Lê Thị D",
            revenue: "3.800.000đ",
            revenuePercent: 89,
            appointments: 24,
            avatar: "LD",
        },
        {
            id: 3,
            name: "Nguyễn Văn G",
            revenue: "3.200.000đ",
            revenuePercent: 75,
            appointments: 21,
            avatar: "NG",
        },
        {
            id: 4,
            name: "Phạm Thị H",
            revenue: "2.900.000đ",
            revenuePercent: 68,
            appointments: 19,
            avatar: "PH",
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
            Top doanh thu
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
        {#each stylists as stylist, index}
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
                        <!-- Elegant Progress Bar -->
                        <div
                            class="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden max-w-[100px]"
                        >
                            <div
                                class="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                                style="width: {stylist.revenuePercent}%"
                            ></div>
                        </div>
                        <span class="text-[10px] text-muted-foreground"
                            >{stylist.appointments} lượt</span
                        >
                    </div>
                </div>

                <div class="text-sm font-bold text-foreground tabular-nums">
                    {stylist.revenue}
                </div>
            </div>
        {/each}
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
