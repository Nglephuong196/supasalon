<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        Plus,
        Search,
        Phone,
        Mail,
        Crown,
        Calendar,
        ChevronRight,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";

    // Mock data
    const customers = [
        {
            id: "1",
            name: "Nguyễn Văn A",
            phone: "0901234567",
            email: "nguyenvana@gmail.com",
            visits: 15,
            lastVisit: "10/01/2026",
            isVip: true,
        },
        {
            id: "2",
            name: "Trần Thị B",
            phone: "0912345678",
            email: "tranthib@gmail.com",
            visits: 8,
            lastVisit: "08/01/2026",
            isVip: false,
        },
        {
            id: "3",
            name: "Lê Văn C",
            phone: "0923456789",
            email: "levanc@gmail.com",
            visits: 22,
            lastVisit: "12/01/2026",
            isVip: true,
        },
        {
            id: "4",
            name: "Phạm Thị D",
            phone: "0934567890",
            email: "phamthid@gmail.com",
            visits: 5,
            lastVisit: "05/01/2026",
            isVip: false,
        },
        {
            id: "5",
            name: "Hoàng Văn E",
            phone: "0945678901",
            email: "hoangvane@gmail.com",
            visits: 12,
            lastVisit: "11/01/2026",
            isVip: false,
        },
        {
            id: "6",
            name: "Võ Thị F",
            phone: "0956789012",
            email: "vothif@gmail.com",
            visits: 18,
            lastVisit: "09/01/2026",
            isVip: true,
        },
    ];

    function getAvatarGradient(index: number) {
        const gradients = [
            "from-purple-500 to-indigo-500",
            "from-pink-500 to-rose-500",
            "from-blue-500 to-cyan-500",
            "from-green-500 to-emerald-500",
            "from-orange-500 to-amber-500",
            "from-violet-500 to-purple-500",
        ];
        return gradients[index % gradients.length];
    }
</script>

<svelte:head>
    <title>Khách hàng | Salon Pro</title>
</svelte:head>

<div class="flex flex-col gap-6">
    <!-- Header -->
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-gray-900">
                Khách hàng
            </h1>
            <p class="text-gray-500 mt-1">
                Quản lý thông tin khách hàng của bạn
            </p>
        </div>
        <Button class="btn-gradient shadow-lg shadow-purple-200">
            <Plus class="h-4 w-4 mr-2" />
            Thêm khách hàng
        </Button>
    </div>

    <!-- Search and filters -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div class="relative flex-1 max-w-md w-full">
            <Search
                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm khách hàng..."
                class="pl-10 bg-white border-gray-200 rounded-xl focus:border-purple-300 focus:ring-purple-100"
            />
        </div>
        <div class="flex gap-2">
            <button
                class="px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white"
                >Tất cả</button
            >
            <button
                class="px-4 py-2 text-sm font-medium rounded-xl bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 flex items-center gap-1.5"
            >
                <Crown class="h-3.5 w-3.5 text-amber-500" />
                VIP
            </button>
        </div>
    </div>

    <!-- Customers Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each customers as customer, index}
            <Card
                class="p-5 border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
                <!-- VIP ribbon -->
                {#if customer.isVip}
                    <div class="absolute top-3 right-3">
                        <div
                            class="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        >
                            <Crown class="h-3 w-3 text-white" />
                            <span class="text-xs font-semibold text-white"
                                >VIP</span
                            >
                        </div>
                    </div>
                {/if}

                <div class="flex items-start gap-4">
                    <div
                        class={cn(
                            "h-14 w-14 rounded-2xl bg-gradient-to-br text-white flex items-center justify-center text-lg font-bold shrink-0 shadow-lg group-hover:scale-105 transition-transform duration-300",
                            getAvatarGradient(index),
                        )}
                    >
                        {customer.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)}
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3
                            class="font-semibold text-gray-900 truncate text-lg"
                        >
                            {customer.name}
                        </h3>
                        <div class="space-y-2 mt-3">
                            <div
                                class="flex items-center gap-2 text-sm text-gray-500 group/item hover:text-purple-600 transition-colors"
                            >
                                <Phone class="h-4 w-4" />
                                <span>{customer.phone}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm text-gray-500 group/item hover:text-purple-600 transition-colors"
                            >
                                <Mail class="h-4 w-4" />
                                <span class="truncate">{customer.email}</span>
                            </div>
                        </div>

                        <!-- Stats bar -->
                        <div
                            class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100"
                        >
                            <div class="flex items-center gap-1.5">
                                <Calendar class="h-3.5 w-3.5 text-gray-400" />
                                <span class="text-xs text-gray-500"
                                    >{customer.visits} lần</span
                                >
                            </div>
                            <div class="text-xs text-gray-400">•</div>
                            <span class="text-xs text-gray-500"
                                >Lần cuối: {customer.lastVisit}</span
                            >
                        </div>
                    </div>
                </div>

                <!-- Hover action -->
                <div
                    class="absolute bottom-0 left-0 right-0 h-0 group-hover:h-12 bg-gradient-to-t from-purple-600 to-purple-500 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                >
                    <span
                        class="text-white text-sm font-medium flex items-center gap-1"
                    >
                        Xem chi tiết
                        <ChevronRight class="h-4 w-4" />
                    </span>
                </div>
            </Card>
        {/each}
    </div>
</div>
