<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Clock, ArrowUpRight, CalendarRange } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";

    // Mock data for today's schedule
    const appointments = [
        {
            id: 1,
            time: "09:00",
            customer: "Nguyễn Văn A",
            service: "Cắt tóc nam",
            staff: "Trần B",
            status: "confirmed",
        },
        {
            id: 2,
            time: "09:30",
            customer: "Trần Thị C",
            service: "Gội đầu massage",
            staff: "Lê D",
            status: "confirmed",
        },
        {
            id: 3,
            time: "10:00",
            customer: "Lê Văn E",
            service: "Nhuộm tóc",
            staff: "Trần B",
            status: "pending",
        },
        {
            id: 4,
            time: "10:30",
            customer: "Phạm Thị F",
            service: "Cắt tóc nữ",
            staff: "Nguyễn G",
            status: "confirmed",
        },
        {
            id: 5,
            time: "11:00",
            customer: "Hoàng Văn H",
            service: "Uốn tóc",
            staff: "Lê D",
            status: "confirmed",
        },
    ];
</script>

<Card
    class="h-full border border-border/60 shadow-sm rounded-xl bg-white overflow-hidden"
>
    <CardHeader
        class="flex flex-row items-center justify-between pb-3 border-b border-border/30 space-y-0 bg-gray-50/30"
    >
        <CardTitle class="text-sm font-semibold text-foreground tracking-tight">
            Lịch hôm nay
        </CardTitle>
        <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 -mr-2 text-primary hover:bg-primary/5 hover:text-primary"
        >
            <CalendarRange class="h-4 w-4" />
        </Button>
    </CardHeader>
    <CardContent class="p-0">
        {#each appointments as appointment, index}
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

                <!-- Status indicator -->
                <div
                    class={cn(
                        "h-2 w-2 rounded-full ring-2 ring-white shadow-sm",
                        appointment.status === "confirmed"
                            ? "bg-emerald-500"
                            : "bg-amber-500",
                    )}
                ></div>
            </div>
        {/each}
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
