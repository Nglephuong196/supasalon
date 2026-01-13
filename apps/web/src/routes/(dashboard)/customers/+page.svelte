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
    import * as Dialog from "$lib/components/ui/dialog";
    import { Label } from "$lib/components/ui/label";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "./$types";
    import { toast } from "svelte-sonner";

    let isDialogOpen = $state(false);
    let isLoading = $state(false);

    let { data } = $props();

    const handleSubmit: SubmitFunction = () => {
        isLoading = true;
        return async ({ result, update }) => {
            isLoading = false;
            if (result.type === "success") {
                isDialogOpen = false;
                toast.success("Khách hàng đã được tạo thành công");
                await update();
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại");
            }
        };
    };

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
    <title>Khách hàng | SupaSalon</title>
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
        <Dialog.Root bind:open={isDialogOpen}>
            <Dialog.Trigger>
                <Button class="btn-gradient shadow-lg shadow-purple-200">
                    <Plus class="h-4 w-4 mr-2" />
                    Thêm khách hàng
                </Button>
            </Dialog.Trigger>
            <Dialog.Content class="sm:max-w-[425px]">
                <form
                    method="POST"
                    action="?/createCustomer"
                    use:enhance={handleSubmit}
                >
                    <Dialog.Header>
                        <Dialog.Title>Thêm khách hàng mới</Dialog.Title>
                        <Dialog.Description>
                            Nhập thông tin khách hàng mới vào bên dưới. Nhấn lưu
                            để hoàn tất.
                        </Dialog.Description>
                    </Dialog.Header>
                    <div class="grid gap-4 py-4">
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="name" class="text-right">Tên</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Nguyễn Văn A"
                                class="col-span-3"
                                required
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="phone" class="text-right">SĐT</Label>
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="0901234567"
                                class="col-span-3"
                                required
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="email" class="text-right">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="example@gmail.com (tùy chọn)"
                                class="col-span-3"
                            />
                        </div>
                        <div class="grid grid-cols-4 items-center gap-4">
                            <Label for="notes" class="text-right">Ghi chú</Label
                            >
                            <Input
                                id="notes"
                                name="notes"
                                placeholder="Ghi chú về khách hàng (tùy chọn)"
                                class="col-span-3"
                            />
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Đang lưu..." : "Lưu khách hàng"}
                        </Button>
                    </Dialog.Footer>
                </form>
            </Dialog.Content>
        </Dialog.Root>
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
        {#each data.customers as customer, index}
            <Card
                class="p-5 border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden relative"
            >
                <!-- VIP ribbon (Mock logic for now) -->
                {#if false}
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
                                <span>{customer.phone || "N/A"}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm text-gray-500 group/item hover:text-purple-600 transition-colors"
                            >
                                <Mail class="h-4 w-4" />
                                <span class="truncate"
                                    >{customer.email || "N/A"}</span
                                >
                            </div>
                        </div>

                        <!-- Stats bar (Mock data for display) -->
                        <div
                            class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100"
                        >
                            <div class="flex items-center gap-1.5">
                                <Calendar class="h-3.5 w-3.5 text-gray-400" />
                                <span class="text-xs text-gray-500">0 lần</span>
                            </div>
                            <div class="text-xs text-gray-400">•</div>
                            <span class="text-xs text-gray-500"
                                >Lần cuối: -</span
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
