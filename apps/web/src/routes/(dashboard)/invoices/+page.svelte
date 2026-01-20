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

    function formatDate(dateStr: string) {
        if (!dateStr) return "";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    }
</script>

<svelte:head>
    <title>Hóa đơn | SupaSalon</title>
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

    <!-- Invoices Content -->
    <div
        class="rounded-xl border border-gray-100 bg-card text-card-foreground shadow-sm"
    >
        <div
            class="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100"
        >
            <div>
                <h3 class="font-semibold leading-none tracking-tight">
                    Danh sách hóa đơn
                </h3>
                <p class="text-sm text-muted-foreground mt-2">
                    Quản lý {invoices.length} hóa đơn trong hệ thống
                </p>
            </div>
            <div class="relative w-full max-w-sm">
                <Search
                    class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                />
                <Input
                    type="search"
                    placeholder="Tìm kiếm hóa đơn..."
                    class="pl-9 h-9"
                />
            </div>
        </div>
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
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Mã hóa đơn</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Khách hàng</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Ngày</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Dịch vụ</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Tổng tiền</th
                        >
                        <th
                            class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                            >Trạng thái</th
                        >
                        <th
                            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each invoices as invoice}
                        <tr class="hover:bg-muted/50 transition-colors">
                            <td class="p-4 align-middle">
                                <input
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </td>
                            <td class="p-4 align-middle font-medium"
                                >#{invoice.id}</td
                            >
                            <td class="p-4 align-middle">
                                <div class="font-medium">
                                    {invoice.customerName || "Khách vãng lai"}
                                </div>
                                <div
                                    class="text-xs text-muted-foreground mt-0.5"
                                >
                                    SĐT: ---
                                </div>
                            </td>
                            <td class="p-4 align-middle text-muted-foreground">
                                {formatDate(invoice.date)}
                            </td>
                            <td class="p-4 align-middle">
                                {invoice.services.join(", ") || "N/A"}
                            </td>
                            <td class="p-4 align-middle font-medium">
                                {formatPrice(invoice.total)}
                            </td>
                            <td class="p-4 align-middle">
                                <span
                                    class={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                        statusStyles[
                                            invoice.status
                                                .charAt(0)
                                                .toUpperCase() +
                                                invoice.status.slice(1)
                                        ],
                                    )}
                                >
                                    {statusLabels[
                                        invoice.status.charAt(0).toUpperCase() +
                                            invoice.status.slice(1)
                                    ] || invoice.status}
                                </span>
                            </td>
                            <td class="p-4 align-middle text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    class="h-8 w-8 text-muted-foreground"
                                >
                                    <div class="h-4 w-4 rotate-90">...</div>
                                </Button>
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    </div>
</div>
