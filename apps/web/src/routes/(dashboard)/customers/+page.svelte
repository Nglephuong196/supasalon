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
        Pencil,
        Trash2,
        MapPin,
        Wallet,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Label } from "$lib/components/ui/label";
    import { enhance } from "$app/forms";
    import type { SubmitFunction } from "./$types";
    import { toast } from "svelte-sonner";
    import type { Customer } from "$lib/types";

    let isCreateDialogOpen = $state(false);
    let isEditDialogOpen = $state(false);
    let isDeleteDialogOpen = $state(false);
    let isLoading = $state(false);
    let selectedCustomer = $state<Customer | null>(null);

    let { data } = $props();

    // Form data for create
    let createFormData = $state({
        name: "",
        phone: "",
        email: "",
        notes: "",
        gender: "",
        location: "",
    });

    // Form data for edit
    let editFormData = $state({
        id: 0,
        name: "",
        phone: "",
        email: "",
        notes: "",
        gender: "",
        location: "",
    });

    const handleCreateSubmit: SubmitFunction = () => {
        isLoading = true;
        return async ({ result, update }) => {
            isLoading = false;
            if (result.type === "success") {
                isCreateDialogOpen = false;
                createFormData = {
                    name: "",
                    phone: "",
                    email: "",
                    notes: "",
                    gender: "",
                    location: "",
                };
                toast.success("Khách hàng đã được tạo thành công");
                await update();
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại");
            }
        };
    };

    const handleEditSubmit: SubmitFunction = () => {
        isLoading = true;
        return async ({ result, update }) => {
            isLoading = false;
            if (result.type === "success") {
                isEditDialogOpen = false;
                selectedCustomer = null;
                toast.success("Khách hàng đã được cập nhật thành công");
                await update();
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại");
            }
        };
    };

    const handleDeleteSubmit: SubmitFunction = () => {
        isLoading = true;
        return async ({ result, update }) => {
            isLoading = false;
            if (result.type === "success") {
                isDeleteDialogOpen = false;
                selectedCustomer = null;
                toast.success("Khách hàng đã được xóa thành công");
                await update();
            } else {
                toast.error("Có lỗi xảy ra, vui lòng thử lại");
            }
        };
    };

    function openEditDialog(customer: Customer) {
        selectedCustomer = customer;
        editFormData = {
            id: customer.id,
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            notes: customer.notes || "",
            gender: customer.gender || "",
            location: customer.location || "",
        };
        isEditDialogOpen = true;
    }

    function openDeleteDialog(customer: Customer) {
        selectedCustomer = customer;
        isDeleteDialogOpen = true;
    }

    function formatCurrency(amount: number) {
        return new Intl.NumberFormat("vi-VN").format(amount);
    }

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
        {#if data.canCreate}
            <Button
                onclick={() => (isCreateDialogOpen = true)}
                class="btn-gradient shadow-lg shadow-purple-200"
            >
                <Plus class="h-4 w-4 mr-2" />
                Thêm khách hàng
            </Button>
        {/if}
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
                class="p-5 border-0 shadow-sm bg-white hover:shadow-lg transition-all duration-300 group overflow-hidden relative"
            >
                <!-- Tier Badge -->
                {#if customer.membershipTier}
                    <div class="absolute top-3 right-3">
                        <div
                            class="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
                        >
                            <Crown class="h-3 w-3 text-white" />
                            <span class="text-xs font-semibold text-white"
                                >{customer.membershipTier.name}</span
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
                                class="flex items-center gap-2 text-sm text-gray-500"
                            >
                                <Phone class="h-4 w-4" />
                                <span>{customer.phone || "N/A"}</span>
                            </div>
                            <div
                                class="flex items-center gap-2 text-sm text-gray-500"
                            >
                                <Mail class="h-4 w-4" />
                                <span class="truncate"
                                    >{customer.email || "N/A"}</span
                                >
                            </div>
                            {#if customer.location}
                                <div
                                    class="flex items-center gap-2 text-sm text-gray-500"
                                >
                                    <MapPin class="h-4 w-4" />
                                    <span class="truncate"
                                        >{customer.location}</span
                                    >
                                </div>
                            {/if}
                        </div>

                        <!-- Stats bar -->
                        <div
                            class="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100"
                        >
                            <div class="flex items-center gap-1.5">
                                <Wallet class="h-3.5 w-3.5 text-gray-400" />
                                <span class="text-xs text-gray-500"
                                    >{formatCurrency(
                                        customer.totalSpent || 0,
                                    )}đ</span
                                >
                            </div>
                            {#if customer.gender}
                                <div class="text-xs text-gray-400">•</div>
                                <span class="text-xs text-gray-500"
                                    >{customer.gender === "male"
                                        ? "Nam"
                                        : customer.gender === "female"
                                          ? "Nữ"
                                          : "Khác"}</span
                                >
                            {/if}
                        </div>
                    </div>
                </div>

                <!-- Action Buttons -->
                {#if data.canUpdate || data.canDelete}
                    <div
                        class="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        class:hidden={customer.membershipTier}
                    >
                        {#if data.canUpdate}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 bg-white/90 hover:bg-blue-500 hover:text-white shadow-sm"
                                onclick={() => openEditDialog(customer)}
                            >
                                <Pencil class="h-4 w-4" />
                            </Button>
                        {/if}
                        {#if data.canDelete}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 bg-white/90 hover:bg-red-500 hover:text-white shadow-sm"
                                onclick={() => openDeleteDialog(customer)}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        {/if}
                    </div>
                {/if}

                <!-- Also show buttons when there's a tier badge -->
                {#if customer.membershipTier && (data.canUpdate || data.canDelete)}
                    <div
                        class="absolute bottom-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        {#if data.canUpdate}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 bg-white/90 hover:bg-blue-500 hover:text-white shadow-sm"
                                onclick={() => openEditDialog(customer)}
                            >
                                <Pencil class="h-4 w-4" />
                            </Button>
                        {/if}
                        {#if data.canDelete}
                            <Button
                                variant="ghost"
                                size="icon"
                                class="h-8 w-8 bg-white/90 hover:bg-red-500 hover:text-white shadow-sm"
                                onclick={() => openDeleteDialog(customer)}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        {/if}
                    </div>
                {/if}
            </Card>
        {/each}
    </div>

    {#if data.customers.length === 0}
        <div class="text-center py-12">
            <p class="text-gray-500">
                Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên!
            </p>
        </div>
    {/if}
</div>

<!-- Create Dialog -->
<Dialog.Root bind:open={isCreateDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <form
            method="POST"
            action="?/createCustomer"
            use:enhance={handleCreateSubmit}
        >
            <Dialog.Header>
                <Dialog.Title>Thêm khách hàng mới</Dialog.Title>
                <Dialog.Description>
                    Nhập thông tin khách hàng mới vào bên dưới. Nhấn lưu để hoàn
                    tất.
                </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="name" class="text-right">Tên *</Label>
                    <Input
                        id="name"
                        name="name"
                        bind:value={createFormData.name}
                        placeholder="Nguyễn Văn A"
                        class="col-span-3"
                        required
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="phone" class="text-right">SĐT *</Label>
                    <Input
                        id="phone"
                        name="phone"
                        bind:value={createFormData.phone}
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
                        bind:value={createFormData.email}
                        placeholder="example@gmail.com"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="gender" class="text-right">Giới tính</Label>
                    <select
                        id="gender"
                        name="gender"
                        bind:value={createFormData.gender}
                        class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="location" class="text-right">Địa chỉ</Label>
                    <Input
                        id="location"
                        name="location"
                        bind:value={createFormData.location}
                        placeholder="123 Đường ABC, Quận 1"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="notes" class="text-right">Ghi chú</Label>
                    <Input
                        id="notes"
                        name="notes"
                        bind:value={createFormData.notes}
                        placeholder="Ghi chú về khách hàng"
                        class="col-span-3"
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isCreateDialogOpen = false)}
                >
                    Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang lưu..." : "Lưu khách hàng"}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Edit Dialog -->
<Dialog.Root bind:open={isEditDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <form
            method="POST"
            action="?/updateCustomer"
            use:enhance={handleEditSubmit}
        >
            <input type="hidden" name="id" value={editFormData.id} />
            <Dialog.Header>
                <Dialog.Title>Chỉnh sửa khách hàng</Dialog.Title>
                <Dialog.Description>
                    Cập nhật thông tin khách hàng. Nhấn lưu để hoàn tất.
                </Dialog.Description>
            </Dialog.Header>
            <div class="grid gap-4 py-4">
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-name" class="text-right">Tên *</Label>
                    <Input
                        id="edit-name"
                        name="name"
                        bind:value={editFormData.name}
                        placeholder="Nguyễn Văn A"
                        class="col-span-3"
                        required
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-phone" class="text-right">SĐT *</Label>
                    <Input
                        id="edit-phone"
                        name="phone"
                        bind:value={editFormData.phone}
                        placeholder="0901234567"
                        class="col-span-3"
                        required
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-email" class="text-right">Email</Label>
                    <Input
                        id="edit-email"
                        name="email"
                        type="email"
                        bind:value={editFormData.email}
                        placeholder="example@gmail.com"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-gender" class="text-right">Giới tính</Label
                    >
                    <select
                        id="edit-gender"
                        name="gender"
                        bind:value={editFormData.gender}
                        class="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                    </select>
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-location" class="text-right">Địa chỉ</Label
                    >
                    <Input
                        id="edit-location"
                        name="location"
                        bind:value={editFormData.location}
                        placeholder="123 Đường ABC, Quận 1"
                        class="col-span-3"
                    />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                    <Label for="edit-notes" class="text-right">Ghi chú</Label>
                    <Input
                        id="edit-notes"
                        name="notes"
                        bind:value={editFormData.notes}
                        placeholder="Ghi chú về khách hàng"
                        class="col-span-3"
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isEditDialogOpen = false)}
                >
                    Hủy
                </Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Đang lưu..." : "Cập nhật"}
                </Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Xác nhận xóa khách hàng?</AlertDialog.Title>
            <AlertDialog.Description>
                Bạn có chắc chắn muốn xóa khách hàng <strong
                    >{selectedCustomer?.name}</strong
                >? Hành động này không thể hoàn tác.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}>
                Hủy bỏ
            </AlertDialog.Cancel>
            <form
                method="POST"
                action="?/deleteCustomer"
                use:enhance={handleDeleteSubmit}
                class="inline"
            >
                <input type="hidden" name="id" value={selectedCustomer?.id} />
                <Button
                    type="submit"
                    disabled={isLoading}
                    class="bg-red-600 text-white hover:bg-red-700"
                >
                    {isLoading ? "Đang xóa..." : "Xóa khách hàng"}
                </Button>
            </form>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
