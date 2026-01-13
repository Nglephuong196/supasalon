<script lang="ts">
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        CalendarCheck,
        UserCheck,
        UserX,
        Plus,
        Search,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    let { data } = $props();

    const statusStyles: Record<string, string> = {
        confirmed: "bg-green-100 text-green-700",
        pending: "bg-yellow-100 text-yellow-700",
        completed: "bg-blue-100 text-blue-700",
        cancelled: "bg-red-100 text-red-700",
    };

    const statusLabels: Record<string, string> = {
        confirmed: "Đã xác nhận",
        pending: "Chờ xác nhận",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
    };

    function formatDate(dateStr: string) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    }

    function formatTime(dateStr: string) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }
</script>

<svelte:head>
    <title>Lịch hẹn | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
            <p class="text-muted-foreground">Quản lý lịch hẹn của khách hàng</p>
        </div>
        <Button class="bg-purple-600 hover:bg-purple-700">
            <Plus class="h-4 w-4 mr-2" />
            Đặt lịch mới
        </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <Card class="border border-gray-100 shadow-sm">
            <CardContent class="p-4">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >
                            Tổng lịch hẹn
                        </p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold"
                                >{data.bookings.length}</span
                            >
                            <span class="text-xs font-medium text-green-500"
                                >↑+12%</span
                            >
                        </div>
                    </div>
                    <div class="p-2.5 rounded-lg bg-purple-100">
                        <CalendarCheck class="h-5 w-5 text-purple-600" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card class="border border-gray-100 shadow-sm">
            <CardContent class="p-4">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >
                            Khách quay lại
                        </p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold">2</span>
                            <span class="text-xs font-medium text-green-500"
                                >↑+5%</span
                            >
                        </div>
                    </div>
                    <div class="p-2.5 rounded-lg bg-green-100">
                        <UserCheck class="h-5 w-5 text-green-600" />
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card class="border border-gray-100 shadow-sm">
            <CardContent class="p-4">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >
                            Tỷ lệ hủy
                        </p>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-bold">20%</span>
                            <span class="text-xs font-medium text-red-500"
                                >↓-2%</span
                            >
                        </div>
                    </div>
                    <div class="p-2.5 rounded-lg bg-orange-100">
                        <UserX class="h-5 w-5 text-orange-600" />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Search and Filter -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm khách hàng..."
                class="pl-9"
            />
        </div>
    </div>

    <!-- Bookings Table -->
    <Card>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b">
                    <tr>
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Khách hàng</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Dịch vụ</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Ngày</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Giờ</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Trạng thái</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each data.bookings as booking}
                        <tr class="hover:bg-muted/50">
                            <td class="px-4 py-3 text-sm font-medium"
                                >{booking.customer?.name || "N/A"}</td
                            >
                            <td class="px-4 py-3 text-sm"
                                >{booking.service?.name || "N/A"}</td
                            >
                            <td class="px-4 py-3 text-sm"
                                >{formatDate(booking.date)}</td
                            >
                            <td class="px-4 py-3 text-sm"
                                >{formatTime(booking.date)}</td
                            >
                            <td class="px-4 py-3">
                                <span
                                    class={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        statusStyles[
                                            booking.status.toLowerCase()
                                        ],
                                    )}
                                >
                                    {statusLabels[
                                        booking.status.toLowerCase()
                                    ] || booking.status}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </Card>
</div>
