<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Plus, Search, Receipt } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    // Mock data
    const invoices = [
        {
            id: "HD001",
            customerName: "Nguyễn Văn A",
            date: "12/01/2026",
            services: ["Cắt tóc", "Gội đầu"],
            total: 130000,
            status: "Paid",
        },
        {
            id: "HD002",
            customerName: "Trần Thị B",
            date: "12/01/2026",
            services: ["Nhuộm tóc"],
            total: 350000,
            status: "Paid",
        },
        {
            id: "HD003",
            customerName: "Lê Văn C",
            date: "11/01/2026",
            services: ["Uốn tóc", "Chăm sóc"],
            total: 700000,
            status: "Pending",
        },
        {
            id: "HD004",
            customerName: "Phạm Thị D",
            date: "11/01/2026",
            services: ["Cắt tóc nữ"],
            total: 120000,
            status: "Paid",
        },
        {
            id: "HD005",
            customerName: "Hoàng Văn E",
            date: "10/01/2026",
            services: ["Duỗi tóc"],
            total: 600000,
            status: "Cancelled",
        },
    ];

    const statusStyles: Record<string, string> = {
        Paid: "bg-green-100 text-green-700",
        Pending: "bg-yellow-100 text-yellow-700",
        Cancelled: "bg-red-100 text-red-700",
    };

    const statusLabels: Record<string, string> = {
        Paid: "Đã thanh toán",
        Pending: "Chờ thanh toán",
        Cancelled: "Đã hủy",
    };

    function formatPrice(price: number) {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }
</script>

<svelte:head>
    <title>Hóa đơn | Salon Pro</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Hóa đơn</h1>
            <p class="text-muted-foreground">Quản lý hóa đơn và thanh toán</p>
        </div>
        <Button class="bg-purple-600 hover:bg-purple-700">
            <Plus class="h-4 w-4 mr-2" />
            Tạo hóa đơn
        </Button>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm hóa đơn..."
                class="pl-9"
            />
        </div>
    </div>

    <!-- Invoices Table -->
    <Card>
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b">
                    <tr>
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Mã hóa đơn</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Khách hàng</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Ngày</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Dịch vụ</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Tổng tiền</th
                        >
                        <th
                            class="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                            >Trạng thái</th
                        >
                    </tr>
                </thead>
                <tbody class="divide-y">
                    {#each invoices as invoice}
                        <tr class="hover:bg-muted/50">
                            <td class="px-4 py-3">
                                <div class="flex items-center gap-2">
                                    <Receipt
                                        class="h-4 w-4 text-muted-foreground"
                                    />
                                    <span class="text-sm font-medium"
                                        >{invoice.id}</span
                                    >
                                </div>
                            </td>
                            <td class="px-4 py-3 text-sm"
                                >{invoice.customerName}</td
                            >
                            <td class="px-4 py-3 text-sm text-muted-foreground"
                                >{invoice.date}</td
                            >
                            <td class="px-4 py-3 text-sm"
                                >{invoice.services.join(", ")}</td
                            >
                            <td class="px-4 py-3 text-sm font-medium"
                                >{formatPrice(invoice.total)}</td
                            >
                            <td class="px-4 py-3">
                                <span
                                    class={cn(
                                        "px-2 py-1 rounded-full text-xs font-medium",
                                        statusStyles[invoice.status],
                                    )}
                                >
                                    {statusLabels[invoice.status]}
                                </span>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </Card>
</div>
