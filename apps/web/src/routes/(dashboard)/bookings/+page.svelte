<script lang="ts">
    import { Card, CardContent } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import {
        CalendarCheck,
        Clock,
        UserCheck,
        UserX,
        Plus,
        Search,
        Calendar,
        Download,
        ChevronLeft,
        ChevronRight,
        MoreVertical,
        Pencil,
        Trash,
        Filter,
        Check,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { goto } from "$app/navigation";
    import { page } from "$app/stores";
    import { get } from "svelte/store";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import type { PageData } from "./$types";

    let { data }: { data: PageData } = $props();

    // Filter states
    let dateFilter = $state<"today" | "week" | "month" | "custom">("today");
    let fromDate = $state("");
    let toDate = $state("");
    let statusFilter = $state("all");
    let searchQuery = $state("");
    let currentPage = $state(1);
    let pageSize = $state(20);

    // Sync filter states from URL on data change
    $effect(() => {
        const filters = data.filters as any;
        if (filters) {
            fromDate = filters.from || "";
            toDate = filters.to || "";
            statusFilter = filters.status || "all";
            searchQuery = filters.search || "";
        }
        if (data.pagination) {
            currentPage = data.pagination.page || 1;
            pageSize = data.pagination.limit || 20;
        }
    });

    // Dialog states
    let isCreateOpen = $state(false);
    let isDeleteOpen = $state(false);
    let deletingBooking = $state<any>(null);

    // Form states for create
    let newBooking = $state({
        customerId: "",
        customerPhone: "",
        date: "",
        time: "",
        guestCount: "1",
        status: "confirmed",
        notes: "",
        services: [{ categoryId: "", serviceId: "", staffId: "" }],
    });

    const statusStyles: Record<string, string> = {
        confirmed: "bg-green-100 text-green-700 border-green-200",
        pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200",
        cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const statusLabels: Record<string, string> = {
        confirmed: "Đã xác nhận",
        pending: "Chờ xác nhận",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
    };

    const statusOptions = [
        { value: "all", label: "Tất cả" },
        { value: "pending", label: "Chờ xác nhận" },
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "completed", label: "Hoàn thành" },
        { value: "cancelled", label: "Đã hủy" },
    ];

    function formatDate(dateStr: string) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function formatShortDate(dateStr: string) {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        return date.toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
        });
    }

    function formatTime(dateStr: string) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function generateBookingCode(id: number) {
        return `LH${String(id).padStart(6, "0")}`;
    }

    function isToday(dateStr: string) {
        const date = new Date(dateStr);
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    function getDateLabel(dateStr: string) {
        if (isToday(dateStr)) return "(Hôm nay)";
        const date = new Date(dateStr);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (date.toDateString() === tomorrow.toDateString())
            return "(Ngày mai)";
        return "";
    }

    // Group bookings by date
    function groupByDate(bookings: any[]) {
        const groups: Record<string, any[]> = {};
        for (const booking of bookings) {
            const dateKey = new Date(booking.date).toDateString();
            if (!groups[dateKey]) groups[dateKey] = [];
            groups[dateKey].push(booking);
        }
        return Object.entries(groups).map(([dateKey, items]) => ({
            date: items[0].date,
            bookings: items.sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime(),
            ),
        }));
    }

    let groupedBookings = $derived(groupByDate(data.bookings || []));

    // Apply filters
    function applyFilters() {
        const params = new URLSearchParams();

        if (dateFilter === "today") {
            const today = new Date().toISOString().split("T")[0];
            params.set("from", today);
            params.set("to", today);
        } else if (dateFilter === "week") {
            const today = new Date();
            const nextWeek = new Date();
            nextWeek.setDate(today.getDate() + 7);
            params.set("from", today.toISOString().split("T")[0]);
            params.set("to", nextWeek.toISOString().split("T")[0]);
        } else if (dateFilter === "month") {
            const today = new Date();
            const nextMonth = new Date();
            nextMonth.setMonth(today.getMonth() + 1);
            params.set("from", today.toISOString().split("T")[0]);
            params.set("to", nextMonth.toISOString().split("T")[0]);
        } else if (fromDate && toDate) {
            params.set("from", fromDate);
            params.set("to", toDate);
        }

        if (statusFilter && statusFilter !== "all") {
            params.set("status", statusFilter);
        }
        if (searchQuery) {
            params.set("search", searchQuery);
        }
        params.set("page", "1");
        params.set("limit", pageSize.toString());

        goto(`/bookings?${params.toString()}`);
    }

    function setDateFilter(filter: "today" | "week" | "month" | "custom") {
        dateFilter = filter;
        if (filter !== "custom") {
            applyFilters();
        }
    }

    function goToPage(pageNum: number) {
        const currentPage = get(page);
        const params = new URLSearchParams(currentPage.url.searchParams);
        params.set("page", pageNum.toString());
        goto(`/bookings?${params.toString()}`);
    }

    function handleFormResult() {
        return async ({ result, update }: any) => {
            if (result.type === "success") {
                toast.success("Thao tác thành công");
                isCreateOpen = false;
                isDeleteOpen = false;
                newBooking = {
                    customerId: "",
                    customerPhone: "",
                    date: "",
                    time: "",
                    guestCount: "1",
                    status: "confirmed",
                    notes: "",
                    services: [{ categoryId: "", serviceId: "", staffId: "" }],
                };
            } else if (result.type === "failure") {
                toast.error(result.data?.message || "Có lỗi xảy ra");
            }
            await update();
        };
    }

    async function handleStatusChange(bookingId: number, newStatus: string) {
        const formData = new FormData();
        formData.set("id", bookingId.toString());
        formData.set("status", newStatus);

        const res = await fetch("?/updateStatus", {
            method: "POST",
            body: formData,
        });

        if (res.ok) {
            toast.success("Đã cập nhật trạng thái");
            // Refresh the page to get updated data
            goto($page.url.toString(), { invalidateAll: true });
        } else {
            toast.error("Không thể cập nhật trạng thái");
        }
    }

    function openDeleteDialog(booking: any) {
        deletingBooking = booking;
        isDeleteOpen = true;
    }
