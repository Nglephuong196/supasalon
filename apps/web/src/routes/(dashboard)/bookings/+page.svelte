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
    import { goto, invalidateAll } from "$app/navigation";
    import { page } from "$app/stores";
    import { get } from "svelte/store";
    import { enhance } from "$app/forms";
    import DateTimePicker from "$lib/components/ui/date-time-picker/date-time-picker.svelte";
    import Combobox from "$lib/components/ui/combobox/combobox.svelte";
    import * as Select from "$lib/components/ui/select";
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
    let isQuickCreateOpen = $state(false);

    // Customer Autocomplete state
    let customerSearchQuery = $state("");
    let showCustomerResults = $state(false);

    // Quick Create Validation Errors
    let quickNameError = $state("");
    let quickPhoneError = $state("");

    let customerItems = $derived(
        (data.customers || []).map((c: any) => ({
            value: c.id.toString(),
            label: `${c.name} - ${c.phone}`,
        })),
    );

    $effect(() => {
        if (newBooking.customerId) {
            const customer = data.customers?.find(
                (c: any) => c.id.toString() === newBooking.customerId,
            );
            if (customer) {
                newBooking.customerPhone = customer.phone;
            }
        }
    });

    function selectCustomer(customer: any) {
        newBooking.customerId = customer.id.toString();
        newBooking.customerPhone = customer.phone;
        customerSearchQuery = `${customer.name} - ${customer.phone}`;
        showCustomerResults = false;
    }

    // Form states for create/edit
    let editingBookingId = $state<number | null>(null);
    let newBooking = $state({
        customerId: "",
        customerPhone: "",
        date: "",
        guestCount: "1",
        status: "confirmed",
        notes: "",
        guests: [
            { services: [{ categoryId: "", serviceId: "", memberId: "" }] },
        ],
    });

    // Sync guest count with guests array
    $effect(() => {
        const count = parseInt(newBooking.guestCount) || 1;
        const currentGuests = newBooking.guests.length;

        if (count > currentGuests) {
            // Add new guest areas
            for (let i = currentGuests; i < count; i++) {
                newBooking.guests = [
                    ...newBooking.guests,
                    {
                        services: [
                            { categoryId: "", serviceId: "", memberId: "" },
                        ],
                    },
                ];
            }
        } else if (count < currentGuests) {
            // Remove extra guest areas
            newBooking.guests = newBooking.guests.slice(0, count);
        }
    });

    const statusStyles: Record<string, string> = {
        confirmed: "bg-emerald-100 text-emerald-700 border-emerald-200",
        pending: "bg-amber-100 text-amber-700 border-amber-200",
        completed: "bg-blue-100 text-blue-700 border-blue-200",
        cancelled: "bg-rose-100 text-rose-700 border-rose-200",
        checkin: "bg-purple-100 text-purple-700 border-purple-200",
    };

    const statusLabels: Record<string, string> = {
        confirmed: "Đã xác nhận",
        pending: "Chờ xác nhận",
        completed: "Hoàn thành",
        cancelled: "Đã hủy",
        checkin: "Đã check-in",
    };

    const statusOptions = [
        { value: "all", label: "Tất cả" },
        { value: "pending", label: "Chờ xác nhận" },
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "checkin", label: "Đã check-in" },
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
                toast.success(
                    editingBookingId
                        ? "Đã cập nhật lịch hẹn"
                        : "Thao tác thành công",
                );
                isCreateOpen = false;
                isDeleteOpen = false;
                editingBookingId = null;
                // Force reload
                await invalidateAll();

                newBooking = {
                    customerId: "",
                    customerPhone: "",
                    date: "",
                    guestCount: "1",
                    status: "confirmed",
                    notes: "",
                    guests: [
                        {
                            services: [
                                { categoryId: "", serviceId: "", memberId: "" },
                            ],
                        },
                    ],
                };
            } else if (result.type === "failure") {
                const errorMessage =
                    typeof result.data?.message === "string"
                        ? result.data.message
                        : "Có lỗi xảy ra khi lưu lịch hẹn (Lỗi dữ liệu)";
                toast.error(errorMessage);
                console.error("Booking save error:", result);
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

    function openEditDialog(booking: any) {
        editingBookingId = booking.id;

        let guests = booking.guests || [];

        if (!guests.length || guests.length === 0) {
            guests = [
                { services: [{ categoryId: "", serviceId: "", memberId: "" }] },
            ];
        } else {
            // Map JSON structure to Form structure (strings)
            guests = guests.map((g: any) => ({
                services: (g.services || []).map((s: any) => ({
                    categoryId: s.categoryId?.toString() || "",
                    serviceId: s.serviceId?.toString() || "",
                    memberId:
                        s.memberId?.toString() || s.staffId?.toString() || "",
                })),
            }));
        }

        newBooking = {
            customerId: booking.customerId.toString(),
            customerPhone: booking.customer?.phone || "",
            date: booking.date,
            guestCount: booking.guestCount?.toString() || "1",
            status: booking.status,
            notes: booking.notes || "",
            guests: guests,
        };

        isCreateOpen = true;
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

    <!-- Bookings Table Card -->
    <div
        class="rounded-xl border border-gray-100 bg-card text-card-foreground shadow-sm"
    >
        <!-- Filters Header -->
        <div class="p-4 border-b border-gray-100 space-y-4">
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
                        class="h-9 px-3 rounded-md border border-input bg-background text-sm focus:border-purple-500 focus:ring-purple-500"
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
            <div class="flex items-center gap-4">
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
                <Button
                    variant="outline"
                    size="sm"
                    onclick={() => applyFilters()}
                >
                    <Filter class="h-4 w-4 mr-2" />
                    Lọc
                </Button>
            </div>
        </div>

        <!-- Bookings Table -->
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="border-b border-gray-100 bg-muted/40">
                    <tr>
                        <th class="h-12 w-[50px] px-4 align-middle">
                            <input
                                type="checkbox"
                                class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                        </th>
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Ngày đặt</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Giờ</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Mã</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Khách hàng</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Dịch vụ & Ghi chú</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap"
                            >Trạng thái</th
                        >
                        <th
                            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each groupedBookings as group, groupIndex}
                        {#each group.bookings as booking, bookingIndex}
                            <tr
                                class={cn(
                                    "hover:bg-muted/50 transition-colors",
                                    bookingIndex === 0 && groupIndex > 0
                                        ? "border-t border-gray-100"
                                        : "",
                                )}
                            >
                                <!-- Date (show only for first item in group) -->
                                <td class="p-4 align-top w-[50px]">
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </td>
                                <td class="p-4 align-top w-[140px]">
                                    {#if bookingIndex === 0}
                                        <div class="flex flex-col">
                                            <span
                                                class="font-semibold text-foreground"
                                            >
                                                {formatShortDate(booking.date)}
                                            </span>
                                            <span
                                                class="text-xs text-muted-foreground"
                                            >
                                                {getDateLabel(booking.date)}
                                                {#if group.bookings.length > 1}
                                                    <span
                                                        class="ml-1 inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium"
                                                    >
                                                        {group.bookings.length}
                                                    </span>
                                                {/if}
                                            </span>
                                        </div>
                                    {/if}
                                </td>

                                <!-- Time -->
                                <td class="p-4 align-top font-medium w-[100px]">
                                    {formatTime(booking.date)}
                                </td>

                                <!-- Code -->
                                <td class="p-4 align-top w-[120px]">
                                    <span
                                        class="font-mono text-xs font-medium bg-muted px-2 py-1 rounded"
                                    >
                                        {generateBookingCode(booking.id)}
                                    </span>
                                </td>

                                <!-- Customer -->
                                <td class="p-4 align-top">
                                    <div class="flex flex-col gap-1">
                                        <div
                                            class="font-medium text-primary hover:underline cursor-pointer"
                                        >
                                            {booking.customer?.name || "N/A"}
                                        </div>
                                        <div
                                            class="flex items-center text-xs text-muted-foreground gap-1"
                                        >
                                            <span class="tabular-nums"
                                                >{booking.customer?.phone ||
                                                    "N/A"}</span
                                            >
                                        </div>
                                    </div>
                                </td>

                                <!-- Service & Notes -->
                                <td class="p-4 align-top max-w-[300px]">
                                    <div class="space-y-1">
                                        <div class="font-medium">
                                            {booking.bookingServices?.[0]
                                                ?.service?.name || "N/A"}
                                        </div>
                                        {#if booking.notes}
                                            <div
                                                class="text-xs text-muted-foreground italic flex items-start gap-1"
                                            >
                                                <span class="mt-0.5 opacity-70"
                                                    >Note:</span
                                                >
                                                {booking.notes}
                                            </div>
                                        {/if}
                                    </div>
                                </td>

                                <!-- Status -->
                                <td class="p-4 align-top">
                                    {#if data.canUpdate}
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger>
                                                {#snippet child({ props })}
                                                    <button
                                                        {...props}
                                                        class={cn(
                                                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 gap-1",
                                                            statusStyles[
                                                                booking.status
                                                            ],
                                                        )}
                                                    >
                                                        {statusLabels[
                                                            booking.status
                                                        ] || booking.status}
                                                        <ChevronRight
                                                            class="h-3 w-3 rotate-90 opacity-50"
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
                                                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                                statusStyles[booking.status],
                                            )}
                                        >
                                            {statusLabels[booking.status] ||
                                                booking.status}
                                        </span>
                                    {/if}
                                </td>

                                <!-- Actions -->
                                <td class="p-4 align-top text-right">
                                    {#if data.canUpdate || data.canDelete}
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger>
                                                {#snippet child({ props })}
                                                    <Button
                                                        {...props}
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <MoreVertical
                                                            class="h-4 w-4"
                                                        />
                                                    </Button>
                                                {/snippet}
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content align="end">
                                                {#if data.canUpdate}
                                                    <DropdownMenu.Item
                                                        onclick={() =>
                                                            openEditDialog(
                                                                booking,
                                                            )}
                                                    >
                                                        <Pencil
                                                            class="mr-2 h-4 w-4"
                                                        />
                                                        Chỉnh sửa
                                                    </DropdownMenu.Item>
                                                {/if}
                                                {#if data.canDelete}
                                                    <DropdownMenu.Item
                                                        class="text-red-600 focus:text-red-600"
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
                            <td colspan="7" class="h-[400px] text-center">
                                <div
                                    class="flex flex-col items-center justify-center gap-2 text-muted-foreground"
                                >
                                    <div
                                        class="rounded-full bg-muted/50 p-4 mb-2"
                                    >
                                        <CalendarCheck
                                            class="h-8 w-8 text-muted-foreground/50"
                                        />
                                    </div>
                                    <h3 class="text-lg font-semibold">
                                        Chưa có lịch hẹn
                                    </h3>
                                    <p class="text-sm max-w-sm mx-auto mb-4">
                                        Hiện tại chưa có lịch hẹn nào. Hãy tạo
                                        lịch hẹn mới đ bắ đầu.
                                    </p>
                                    {#if data.canCreate}
                                        <Button
                                            onclick={() =>
                                                (isCreateOpen = true)}
                                        >
                                            <Plus class="mr-2 h-4 w-4" />
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
                class="flex items-center justify-between px-4 py-3 border-t bg-muted/20"
            >
                <div class="text-sm text-muted-foreground">
                    Hiển thị {(currentPage - 1) * pageSize + 1} đến {Math.min(
                        currentPage * pageSize,
                        data.pagination.total,
                    )} / {data.pagination.total} lịch hẹn
                </div>
                <div class="flex items-center gap-2">
                    <select
                        class="h-8 px-2 rounded border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
                    <div class="flex items-center gap-1">
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
    </div>
</div>

<!-- Create Booking Dialog -->
<Dialog.Root bind:open={isCreateOpen}>
    <Dialog.Content
        class="sm:max-w-4xl !p-0 !gap-0 overflow-hidden flex flex-col"
    >
        <Dialog.Header class="p-6 pb-4 border-b border-gray-200">
            <Dialog.Title class="text-lg font-semibold"
                >Đặt lịch hẹn</Dialog.Title
            >
        </Dialog.Header>
        <form
            action={editingBookingId ? "?/update" : "?/create"}
            method="POST"
            use:enhance={handleFormResult}
        >
            {#if editingBookingId}
                <input type="hidden" name="id" value={editingBookingId} />
            {/if}
            <input
                type="hidden"
                name="guests"
                value={JSON.stringify(newBooking.guests)}
            />
            <input
                type="hidden"
                name="customerId"
                bind:value={newBooking.customerId}
            />
            <input
                type="hidden"
                name="customerPhone"
                bind:value={newBooking.customerPhone}
            />
            <input type="hidden" name="date" bind:value={newBooking.date} />
            <div class="flex flex-col sm:flex-row max-h-[70vh]">
                <!-- Left Panel: Customer & Booking Info -->
                <div
                    class="w-full sm:w-[340px] shrink-0 p-6 border-r border-gray-200 overflow-y-auto"
                >
                    <!-- Customer Info Section -->
                    <div class="space-y-4 relative">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-medium text-gray-700">
                                Thông tin khách hàng
                            </h3>
                            {#if newBooking.customerId}
                                <button
                                    type="button"
                                    class="text-xs text-red-500 hover:underline"
                                    onclick={() => {
                                        newBooking.customerId = "";
                                        newBooking.customerPhone = "";
                                        customerSearchQuery = "";
                                    }}
                                >
                                    Xóa chọn
                                </button>
                            {/if}
                        </div>

                        <div class="relative">
                            <div class="flex gap-2">
                                <Combobox
                                    items={customerItems}
                                    bind:value={newBooking.customerId}
                                    placeholder="Tìm khách hàng..."
                                    searchPlaceholder="Tìm theo tên hoặc SĐT..."
                                    emptyText="Không tìm thấy khách hàng."
                                    class="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    title="Thêm khách hàng mới"
                                    onclick={() => (isQuickCreateOpen = true)}
                                >
                                    <Plus class="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <!-- Booking Info Section -->
                    <div class="space-y-4 mt-6">
                        <h3 class="text-sm font-medium text-gray-700">
                            Thông tin lịch hẹn
                        </h3>

                        <div class="space-y-1">
                            <Label
                                for="bookingDateTime"
                                class="text-xs text-gray-500">Thời gian:</Label
                            >
                            <DateTimePicker bind:value={newBooking.date} />
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
                                name="guestCount"
                                bind:value={newBooking.guestCount}
                            />
                        </div>

                        <div class="space-y-1">
                            <Label for="status" class="text-xs text-gray-500"
                                >Trạng thái:</Label
                            >
                            <Select.Root
                                type="single"
                                bind:value={newBooking.status}
                                name="status"
                            >
                                <Select.Trigger class="w-full">
                                    {#snippet children()}
                                        {statusLabels[newBooking.status] ||
                                            "Chọn trạng thái"}
                                    {/snippet}
                                </Select.Trigger>
                                <Select.Content>
                                    <Select.Item
                                        value="confirmed"
                                        label="Đã xác nhận"
                                        >Đã xác nhận</Select.Item
                                    >
                                    <Select.Item
                                        value="pending"
                                        label="Chờ xác nhận"
                                        >Chờ xác nhận</Select.Item
                                    >
                                    <Select.Item
                                        value="checkin"
                                        label="Đã check-in"
                                        >Đã check-in</Select.Item
                                    >
                                    <Select.Item
                                        value="completed"
                                        label="Hoàn thành"
                                        >Hoàn thành</Select.Item
                                    >
                                    <Select.Item
                                        value="cancelled"
                                        label="Đã hủy">Đã hủy</Select.Item
                                    >
                                </Select.Content>
                            </Select.Root>
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
                                class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                bind:value={newBooking.notes}
                            ></textarea>
                        </div>
                    </div>

                    <!-- Hidden field for combined date/time -->
                </div>

                <!-- Right Panel: Service Selection -->
                <div class="flex-1 p-6 bg-gray-50 overflow-y-auto">
                    {#each newBooking.guests as guest, guestIndex}
                        <div class="mb-6 last:mb-0">
                            <div class="flex items-center justify-between mb-3">
                                <h3 class="text-sm font-medium text-gray-700">
                                    Khách #{guestIndex + 1}
                                </h3>
                                {#if parseInt(newBooking.guestCount) > 1}
                                    <span class="text-xs text-gray-400">
                                        {guest.services.length} dịch vụ
                                    </span>
                                {/if}
                            </div>

                            <!-- Service Rows for this guest -->
                            {#each guest.services as service, serviceIndex}
                                <div
                                    class="flex items-center gap-2 mb-3 p-3 bg-white rounded-lg border border-gray-200"
                                >
                                    <div class="min-w-[140px]">
                                        <Combobox
                                            items={(
                                                data.serviceCategories || []
                                            ).map(
                                                (c: {
                                                    id: number;
                                                    name: string;
                                                }) => ({
                                                    value: c.id.toString(),
                                                    label: c.name,
                                                }),
                                            )}
                                            bind:value={service.categoryId}
                                            placeholder="Nhóm dịch vụ"
                                            searchPlaceholder="Tìm nhóm dịch vụ..."
                                            emptyText="Không tìm thấy nhóm dịch vụ."
                                            onchange={() => {
                                                // Reset service when category changes
                                                service.serviceId = "";
                                            }}
                                        />
                                    </div>

                                    <div class="min-w-[160px] flex-1">
                                        <Combobox
                                            class="w-full"
                                            placeholder={service.categoryId
                                                ? "Chọn dịch vụ"
                                                : "Vui lòng chọn nhóm dịch vụ trước"}
                                            searchPlaceholder="Tìm dịch vụ..."
                                            emptyText="Không tìm thấy dịch vụ."
                                            disabled={!service.categoryId}
                                            items={(data.services || [])
                                                .filter(
                                                    (s: any) =>
                                                        service.categoryId &&
                                                        s.categoryId ===
                                                            parseInt(
                                                                service.categoryId,
                                                            ),
                                                )
                                                .map((s: any) => ({
                                                    value: s.id.toString(),
                                                    label: s.name,
                                                }))}
                                            bind:value={service.serviceId}
                                        />
                                    </div>

                                    <div class="min-w-[150px]">
                                        <Combobox
                                            items={(data.members || []).map(
                                                (m: {
                                                    id: string;
                                                    user?: { name: string };
                                                    name?: string;
                                                }) => ({
                                                    value: m.id,
                                                    label:
                                                        m.user?.name ||
                                                        m.name ||
                                                        "",
                                                }),
                                            )}
                                            bind:value={service.memberId}
                                            placeholder="Chọn nhân viên"
                                            searchPlaceholder="Tìm nhân viên..."
                                            emptyText="Không tìm thấy nhân viên."
                                            class="bg-purple-50 text-purple-900 border-purple-200"
                                        />
                                    </div>

                                    {#if guest.services.length > 1}
                                        <button
                                            type="button"
                                            class="p-2 text-gray-400 hover:text-red-500 shrink-0"
                                            onclick={() => {
                                                guest.services =
                                                    guest.services.filter(
                                                        (_, i) =>
                                                            i !== serviceIndex,
                                                    );
                                            }}
                                        >
                                            <Trash class="h-4 w-4" />
                                        </button>
                                    {/if}
                                </div>
                            {/each}

                            <!-- Add Service Button for this guest -->
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                class="text-blue-600 border-blue-300 hover:bg-blue-50"
                                onclick={() => {
                                    guest.services = [
                                        ...guest.services,
                                        {
                                            categoryId: "",
                                            serviceId: "",
                                            memberId: "",
                                        },
                                    ];
                                }}
                            >
                                + Thêm dịch vụ
                            </Button>
                        </div>

                        {#if guestIndex < newBooking.guests.length - 1}
                            <hr class="my-4 border-gray-300" />
                        {/if}
                    {/each}
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

<!-- Quick Create Customer Dialog -->
<Dialog.Root bind:open={isQuickCreateOpen}>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Thêm nhanh khách hàng</Dialog.Title>
            <Dialog.Description>
                Tạo khách hàng mới chỉ với tên và số điện thoại.
            </Dialog.Description>
        </Dialog.Header>
        <form
            action="?/createCustomer"
            method="POST"
            novalidate
            use:enhance={({ formData, cancel }) => {
                const name = formData.get("name")?.toString().trim();
                const phone = formData.get("phone")?.toString().trim();
                quickNameError = "";
                quickPhoneError = "";
                let hasError = false;
                if (!name) {
                    quickNameError = "Vui lòng nhập tên khách hàng";
                    hasError = true;
                }
                if (!phone) {
                    quickPhoneError = "Vui lòng nhập số điện thoại";
                    hasError = true;
                }
                if (hasError) {
                    cancel();
                    return;
                }
                return async ({ result }) => {
                    if (result.type === "success") {
                        const newCustomer = result.data?.customer as {
                            id: number;
                            phone: string;
                            name: string;
                        };
                        if (newCustomer) {
                            await invalidateAll();
                            newBooking.customerId = newCustomer.id.toString();
                            newBooking.customerPhone = newCustomer.phone;
                            isQuickCreateOpen = false;
                            toast.success("Đã thêm khách hàng mới");
                        }
                    } else if (result.type === "failure") {
                        toast.error(
                            (result.data as { message?: string })?.message ||
                                "Có lỗi xảy ra",
                        );
                    }
                };
            }}
            class="space-y-4 py-4"
        >
            <div class="space-y-2">
                <Label for="quickName">Tên khách hàng</Label>
                <Input
                    id="quickName"
                    name="name"
                    placeholder="Nhập tên khách hàng"
                    oninput={() => (quickNameError = "")}
                />
                {#if quickNameError}
                    <span class="text-red-500 text-xs">{quickNameError}</span>
                {/if}
            </div>
            <div class="space-y-2">
                <Label for="quickPhone">Số điện thoại</Label>
                <Input
                    id="quickPhone"
                    name="phone"
                    placeholder="Nhập số điện thoại"
                    value={customerSearchQuery}
                    oninput={() => (quickPhoneError = "")}
                />
                {#if quickPhoneError}
                    <span class="text-red-500 text-xs">{quickPhoneError}</span>
                {/if}
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isQuickCreateOpen = false)}>Hủy</Button
                >
                <Button type="submit">Lưu khách hàng</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
