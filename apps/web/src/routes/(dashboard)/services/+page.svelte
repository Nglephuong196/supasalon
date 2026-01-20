<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import {
        Plus,
        Search,
        MoreVertical,
        Clock,
        Pencil,
        Trash2,
        Layers,
        Sparkles,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { toast } from "svelte-sonner";
    import { Label } from "$lib/components/ui/label";
    import { enhance } from "$app/forms";
    import type { PageData } from "./$types";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";

    // Props
    let { data } = $props<{ data: PageData }>();

    // State
    let searchQuery = $state("");
    let selectedCategoryId = $state<number | null>(null); // null means "All"

    // Dialog States
    let isCategoryDialogOpen = $state(false);
    let isServiceDialogOpen = $state(false);
    let isDeleteDialogOpen = $state(false);

    // Editing State
    let editingCategory = $state<any>(null);
    let editingService = $state<any>(null);

    // Deletion State
    let deleteType = $state<"category" | "service">("service");
    let itemToDelete = $state<any>(null);

    // Derived
    let filteredServices = $derived(
        data.services.filter((s) => {
            const matchesCategory =
                selectedCategoryId === null ||
                s.categoryId === selectedCategoryId;
            const matchesSearch = s.name
                .toLowerCase()
                .includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        }),
    );

    // Helpers
    function formatPrice(price: number) {
        return new Intl.NumberFormat("vi-VN").format(price) + "đ";
    }

    function getCategoryName(id: number) {
        return data.categories.find((c) => c.id === id)?.name || "Unknown";
    }

    // Handlers
    function openCreateCategory() {
        editingCategory = null;
        isCategoryDialogOpen = true;
    }

    function openEditCategory(category: any, e: Event) {
        e.stopPropagation();
        editingCategory = category;
        isCategoryDialogOpen = true;
    }

    function openCreateService() {
        editingService = null;
        // Default category if one is selected
        if (selectedCategoryId) {
            editingService = { categoryId: selectedCategoryId };
        }
        isServiceDialogOpen = true;
    }

    function openEditService(service: any) {
        editingService = service;
        isServiceDialogOpen = true;
    }

    function openDeleteCategory(category: any, e: Event) {
        e.stopPropagation();
        deleteType = "category";
        itemToDelete = category;
        isDeleteDialogOpen = true;
    }

    function openDeleteService(service: any) {
        deleteType = "service";
        itemToDelete = service;
        isDeleteDialogOpen = true;
    }

    // Form Enhancement
    function handleFormSubmit() {
        return async ({ result, update }: any) => {
            if (result.type === "success") {
                toast.success(
                    editingCategory || editingService
                        ? "Cập nhật thành công!"
                        : "Tạo mới thành công!",
                );
                isCategoryDialogOpen = false;
                isServiceDialogOpen = false;
                isDeleteDialogOpen = false;
            } else if (result.type === "failure") {
                toast.error(result.data?.message || "Có lỗi xảy ra");
            }
            await update();
        };
    }

    function handleDeleteSubmit() {
        return async ({ result, update }: any) => {
            if (result.type === "success") {
                toast.success("Xóa thành công!");
                if (
                    deleteType === "category" &&
                    selectedCategoryId === itemToDelete.id
                ) {
                    selectedCategoryId = null;
                }
                isDeleteDialogOpen = false;
            } else if (result.type === "failure") {
                toast.error(result.data?.message || "Có lỗi xảy ra");
            }
            await update();
        };
    }
</script>

<svelte:head>
    <title>Dịch vụ | SupaSalon</title>
</svelte:head>

<div class="h-[calc(100vh-6rem)] flex flex-col gap-4">
    <!-- Header -->
    <div class="flex items-center justify-between flex-none">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
                Quản lý dịch vụ
            </h1>
            <p class="text-muted-foreground">
                Quản lý danh mục và các dịch vụ của bạn
            </p>
        </div>
        <div class="flex gap-2">
            <!-- Mobile Toggle for categories could go here -->
        </div>
    </div>

    <!-- Main Content Split View -->
    <div class="flex-1 flex gap-6 min-h-0">
        <!-- Sidebar: Categories -->
        <div
            class="w-64 flex-none flex flex-col gap-4 bg-white rounded-xl border border-border/60 shadow-sm p-4 overflow-hidden"
        >
            <div class="flex items-center justify-between flex-none">
                <h2
                    class="font-semibold text-foreground flex items-center gap-2"
                >
                    <Layers class="h-4 w-4 text-primary" />
                    Danh mục
                </h2>
                <Button
                    variant="ghost"
                    size="icon"
                    class="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onclick={openCreateCategory}
                >
                    <Plus class="h-4 w-4" />
                </Button>
            </div>

            <div class="flex-1 overflow-y-auto space-y-1 pr-2">
                <button
                    class={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
                        selectedCategoryId === null
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                    onclick={() => (selectedCategoryId = null)}
                >
                    <Sparkles class="h-4 w-4" />
                    <span class="flex-1">Tất cả dịch vụ</span>
                    <span
                        class={cn(
                            "text-xs py-0.5 px-2 rounded-full",
                            selectedCategoryId === null
                                ? "bg-white/20"
                                : "bg-gray-200 text-gray-600",
                        )}
                    >
                        {data.services.length}
                    </span>
                </button>

                {#each data.categories as category}
                    <div class="group relative">
                        <button
                            class={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left pr-8",
                                selectedCategoryId === category.id
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
                            )}
                            onclick={() => (selectedCategoryId = category.id)}
                        >
                            <span class="truncate flex-1">{category.name}</span>
                            {#if selectedCategoryId === category.id}
                                <span
                                    class="h-1.5 w-1.5 rounded-full bg-primary absolute left-1 top-1/2 -translate-y-1/2"
                                ></span>
                            {/if}
                        </button>

                        <!-- Hover Actions for Category -->
                        <div
                            class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity z-10"
                        >
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger
                                    class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground"
                                >
                                    <MoreVertical class="h-3.5 w-3.5" />
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Content align="start">
                                    <DropdownMenu.Item
                                        onclick={(e) =>
                                            openEditCategory(category, e)}
                                    >
                                        <Pencil class="h-3 w-3 mr-2" />
                                        Sửa tên
                                    </DropdownMenu.Item>
                                    <DropdownMenu.Item
                                        class="text-red-600"
                                        onclick={(e) =>
                                            openDeleteCategory(category, e)}
                                    >
                                        <Trash2 class="h-3 w-3 mr-2" />
                                        Xóa danh mục
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Root>
                        </div>
                    </div>
                {/each}

                {#if data.categories.length === 0}
                    <div
                        class="text-center py-8 px-4 text-xs text-muted-foreground border-2 border-dashed border-gray-100 rounded-lg"
                    >
                        Chưa có danh mục nào. <br />
                        Nhấn dấu + để thêm.
                    </div>
                {/if}
            </div>
        </div>

        <!-- Main Area: Services -->
        <div class="flex-1 flex flex-col gap-4 min-h-0">
            <!-- Toolbar -->
            <div
                class="flex items-center gap-4 bg-white p-2 rounded-xl border border-border/60 shadow-sm flex-none"
            >
                <div class="relative flex-1">
                    <Search
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        bind:value={searchQuery}
                        placeholder="Tìm kiếm dịch vụ..."
                        class="pl-10 border-0 bg-transparent focus-visible:ring-0 shadow-none"
                    />
                </div>
                <Button onclick={openCreateService} class="shadow-sm">
                    <Plus class="h-4 w-4 mr-2" />
                    Thêm dịch vụ
                </Button>
            </div>

            <!-- Service Grid/List -->
            <div class="flex-1 overflow-y-auto pr-2">
                {#if filteredServices.length === 0}
                    <div
                        class="h-full flex flex-col items-center justify-center text-muted-foreground p-8"
                    >
                        <div
                            class="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"
                        >
                            <Layers class="h-8 w-8 text-gray-300" />
                        </div>
                        <p class="font-medium">Không tìm thấy dịch vụ nào</p>
                        <p class="text-sm mt-1">
                            Thử thêm dịch vụ mới hoặc thay đổi bộ lọc
                        </p>
                    </div>
                {:else}
                    <div
                        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10"
                    >
                        {#each filteredServices as service (service.id)}
                            <div
                                class="group relative bg-white border border-border/60 hover:border-primary/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all"
                            >
                                <div
                                    class="flex justify-between items-start mb-2"
                                >
                                    <div
                                        class="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                    >
                                        {getCategoryName(service.categoryId)}
                                    </div>
                                    <DropdownMenu.Root>
                                        <DropdownMenu.Trigger
                                            class="h-6 w-6 flex items-center justify-center rounded-md hover:bg-gray-100 text-muted-foreground"
                                        >
                                            <MoreVertical class="h-3.5 w-3.5" />
                                        </DropdownMenu.Trigger>
                                        <DropdownMenu.Content align="end">
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    openEditService(service)}
                                            >
                                                Chỉnh sửa
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                class="text-red-600"
                                                onclick={() =>
                                                    openDeleteService(service)}
                                            >
                                                Xóa dịch vụ
                                            </DropdownMenu.Item>
                                        </DropdownMenu.Content>
                                    </DropdownMenu.Root>
                                </div>
                                <h3 class="font-semibold text-foreground mb-1">
                                    {service.name}
                                </h3>
                                <p class="text-2xl font-bold text-primary mb-3">
                                    {formatPrice(service.price)}
                                </p>
                                <div
                                    class="flex items-center text-xs text-muted-foreground gap-1"
                                >
                                    <Clock class="h-3 w-3" />
                                    <span>{service.duration} phút</span>
                                </div>
                                {#if service.description}
                                    <p
                                        class="text-xs text-gray-500 mt-3 line-clamp-2 border-t pt-2 border-gray-100"
                                    >
                                        {service.description}
                                    </p>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        </div>
    </div>
</div>

<!-- Category Dialog -->
<Dialog.Root bind:open={isCategoryDialogOpen}>
    <Dialog.Content class="sm:max-w-[400px]">
        <Dialog.Header>
            <Dialog.Title
                >{editingCategory
                    ? "Sửa danh mục"
                    : "Thêm danh mục"}</Dialog.Title
            >
        </Dialog.Header>
        <form
            action={editingCategory ? "?/updateCategory" : "?/createCategory"}
            method="POST"
            use:enhance={handleFormSubmit}
        >
            {#if editingCategory}
                <input type="hidden" name="id" value={editingCategory.id} />
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="cat-name">Tên danh mục</Label>
                    <Input
                        id="cat-name"
                        name="name"
                        value={editingCategory?.name || ""}
                        placeholder="Ví dụ: Cắt tóc"
                        required
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isCategoryDialogOpen = false)}>Hủy</Button
                >
                <Button type="submit">Lưu</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Service Dialog -->
<Dialog.Root bind:open={isServiceDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title
                >{editingService ? "Sửa dịch vụ" : "Thêm dịch vụ"}</Dialog.Title
            >
        </Dialog.Header>
        <form
            action={editingService ? "?/updateService" : "?/createService"}
            method="POST"
            use:enhance={handleFormSubmit}
        >
            {#if editingService?.id}
                <input type="hidden" name="id" value={editingService.id} />
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="svc-name">Tên dịch vụ</Label>
                    <Input
                        id="svc-name"
                        name="name"
                        value={editingService?.name || ""}
                        placeholder="Ví dụ: Cắt tóc nam"
                        required
                    />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="svc-price">Giá (VNĐ)</Label>
                        <Input
                            id="svc-price"
                            name="price"
                            type="number"
                            value={editingService?.price || 0}
                            required
                        />
                    </div>
                    <div class="grid gap-2">
                        <Label for="svc-duration">Thời gian (phút)</Label>
                        <Input
                            id="svc-duration"
                            name="duration"
                            type="number"
                            value={editingService?.duration || 30}
                            required
                        />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label for="svc-category">Danh mục</Label>
                    <select
                        id="svc-category"
                        name="categoryId"
                        class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={editingService?.categoryId || ""}
                        required
                    >
                        <option value="" disabled>Chọn danh mục</option>
                        {#each data.categories as cat}
                            <option value={cat.id}>{cat.name}</option>
                        {/each}
                    </select>
                </div>
                <div class="grid gap-2">
                    <Label for="svc-desc">Mô tả (tùy chọn)</Label>
                    <Input
                        id="svc-desc"
                        name="description"
                        value={editingService?.description || ""}
                        placeholder="Mô tả kỹ hơn về dịch vụ..."
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isServiceDialogOpen = false)}>Hủy</Button
                >
                <Button type="submit">Lưu dịch vụ</Button>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Bạn có chắc chắn muốn xóa?</AlertDialog.Title>
            <AlertDialog.Description>
                Hành động này không thể hoàn tác.
                {#if deleteType === "category"}
                    Cảnh báo: Xóa danh mục có thể ảnh hưởng đến các dịch vụ
                    trong danh mục đó.
                {:else}
                    Dịch vụ sẽ bị xóa vĩnh viễn.
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <form
            action={deleteType === "category"
                ? "?/deleteCategory"
                : "?/deleteService"}
            method="POST"
            use:enhance={handleDeleteSubmit}
        >
            <input type="hidden" name="id" value={itemToDelete?.id} />
            <AlertDialog.Footer>
                <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}
                    >Hủy bỏ</AlertDialog.Cancel
                >
                <Button type="submit" variant="destructive">Xóa</Button>
            </AlertDialog.Footer>
        </form>
    </AlertDialog.Content>
</AlertDialog.Root>