</script>

<svelte:head>
    <title>Lịch hẹn | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-4">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
            <p class="text-muted-foreground">Quản lý lịch hẹn của khách hàng</p>
        </div>
        <div class="flex items-center gap-2">
            <Button variant="outline" class="gap-2">
                <Download class="h-4 w-4" />
                Xuất Excel
            </Button>
            {#if data.canCreate}
                <Button
                    class="bg-purple-600 hover:bg-purple-700 gap-2"
                    onclick={() => (isCreateOpen = true)}
                >
                    <Plus class="h-4 w-4" />
                    Tạo mới
                </Button>
            {/if}
        </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card class="border border-gray-100 shadow-sm">
            <CardContent class="p-4">
                <div class="flex items-center justify-between">
                    <div class="space-y-1">
                        <p
                            class="text-xs font-medium text-muted-foreground uppercase tracking-wide"
                        >
                            Tổng lịch hẹn
                        </p>
                        <span class="text-2xl font-bold"
                            >{data.stats?.total || 0}</span
                        >
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
                            Chờ xác nhận
                        </p>
                        <span class="text-2xl font-bold text-yellow-600"
                            >{data.stats?.pending || 0}</span
                        >
                    </div>
                    <div class="p-2.5 rounded-lg bg-yellow-100">
                        <Clock class="h-5 w-5 text-yellow-600" />
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
                            Hoàn thành
                        </p>
                        <span class="text-2xl font-bold text-green-600"
                            >{data.stats?.completed || 0}</span
                        >
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
                        <span class="text-2xl font-bold text-red-600"
                            >{data.stats?.cancelRate || 0}%</span
                        >
                    </div>
                    <div class="p-2.5 rounded-lg bg-red-100">
                        <UserX class="h-5 w-5 text-red-600" />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>

    <!-- Quick Filters Row -->
    <Card class="p-4">
        <div
            class="flex flex-col lg:flex-row lg:items-center gap-4 justify-between"
        >
            <!-- Date Filter Buttons -->
            <div class="flex items-center gap-2 flex-wrap">
                <div
                    class="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50"
                >
                    <button
                        class={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            dateFilter === "today"
                                ? "bg-white shadow-sm text-purple-600"
                                : "text-gray-600 hover:text-gray-900",
                        )}
                        onclick={() => setDateFilter("today")}
                    >
                        Hôm nay
                    </button>
                    <button
                        class={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            dateFilter === "week"
                                ? "bg-white shadow-sm text-purple-600"
                                : "text-gray-600 hover:text-gray-900",
                        )}
                        onclick={() => setDateFilter("week")}
                    >
                        7 ngày tới
                    </button>
                    <button
                        class={cn(
                            "px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                            dateFilter === "month"
                                ? "bg-white shadow-sm text-purple-600"
                                : "text-gray-600 hover:text-gray-900",
                        )}
                        onclick={() => setDateFilter("month")}
                    >
                        Tháng này
                    </button>
                </div>

                <!-- Custom Date Range -->
                <div class="flex items-center gap-2">
                    <Input
                        type="date"
                        class="w-36 h-9"
                        bind:value={fromDate}
                        onchange={() => {
                            dateFilter = "custom";
                            if (toDate) applyFilters();
                        }}
                    />
                    <span class="text-muted-foreground">~</span>
                    <Input
                        type="date"
                        class="w-36 h-9"
                        bind:value={toDate}
                        onchange={() => {
                            dateFilter = "custom";
                            if (fromDate) applyFilters();
                        }}
                    />
                </div>
            </div>

            <!-- Status Filter -->
            <div class="flex items-center gap-2">
                <select
                    class="h-9 px-3 rounded-md border border-input bg-background text-sm"
                    bind:value={statusFilter}
                    onchange={() => applyFilters()}
                >
                    {#each statusOptions as option}
                        <option value={option.value}>{option.label}</option>
                    {/each}
                </select>
            </div>
        </div>

        <!-- Search Row -->
        <div class="flex items-center gap-4 mt-4">
            <div class="relative flex-1 max-w-sm">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Tìm theo tên hoặc SĐT..."
                    class="pl-9 h-9"
                    bind:value={searchQuery}
                    onkeydown={(e) => e.key === "Enter" && applyFilters()}
                />
            </div>
            <Button variant="outline" size="sm" onclick={() => applyFilters()}>
                <Filter class="h-4 w-4 mr-2" />
                Lọc
            </Button>
        </div>
    </Card>

    <!-- Bookings Table -->
    <Card>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b bg-gray-50/50">
                    <tr>
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Ngày đặt</th
                        >
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Giờ</th
                        >
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Mã</th
                        >
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Khách hàng</th
                        >
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Dịch vụ & ghi chú</th
                        >
                        <th
                            class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                            >Trạng thái</th
                        >
                        <th
                            class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each groupedBookings as group, groupIndex}
                        {#each group.bookings as booking, bookingIndex}
                            <tr
                                class={cn(
                                    "hover:bg-muted/50 transition-colors",
                                    bookingIndex === 0 && groupIndex > 0
                                        ? "border-t-2 border-gray-200"
                                        : "",
                                )}
                            >
                                <!-- Date (show only for first item in group) -->
                                <td class="px-4 py-3 text-sm">
                                    {#if bookingIndex === 0}
                                        <div class="font-medium">
                                            {formatShortDate(booking.date)}
                                        </div>
                                        <div
                                            class="text-xs text-muted-foreground"
                                        >
                                            {getDateLabel(booking.date)}
                                            {#if group.bookings.length > 1}
                                                ({group.bookings.length})
                                            {/if}
                                        </div>
                                    {/if}
                                </td>

                                <!-- Time -->
                                <td class="px-4 py-3 text-sm font-medium">
                                    {formatTime(booking.date)}
                                </td>

                                <!-- Code -->
                                <td
                                    class="px-4 py-3 text-sm font-mono text-purple-600"
                                >
                                    {generateBookingCode(booking.id)}
                                </td>

                                <!-- Customer -->
                                <td class="px-4 py-3">
                                    <div
                                        class="text-sm font-medium text-blue-600 hover:underline cursor-pointer"
                                    >
                                        {booking.customer?.name || "N/A"}
                                    </div>
                                    <div class="text-xs text-muted-foreground">
                                        SĐT: {booking.customer?.phone || "N/A"}
                                    </div>
                                </td>

                                <!-- Service & Notes -->
                                <td class="px-4 py-3">
                                    <div class="text-sm">
                                        - {booking.service?.name || "N/A"}
                                    </div>
                                    {#if booking.notes}
                                        <div
                                            class="text-xs text-muted-foreground mt-1"
                                        >
                                            {booking.notes}
                                        </div>
                                    {/if}
                                </td>

                                <!-- Status -->
                                <td class="px-4 py-3">
                                    {#if data.canUpdate}
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger>
                                                {#snippet child({ props })}
                                                    <button
                                                        {...props}
                                                        class={cn(
                                                            "px-3 py-1 rounded-md text-xs font-medium border inline-flex items-center gap-1",
                                                            statusStyles[
                                                                booking.status
                                                            ],
                                                        )}
                                                    >
                                                        {statusLabels[
                                                            booking.status
                                                        ] || booking.status}
                                                        <ChevronRight
                                                            class="h-3 w-3 rotate-90"
                                                        />
                                                    </button>
                                                {/snippet}
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content>
                                                {#each statusOptions.slice(1) as option}
                                                    <DropdownMenu.Item
                                                        onclick={() =>
                                                            handleStatusChange(
                                                                booking.id,
                                                                option.value,
                                                            )}
                                                    >
                                                        {#if booking.status === option.value}
                                                            <Check
                                                                class="mr-2 h-4 w-4"
                                                            />
                                                        {:else}
                                                            <span class="mr-6"
                                                            ></span>
                                                        {/if}
                                                        {option.label}
                                                    </DropdownMenu.Item>
                                                {/each}
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Root>
                                    {:else}
                                        <span
                                            class={cn(
                                                "px-3 py-1 rounded-md text-xs font-medium border",
                                                statusStyles[booking.status],
                                            )}
                                        >
                                            {statusLabels[booking.status] ||
                                                booking.status}
                                        </span>
                                    {/if}
                                </td>

                                <!-- Actions -->
                                <td class="px-4 py-3 text-right">
                                    {#if data.canUpdate || data.canDelete}
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger>
                                                {#snippet child({ props })}
                                                    <Button
                                                        {...props}
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-8 w-8"
                                                    >
                                                        <MoreVertical
                                                            class="h-4 w-4"
                                                        />
                                                    </Button>
                                                {/snippet}
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content align="end">
                                                {#if data.canUpdate}
                                                    <DropdownMenu.Item>
                                                        <Pencil
                                                            class="mr-2 h-4 w-4"
                                                        />
                                                        Chỉnh sửa
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if data.canDelete}
                                                    <DropdownMenu.Item
                                                        class="text-red-600"
                                                        onclick={() =>
                                                            openDeleteDialog(
                                                                booking,
                                                            )}
                                                    >
                                                        <Trash
                                                            class="mr-2 h-4 w-4"
                                                        />
                                                        Xóa
                                                    </DropdownMenu.Item>
                                                {/if}
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Root>
                                    {/if}
                                </td>
                            </tr>
                        {/each}
                    {:else}
                        <tr>
                            <td
                                colspan="7"
                                class="px-4 py-12 text-center text-muted-foreground"
                            >
                                <div class="flex flex-col items-center gap-2">
                                    <CalendarCheck
                                        class="h-12 w-12 text-gray-300"
                                    />
                                    <p>Không có lịch hẹn nào</p>
                                    {#if data.canCreate}
                                        <Button
                                            variant="link"
                                            onclick={() =>
                                                (isCreateOpen = true)}
                                        >
                                            Tạo lịch hẹn mới
                                        </Button>
                                    {/if}
                                </div>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        {#if data.pagination && data.pagination.totalPages > 1}
            <div
                class="flex items-center justify-between px-4 py-3 border-t bg-gray-50/50"
            >
                <div class="text-sm text-muted-foreground">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(
                        currentPage * pageSize,
                        data.pagination.total,
                    )} / {data.pagination.total} lịch hẹn
                </div>
                <div class="flex items-center gap-2">
                    <select
                        class="h-8 px-2 rounded border border-input bg-background text-sm"
                        bind:value={pageSize}
                        onchange={() => {
                            currentPage = 1;
                            applyFilters();
                        }}
                    >
                        <option value={10}>10 / trang</option>
                        <option value={20}>20 / trang</option>
                        <option value={50}>50 / trang</option>
                    </select>
                    <div class="flex items-center">
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8"
                            disabled={currentPage <= 1}
                            onclick={() => goToPage(currentPage - 1)}
                        >
                            <ChevronLeft class="h-4 w-4" />
                        </Button>
                        {#each Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => i + 1) as pageNum}
                            <Button
                                variant={pageNum === currentPage
                                    ? "default"
                                    : "outline"}
                                size="icon"
                                class="h-8 w-8"
                                onclick={() => goToPage(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        {/each}
                        <Button
                            variant="outline"
                            size="icon"
                            class="h-8 w-8"
                            disabled={currentPage >= data.pagination.totalPages}
                            onclick={() => goToPage(currentPage + 1)}
                        >
                            <ChevronRight class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        {/if}
    </Card>
</div>

<!-- Create Booking Dialog -->
<Dialog.Root bind:open={isCreateOpen}>
    <Dialog.Content class="sm:max-w-4xl p-0 gap-0">
        <form action="?/create" method="POST" use:enhance={handleFormResult}>
            <div class="flex flex-col sm:flex-row">
                <!-- Left Panel: Customer & Booking Info -->
                <div class="flex-1 p-6 border-r border-gray-200">
                    <Dialog.Header class="mb-6">
                        <Dialog.Title class="text-lg font-semibold"
                            >Đặt lịch hẹn</Dialog.Title
                        >
                    </Dialog.Header>

                    <!-- Customer Info Section -->
                    <div class="space-y-4">
                        <h3 class="text-sm font-medium text-gray-700">
                            Thông tin khách hàng
                        </h3>

                        <div class="relative">
                            <Input
                                type="tel"
                                placeholder="Số điện thoại"
                                class="pr-10"
                                bind:value={newBooking.customerPhone}
                            />
                            <button
                                type="button"
                                class="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                            >
                                <UserCheck class="h-5 w-5" />
                            </button>
                        </div>

                        <select
                            id="customerId"
                            name="customerId"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            bind:value={newBooking.customerId}
                            required
                        >
                            <option value="">Tên KH hoặc Mã KH</option>
                            {#each data.customers || [] as customer}
                                <option value={customer.id}
                                    >{customer.name} - {customer.phone}</option
                                >
                            {/each}
                        </select>
                    </div>

                    <!-- Booking Info Section -->
                    <div class="space-y-4 mt-6">
                        <h3 class="text-sm font-medium text-gray-700">
                            Thông tin lịch hẹn
                        </h3>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-1">
                                <Label
                                    for="bookingDate"
                                    class="text-xs text-gray-500">Ngày:</Label
                                >
                                <Input
                                    type="date"
                                    id="bookingDate"
                                    bind:value={newBooking.date}
                                    required
                                />
                            </div>
                            <div class="space-y-1">
                                <Label
                                    for="bookingTime"
                                    class="text-xs text-gray-500">Giờ:</Label
                                >
                                <Input
                                    type="time"
                                    id="bookingTime"
                                    bind:value={newBooking.time}
                                    required
                                />
                            </div>
                        </div>

                        <div class="space-y-1">
                            <Label
                                for="guestCount"
                                class="text-xs text-gray-500">Số khách:</Label
                            >
                            <Input
                                type="number"
                                id="guestCount"
                                min="1"
                                bind:value={newBooking.guestCount}
                            />
                        </div>

                        <div class="space-y-1">
                            <Label for="status" class="text-xs text-gray-500"
                                >Trạng thái:</Label
                            >
                            <select
                                id="status"
                                name="status"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                bind:value={newBooking.status}
                            >
                                <option value="confirmed">Đã xác nhận</option>
                                <option value="pending">Chờ xác nhận</option>
                            </select>
                        </div>

                        <div class="space-y-1">
                            <Label for="notes" class="text-xs text-gray-500"
                                >Ghi chú:</Label
                            >
                            <textarea
                                id="notes"
                                name="notes"
                                placeholder="Nhập ghi chú"
                                rows="3"
                                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
                                bind:value={newBooking.notes}
                            ></textarea>
                        </div>
                    </div>

                    <!-- Hidden field for combined date/time -->
                    <input
                        type="hidden"
                        name="date"
                        value={newBooking.date && newBooking.time
                            ? `${newBooking.date}T${newBooking.time}`
                            : ""}
                    />
                </div>

                <!-- Right Panel: Service Selection -->
                <div class="flex-1 p-6 bg-gray-50">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-sm font-medium text-gray-700">
                            Khách #1
                        </h3>
                    </div>

                    <!-- Service Row -->
                    {#each newBooking.services as service, index}
                        <div
                            class="flex items-center gap-2 mb-3 p-3 bg-white rounded-lg border border-gray-200"
                        >
                            <select
                                class="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                bind:value={service.categoryId}
                            >
                                <option value="">Nhóm dịch vụ</option>
                                {#each data.serviceCategories || [] as category}
                                    <option value={category.id}
                                        >{category.name}</option
                                    >
                                {/each}
                            </select>

                            <select
                                name="serviceId"
                                class="flex h-9 flex-1 rounded-md border border-input bg-background px-3 py-1 text-sm"
                                bind:value={service.serviceId}
                                required
                            >
                                <option value="">Chọn dịch vụ</option>
                                {#each (data.services || []).filter((s: any) => !service.categoryId || s.categoryId === parseInt(service.categoryId)) as svc}
                                    <option value={svc.id}>{svc.name}</option>
                                {/each}
                            </select>

                            <select
                                class="flex h-9 rounded-md border border-input bg-purple-100 text-purple-700 px-3 py-1 text-sm min-w-[120px]"
                                bind:value={service.staffId}
                            >
                                <option value="">Chọn nhân viên</option>
                                {#each data.members || [] as member}
                                    <option value={member.id}
                                        >{member.user?.name ||
                                            member.name}</option
                                    >
                                {/each}
                            </select>

                            {#if newBooking.services.length > 1}
                                <button
                                    type="button"
                                    class="p-2 text-gray-400 hover:text-red-500"
                                    onclick={() => {
                                        newBooking.services =
                                            newBooking.services.filter(
                                                (_, i) => i !== index,
                                            );
                                    }}
                                >
                                    <Trash class="h-4 w-4" />
                                </button>
                            {/if}
                        </div>
                    {/each}

                    <!-- Add Service Button -->
                    <Button
                        type="button"
                        variant="outline"
                        class="text-blue-600 border-blue-300 hover:bg-blue-50"
                        onclick={() => {
                            newBooking.services = [
                                ...newBooking.services,
                                { categoryId: "", serviceId: "", staffId: "" },
                            ];
                        }}
                    >
                        + Thêm dịch vụ
                    </Button>

                    <!-- Summary -->
                    <div
                        class="flex items-center justify-end gap-4 mt-6 text-sm text-gray-500"
                    >
                        <span>0 đ</span>
                        <span>0 Phút</span>
                        <label class="flex items-center gap-2 cursor-pointer">
                            <span>Hiện ghi chú</span>
                            <input type="checkbox" class="rounded" />
                        </label>
                    </div>
                </div>
            </div>

            <!-- Footer -->
            <div
                class="flex items-center justify-start gap-3 p-4 border-t border-gray-200 bg-gray-50"
            >
                <Button
                    variant="outline"
                    type="button"
                    class="min-w-[100px]"
                    onclick={() => (isCreateOpen = false)}
                >
                    Hủy
                </Button>
                <Button
                    type="submit"
                    class="min-w-[100px] bg-blue-500 hover:bg-blue-600"
                >
                    Lưu
                </Button>
            </div>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Xác nhận xóa lịch hẹn?</AlertDialog.Title>
            <AlertDialog.Description>
                Bạn có chắc chắn muốn xóa lịch hẹn này? Hành động này không thể
                hoàn tác.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <form action="?/delete" method="POST" use:enhance={handleFormResult}>
            <input type="hidden" name="id" value={deletingBooking?.id} />
            <AlertDialog.Footer>
                <AlertDialog.Cancel onclick={() => (isDeleteOpen = false)}
                    >Hủy</AlertDialog.Cancel
                >
                <Button type="submit" variant="destructive">Xóa</Button>
            </AlertDialog.Footer>
        </form>
    </AlertDialog.Content>
</AlertDialog.Root>
