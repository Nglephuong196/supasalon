<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import {
        Plus,
        Search,
        MoreVertical,
        Package,
        Pencil,
        Trash2,
        Layers,
        Box,
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
    let selectedCategoryId = $state<number | null>(null);

    // Dialog States
    let isCategoryDialogOpen = $state(false);
    let isProductDialogOpen = $state(false);
    let isDeleteDialogOpen = $state(false);

    // Editing State
    let editingCategory = $state<any>(null);
    let editingProduct = $state<any>(null);

    // Deletion State
    let deleteType = $state<"category" | "product">("product");
    let itemToDelete = $state<any>(null);

    // Form Validation Errors
    let catNameError = $state("");
    let prodNameError = $state("");
    let prodPriceError = $state("");
    let prodCategoryError = $state("");

    function resetErrors() {
        catNameError = "";
        prodNameError = "";
        prodPriceError = "";
        prodCategoryError = "";
    }

    // Derived
    let filteredProducts = $derived(
        data.products.filter((p: any) => {
            const matchesCategory =
                selectedCategoryId === null ||
                p.categoryId === selectedCategoryId;
            const matchesSearch = p.name
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
        return data.categories.find((c: any) => c.id === id)?.name || "Unknown";
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

    function openCreateProduct() {
        editingProduct = null;
        if (selectedCategoryId) {
            editingProduct = { categoryId: selectedCategoryId };
        }
        isProductDialogOpen = true;
    }

    function openEditProduct(product: any) {
        editingProduct = product;
        isProductDialogOpen = true;
    }

    function openDeleteCategory(category: any, e: Event) {
        e.stopPropagation();
        deleteType = "category";
        itemToDelete = category;
        isDeleteDialogOpen = true;
    }

    function openDeleteProduct(product: any) {
        deleteType = "product";
        itemToDelete = product;
        isDeleteDialogOpen = true;
    }

    // Form Enhancement
    function handleFormSubmit() {
        return async ({ result, update }: any) => {
            if (result.type === "success") {
                toast.success(
                    editingCategory?.id || editingProduct?.id
                        ? "Cập nhật thành công!"
                        : "Tạo mới thành công!",
                );
                isCategoryDialogOpen = false;
                isProductDialogOpen = false;
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
    <title>Sản phẩm | SupaSalon</title>
</svelte:head>

<div class="h-[calc(100vh-6rem)] flex flex-col gap-4">
    <!-- Page Header -->
    <div class="flex items-center justify-between flex-none">
        <div>
            <h1 class="text-2xl font-bold tracking-tight text-foreground">
                Quản lý sản phẩm
            </h1>
            <p class="text-muted-foreground">
                Quản lý danh mục và sản phẩm bán tại salon
            </p>
        </div>
    </div>

    <!-- Main Content Split View -->
    <div class="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">
        <!-- Mobile Category Filter (visible only on mobile) -->
        <div class="md:hidden flex-none">
            <div
                class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
            >
                <button
                    class={cn(
                        "flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                        selectedCategoryId === null
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-white border border-border text-muted-foreground hover:bg-gray-50",
                    )}
                    onclick={() => (selectedCategoryId = null)}
                >
                    Tất cả ({data.products.length})
                </button>
                {#each data.categories as category}
                    <button
                        class={cn(
                            "flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                            selectedCategoryId === category.id
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-white border border-border text-muted-foreground hover:bg-gray-50",
                        )}
                        onclick={() => (selectedCategoryId = category.id)}
                    >
                        {category.name}
                    </button>
                {/each}
                <Button
                    variant="outline"
                    size="sm"
                    class="flex-none rounded-full h-8"
                    onclick={openCreateCategory}
                >
                    <Plus class="h-3 w-3 mr-1" />
                    Thêm
                </Button>
            </div>
        </div>

        <!-- Sidebar: Categories (hidden on mobile) -->
        <div
            class="hidden md:flex w-64 flex-none flex-col gap-4 bg-white rounded-xl border border-border/60 shadow-sm p-4 overflow-hidden"
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
                    <Box class="h-4 w-4" />
                    <span class="flex-1">Tất cả sản phẩm</span>
                    <span
                        class={cn(
                            "text-xs py-0.5 px-2 rounded-full",
                            selectedCategoryId === null
                                ? "bg-white/20"
                                : "bg-gray-200 text-gray-600",
                        )}
                    >
                        {data.products.length}
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
                                <DropdownMenu.Content
                                    align="start"
                                    class="border-gray-100 shadow-sm"
                                >
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

        <!-- Main Area: Product Table -->
        <div class="flex-1 min-w-0">
            <div
                class="rounded-xl border border-gray-100 bg-card text-card-foreground shadow-sm h-full flex flex-col"
            >
                <div
                    class="p-4 flex items-center justify-between gap-4 border-b border-gray-100 flex-none"
                >
                    <div>
                        <h3
                            class="font-semibold leading-none tracking-tight hidden sm:block"
                        >
                            Danh sách
                        </h3>
                        <div class="sm:hidden text-sm font-medium">
                            Sản phẩm
                        </div>
                    </div>

                    <div
                        class="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end"
                    >
                        <div class="relative max-w-xs w-full sm:w-64">
                            <Search
                                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                type="search"
                                placeholder="Tìm kiếm sản phẩm..."
                                class="pl-9 h-9"
                                bind:value={searchQuery}
                            />
                        </div>

                        <Button
                            onclick={openCreateProduct}
                            class="bg-purple-600 hover:bg-purple-700 h-9 shrink-0"
                        >
                            <Plus class="h-4 w-4 sm:mr-2" />
                            <span class="hidden sm:inline">Thêm</span>
                        </Button>
                    </div>
                </div>

                <div class="flex-1 overflow-auto">
                    <table class="w-full text-sm">
                        <thead
                            class="border-b border-gray-100 bg-muted/40 sticky top-0 bg-white"
                        >
                            <tr>
                                <th class="h-12 w-[50px] px-4 align-middle">
                                    <input
                                        type="checkbox"
                                        class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </th>
                                <th
                                    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                                    >Tên sản phẩm</th
                                >
                                <th
                                    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                                    >Danh mục</th
                                >
                                <th
                                    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                                    >Giá</th
                                >
                                <th
                                    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                                    >Tồn kho</th
                                >
                                <th
                                    class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                                    >SKU</th
                                >
                                <th
                                    class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                                ></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100">
                            {#each filteredProducts as product (product.id)}
                                <tr class="hover:bg-muted/50 transition-colors">
                                    <td class="p-4 align-middle">
                                        <input
                                            type="checkbox"
                                            class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td class="p-4 align-middle font-medium">
                                        {product.name}
                                    </td>
                                    <td class="p-4 align-middle">
                                        <span
                                            class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700"
                                        >
                                            {getCategoryName(
                                                product.categoryId,
                                            )}
                                        </span>
                                    </td>
                                    <td
                                        class="p-4 align-middle font-medium text-purple-700"
                                    >
                                        {formatPrice(product.price)}
                                    </td>
                                    <td
                                        class="p-4 align-middle text-muted-foreground"
                                    >
                                        <div class="flex items-center gap-1">
                                            <Package class="h-3 w-3" />
                                            {product.stock}
                                        </div>
                                    </td>
                                    <td
                                        class="p-4 align-middle text-muted-foreground"
                                    >
                                        {product.sku || "---"}
                                    </td>
                                    <td class="p-4 align-middle text-right">
                                        <DropdownMenu.Root>
                                            <DropdownMenu.Trigger>
                                                {#snippet child({ props })}
                                                    <Button
                                                        {...props}
                                                        variant="ghost"
                                                        size="icon"
                                                        class="h-8 w-8 text-muted-foreground"
                                                    >
                                                        <MoreVertical
                                                            class="h-4 w-4"
                                                        />
                                                    </Button>
                                                {/snippet}
                                            </DropdownMenu.Trigger>
                                            <DropdownMenu.Content
                                                align="end"
                                                class="border-gray-100 shadow-sm"
                                            >
                                                <DropdownMenu.Label
                                                    >Hành động</DropdownMenu.Label
                                                >
                                                <DropdownMenu.Item
                                                    onclick={() =>
                                                        openEditProduct(
                                                            product,
                                                        )}
                                                >
                                                    <Pencil
                                                        class="mr-2 h-4 w-4"
                                                    />
                                                    Sửa sản phẩm
                                                </DropdownMenu.Item>
                                                <DropdownMenu.Item
                                                    class="text-red-600"
                                                    onclick={() =>
                                                        openDeleteProduct(
                                                            product,
                                                        )}
                                                >
                                                    <Trash2
                                                        class="mr-2 h-4 w-4"
                                                    />
                                                    Xóa
                                                </DropdownMenu.Item>
                                            </DropdownMenu.Content>
                                        </DropdownMenu.Root>
                                    </td>
                                </tr>
                            {/each}
                            {#if filteredProducts.length === 0}
                                <tr>
                                    <td colspan="7" class="h-32 text-center">
                                        <div
                                            class="flex flex-col items-center justify-center text-muted-foreground p-4"
                                        >
                                            <div
                                                class="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mb-3"
                                            >
                                                <Package
                                                    class="h-6 w-6 text-gray-300"
                                                />
                                            </div>
                                            <p class="font-medium">
                                                Không tìm thấy sản phẩm nào
                                            </p>
                                            {#if searchQuery || selectedCategoryId}
                                                <p class="text-sm mt-1">
                                                    Thử thay đổi bộ lọc tìm kiếm
                                                </p>
                                            {/if}
                                        </div>
                                    </td>
                                </tr>
                            {/if}
                        </tbody>
                    </table>
                </div>
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
            novalidate
            use:enhance={(e) => {
                const form = e.formElement;
                const name = form.querySelector(
                    'input[name="name"]',
                ) as HTMLInputElement;
                resetErrors();
                if (!name.value.trim()) {
                    catNameError = "Vui lòng nhập tên danh mục";
                    e.cancel();
                    return;
                }
                return handleFormSubmit();
            }}
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
                        placeholder="Ví dụ: Mỹ phẩm"
                        oninput={() => (catNameError = "")}
                    />
                    {#if catNameError}
                        <span class="text-red-500 text-xs">{catNameError}</span>
                    {/if}
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

<!-- Product Dialog -->
<Dialog.Root bind:open={isProductDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title
                >{editingProduct?.id
                    ? "Sửa sản phẩm"
                    : "Thêm sản phẩm"}</Dialog.Title
            >
        </Dialog.Header>
        <form
            action={editingProduct?.id ? "?/updateProduct" : "?/createProduct"}
            method="POST"
            novalidate
            use:enhance={(e) => {
                const form = e.formElement;
                const name = (
                    form.querySelector('input[name="name"]') as HTMLInputElement
                )?.value?.trim();
                const price = (
                    form.querySelector(
                        'input[name="price"]',
                    ) as HTMLInputElement
                )?.value;
                const categoryId = (
                    form.querySelector(
                        'select[name="categoryId"]',
                    ) as HTMLSelectElement
                )?.value;
                resetErrors();
                let hasError = false;
                if (!name) {
                    prodNameError = "Vui lòng nhập tên sản phẩm";
                    hasError = true;
                }
                if (!price || isNaN(parseFloat(price))) {
                    prodPriceError = "Vui lòng nhập giá hợp lệ";
                    hasError = true;
                }
                if (!categoryId) {
                    prodCategoryError = "Vui lòng chọn danh mục";
                    hasError = true;
                }
                if (hasError) {
                    e.cancel();
                    return;
                }
                return handleFormSubmit();
            }}
        >
            {#if editingProduct?.id}
                <input type="hidden" name="id" value={editingProduct.id} />
            {/if}
            <div class="grid gap-4 py-4">
                <div class="grid gap-2">
                    <Label for="prod-name">Tên sản phẩm</Label>
                    <Input
                        id="prod-name"
                        name="name"
                        value={editingProduct?.name || ""}
                        placeholder="Ví dụ: Dầu gội Loreal"
                        oninput={() => (prodNameError = "")}
                    />
                    {#if prodNameError}
                        <span class="text-red-500 text-xs">{prodNameError}</span
                        >
                    {/if}
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="prod-price">Giá (VNĐ)</Label>
                        <Input
                            id="prod-price"
                            name="price"
                            type="number"
                            value={editingProduct?.price || 0}
                            oninput={() => (prodPriceError = "")}
                        />
                        {#if prodPriceError}
                            <span class="text-red-500 text-xs"
                                >{prodPriceError}</span
                            >
                        {/if}
                    </div>
                    <div class="grid gap-2">
                        <Label for="prod-stock">Tồn kho</Label>
                        <Input
                            id="prod-stock"
                            name="stock"
                            type="number"
                            value={editingProduct?.stock || 0}
                        />
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="prod-category">Danh mục</Label>
                        <select
                            id="prod-category"
                            name="categoryId"
                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={editingProduct?.categoryId || ""}
                            onchange={() => (prodCategoryError = "")}
                        >
                            <option value="" disabled>Chọn danh mục</option>
                            {#each data.categories as cat}
                                <option value={cat.id}>{cat.name}</option>
                            {/each}
                        </select>
                        {#if prodCategoryError}
                            <span class="text-red-500 text-xs"
                                >{prodCategoryError}</span
                            >
                        {/if}
                    </div>
                    <div class="grid gap-2">
                        <Label for="prod-sku">SKU (tùy chọn)</Label>
                        <Input
                            id="prod-sku"
                            name="sku"
                            value={editingProduct?.sku || ""}
                            placeholder="Mã sản phẩm"
                        />
                    </div>
                </div>
                <div class="grid gap-2">
                    <Label for="prod-desc">Mô tả (tùy chọn)</Label>
                    <Input
                        id="prod-desc"
                        name="description"
                        value={editingProduct?.description || ""}
                        placeholder="Mô tả kỹ hơn về sản phẩm..."
                    />
                </div>
            </div>
            <Dialog.Footer>
                <Button
                    variant="outline"
                    type="button"
                    onclick={() => (isProductDialogOpen = false)}>Hủy</Button
                >
                <Button type="submit">Lưu sản phẩm</Button>
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
                    Cảnh báo: Xóa danh mục có thể ảnh hưởng đến các sản phẩm
                    trong danh mục đó.
                {:else}
                    Sản phẩm sẽ bị xóa vĩnh viễn.
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <form
            action={deleteType === "category"
                ? "?/deleteCategory"
                : "?/deleteProduct"}
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
