<script lang="ts">
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import {
        CalendarDays,
        Users,
        DollarSign,
        TrendingUp,
        Plus,
        BarChart3,
    } from "@lucide/svelte";
    import StatsCard from "$lib/components/dashboard/StatsCard.svelte";
    import TodaySchedule from "$lib/components/dashboard/TodaySchedule.svelte";
    import TopStylists from "$lib/components/dashboard/TopStylists.svelte";
    import LowStockAlerts from "$lib/components/dashboard/LowStockAlerts.svelte";

    let formattedDate = $state("");

    $effect(() => {
        const today = new Date();
        formattedDate = today.toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });
    });
</script>

<svelte:head>
    <title>Overview | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6 max-w-[1600px] mx-auto w-full">
    <!-- Header Section -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
                Overview
            </h1>
            <p class="text-muted-foreground mt-1">
                Your salon's performance at a glance.
            </p>
        </div>
        <div class="flex items-center gap-3">
            <span
                class="text-sm font-medium text-muted-foreground hidden sm:block border border-border px-3 py-1.5 rounded-md bg-white"
            >
                {formattedDate}
            </span>
            <Button class="btn-clean shadow-sm">
                <Plus class="h-4 w-4 mr-2" />
                New Booking
            </Button>
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
            title="Total Revenue"
            value="$12,450"
            description="vs last month"
            icon={DollarSign}
            trend="up"
            trendValue="+12%"
        />
        <StatsCard
            title="Appointments"
            value="45"
            description="vs yesterday"
            icon={CalendarDays}
            trend="up"
            trendValue="+5%"
        />
        <StatsCard
            title="New Customers"
            value="8"
            description="vs last week"
            icon={Users}
            trend="up"
            trendValue="+2%"
        />
        <StatsCard
            title="Avg. Ticket"
            value="$85"
            description="vs last month"
            icon={TrendingUp}
            trend="up"
            trendValue="+1.5%"
        />
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 lg:grid-cols-3">
        <!-- Revenue Chart Placeholder - Takes 2 columns -->
        <div class="lg:col-span-2">
            <Card
                class="h-full border border-border shadow-sm rounded-lg bg-card"
            >
                <CardContent class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-2">
                            <BarChart3 class="h-4 w-4 text-muted-foreground" />
                            <h3 class="text-sm font-semibold text-foreground">
                                Revenue Trends
                            </h3>
                        </div>
                        <div class="flex gap-1 p-1 bg-muted/50 rounded-lg">
                            <button
                                class="text-xs px-3 py-1 rounded-md bg-background shadow-sm text-foreground font-medium transition-all"
                                >Week</button
                            >
                            <button
                                class="text-xs px-3 py-1 rounded-md hover:bg-background/50 text-muted-foreground font-medium transition-all"
                                >Month</button
                            >
                            <button
                                class="text-xs px-3 py-1 rounded-md hover:bg-background/50 text-muted-foreground font-medium transition-all"
                                >Year</button
                            >
                        </div>
                    </div>

                    <!-- Clean Minimalist Chart Placeholder -->
                    <div
                        class="h-64 flex items-end justify-between gap-2 px-2 pb-4"
                    >
                        {#each [40, 65, 45, 80, 55, 90, 75] as height}
                            <div
                                class="w-full bg-secondary hover:bg-primary/80 transition-colors rounded-t-sm relative group"
                                style="height: {height}%"
                            >
                                <div
                                    class="absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs py-1 px-2 rounded shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border border-border pointer-events-none"
                                >
                                    ${height * 10}
                                </div>
                            </div>
                        {/each}
                    </div>
                    <div
                        class="flex justify-between px-2 pt-2 border-t border-border/40 text-xs text-muted-foreground font-medium"
                    >
                        <span>Mon</span><span>Tue</span><span>Wed</span><span
                            >Thu</span
                        ><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- Today's Schedule - Takes 1 column -->
        <div class="lg:col-span-1">
            <TodaySchedule />
        </div>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-6 md:grid-cols-2">
        <TopStylists />
        <LowStockAlerts />
    </div>
</div>
