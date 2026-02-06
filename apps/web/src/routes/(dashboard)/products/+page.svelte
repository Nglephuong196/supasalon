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
    X,
  } from "@lucide/svelte";
  import { cn } from "$lib/utils";
  import { toast } from "svelte-sonner";
  import { Label } from "$lib/components/ui/label";
  import { enhance } from "$app/forms";
  import type { PageData } from "./$types";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import * as Select from "$lib/components/ui/select";

  // Props
  let { data } = $props<{ data: PageData }>();

  // State with URL sync
  let searchQuery = $state($page.url.searchParams.get("q") || "");
  let categorySearchQuery = $state("");
  const categoryParam = $page.url.searchParams.get("category");
  let selectedCategoryId = $state<number | null>(categoryParam ? parseInt(categoryParam) : null);
  let searchTimeout: ReturnType<typeof setTimeout>;

  function updateUrlParams() {
    const url = new URL($page.url);
    if (searchQuery) {
      url.searchParams.set("q", searchQuery);
    } else {
      url.searchParams.delete("q");
    }
    if (selectedCategoryId !== null) {
      url.searchParams.set("category", selectedCategoryId.toString());
    } else {
      url.searchParams.delete("category");
    }
    goto(url.toString(), { replaceState: true, keepFocus: true });
  }

  function handleSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    searchQuery = target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(updateUrlParams, 300);
  }

  function clearSearch() {
    searchQuery = "";
    updateUrlParams();
  }

  function selectCategory(id: number | null) {
    selectedCategoryId = id;
    updateUrlParams();
  }

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
      const matchesCategory = selectedCategoryId === null || p.categoryId === selectedCategoryId;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    }),
  );
  let filteredCategories = $derived(
    data.categories.filter((c: any) =>
      c.name.toLowerCase().includes(categorySearchQuery.toLowerCase()),
    ),
  );

  // Helpers
  function formatPrice(price: number) {
    return new Intl.NumberFormat("vi-VN").format(price) + "đ";
  }

  function getCategoryName(id: number) {
    return data.categories.find((c: any) => c.id === id)?.name || "Unknown";
  }

  function categoryCount(id: number) {
    return data.products.filter((p: any) => p.categoryId === id).length;
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
        if (deleteType === "category" && selectedCategoryId === itemToDelete.id) {
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
  <div class="page-hero flex flex-none items-center justify-between p-5 sm:p-6">
    <div>
      <h1 class="section-title text-2xl font-bold tracking-tight text-foreground">
        Quản lý sản phẩm
      </h1>
      <p class="text-muted-foreground">Quản lý danh mục và sản phẩm bán tại salon</p>
    </div>
    <div class="hidden md:flex items-center gap-2">
      <span class="px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        {filteredProducts.length} / {data.products.length} sản phẩm
      </span>
      <span
        class="px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
      >
        {data.categories.length} danh mục
      </span>
    </div>
  </div>

  <!-- Main Content Split View -->
  <div class="flex-1 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0">
    <!-- Mobile Category Filter (visible only on mobile) -->
    <div class="md:hidden flex-none">
      <div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <Button
          variant={selectedCategoryId === null ? "default" : "outline"}
          class="flex-none rounded-full h-8 text-sm font-medium transition-all whitespace-nowrap"
          onclick={() => selectCategory(null)}
        >
          Tất cả ({data.products.length})
        </Button>
        {#each data.categories as category}
          <Button
            variant={selectedCategoryId === category.id ? "default" : "outline"}
            class="flex-none rounded-full h-8 text-sm font-medium transition-all whitespace-nowrap"
            onclick={() => selectCategory(category.id)}
          >
            {category.name}
          </Button>
        {/each}
        <Button
          variant="outline"
          size="sm"
          class="flex-none rounded-full h-8"
          onclick={openCreateCategory}
        >
          <Plus class="h-3 w-3 mr-1" aria-hidden="true" />
          Tạo mới
        </Button>
      </div>
    </div>

    <!-- Sidebar: Categories (hidden on mobile) -->
    <div
      class="panel-shell hidden w-64 flex-none flex-col gap-4 bg-white p-4 overflow-hidden md:flex"
    >
      <div class="flex items-center justify-between flex-none">
        <h2 class="font-semibold text-foreground flex items-center gap-2">
          <Layers class="h-4 w-4 text-primary" aria-hidden="true" />
          Danh mục
        </h2>
        <Button
          variant="ghost"
          size="icon"
          class="h-8 w-8 hover:bg-primary/10 hover:text-primary"
          onclick={openCreateCategory}
          aria-label="Tạo mới danh mục"
        >
          <Plus class="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <div class="space-y-2">
        <div class="relative">
          <Search
            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Tìm danh mục..."
            class="pl-9 h-9"
            bind:value={categorySearchQuery}
          />
        </div>
        <div class="flex items-center justify-between text-xs text-muted-foreground">
          <span>{data.categories.length} danh mục</span>
          <button
            class="hover:text-foreground underline"
            onclick={() => {
              selectedCategoryId = null;
              categorySearchQuery = "";
              updateUrlParams();
            }}
          >
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto space-y-1 pr-2">
        <Button
          variant="ghost"
          class={cn(
            "w-full justify-start h-auto px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left",
            selectedCategoryId === null
              ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
              : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
          )}
          onclick={() => selectCategory(null)}
        >
          <Box class="h-4 w-4 mr-3" aria-hidden="true" />
          <span class="flex-1">Tất cả sản phẩm</span>
          <span
            class={cn(
              "text-xs py-0.5 px-2 rounded-full",
              selectedCategoryId === null ? "bg-white/20" : "bg-gray-200 text-gray-600",
            )}
          >
            {data.products.length}
          </span>
        </Button>

        {#each filteredCategories as category}
          <div class="group relative">
            <Button
              variant="ghost"
              class={cn(
                "w-full justify-start h-auto px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left pr-8",
                selectedCategoryId === category.id
                  ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:text-primary"
                  : "text-foreground hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
              onclick={() => selectCategory(category.id)}
            >
              <span class="truncate flex-1">{category.name}</span>
              <span
                class={cn(
                  "text-[10px] py-0.5 px-2 rounded-full",
                  selectedCategoryId === category.id
                    ? "bg-primary/10 text-primary"
                    : "bg-gray-100 text-gray-600",
                )}
              >
                {categoryCount(category.id)}
              </span>
              {#if selectedCategoryId === category.id}
                <span
                  class="h-1.5 w-1.5 rounded-full bg-primary absolute left-1 top-1/2 -translate-y-1/2"
                ></span>
              {/if}
            </Button>

            <!-- Hover Actions for Category -->
            <div
              class="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition-opacity z-10"
            >
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class="h-7 w-7 flex items-center justify-center rounded-md hover:bg-background/80 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical class="h-3.5 w-3.5" aria-hidden="true" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="start" class="border-gray-100 shadow-sm">
                  <DropdownMenu.Item onclick={(e) => openEditCategory(category, e)}>
                    <Pencil class="h-3 w-3 mr-2" aria-hidden="true" />
                    Sửa tên
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    class="text-red-600"
                    onclick={(e) => openDeleteCategory(category, e)}
                  >
                    <Trash2 class="h-3 w-3 mr-2" aria-hidden="true" />
                    Xóa danh mục
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            </div>
          </div>
        {/each}

        {#if filteredCategories.length === 0}
          <div
            class="text-center py-8 px-4 text-xs text-muted-foreground border-2 border-dashed border-gray-100 rounded-lg"
          >
            {#if categorySearchQuery}
              Không tìm thấy danh mục phù hợp.
            {:else}
              Chưa có danh mục nào. <br />
              Nhấn dấu + để thêm.
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Main Area: Product Table -->
    <div class="flex-1 min-w-0">
      <div class="table-shell bg-card text-card-foreground h-full flex flex-col">
        <div
          class="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100 flex-none"
        >
          <div>
            <h3 class="font-semibold leading-none tracking-tight hidden sm:block">Danh sách</h3>
            <div class="sm:hidden text-sm font-medium">Sản phẩm</div>
          </div>

          <div class="flex items-center gap-2 w-full sm:w-auto flex-1 justify-end">
            <div class="relative max-w-xs w-full sm:w-64">
              <label for="product-search" class="sr-only">Tìm kiếm sản phẩm</label>
              <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="product-search"
                type="search"
                placeholder="Tìm kiếm sản phẩm…"
                class="soft-input h-9 pl-9 pr-9"
                value={searchQuery}
                oninput={handleSearchInput}
              />
              {#if searchQuery}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-100 hover:bg-gray-200"
                  onclick={clearSearch}
                >
                  <X class="h-3 w-3 text-gray-500" aria-hidden="true" />
                </Button>
              {/if}
            </div>

            <Button onclick={openCreateProduct} class="btn-gradient h-9 shrink-0">
              <Plus class="h-4 w-4 sm:mr-2" aria-hidden="true" />
              <span class="hidden sm:inline">Tạo mới sản phẩm</span>
            </Button>
          </div>
        </div>

        <!-- Quick Filters -->
        <div class="filter-strip rounded-none border-x-0 border-t-0 px-4 pb-3">
          <div class="flex items-center gap-2 flex-wrap text-xs">
            <button
              class={cn(
                "px-3 py-1 rounded-full border transition-all",
                selectedCategoryId === null
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-white text-muted-foreground border-border hover:text-foreground",
              )}
              onclick={() => selectCategory(null)}
            >
              Tất cả
            </button>
            {#each data.categories as category}
              <button
                class={cn(
                  "px-3 py-1 rounded-full border transition-all",
                  selectedCategoryId === category.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:text-foreground",
                )}
                onclick={() => selectCategory(category.id)}
              >
                {category.name}
              </button>
            {/each}
          </div>
        </div>

        <div class="flex-1 overflow-auto">
          <table class="w-full text-sm">
            <thead class="border-b border-gray-100 bg-muted/40 sticky top-0 bg-white">
              <tr>
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
                  >Tối thiểu</th
                >
                <th
                  class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
                  >SKU</th
                >
                <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                ></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              {#each filteredProducts as product (product.id)}
                <tr class="hover:bg-muted/50 transition-colors">
                  <td class="p-4 align-middle font-medium">
                    {product.name}
                  </td>
                  <td class="p-4 align-middle">
                    <span
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700"
                    >
                      {getCategoryName(product.categoryId)}
                    </span>
                  </td>
                  <td
                    class="p-4 align-middle font-medium text-purple-700"
                    style="font-variant-numeric: tabular-nums;"
                  >
                    {formatPrice(product.price)}
                  </td>
                  <td class="p-4 align-middle text-muted-foreground">
                    <div class="flex items-center gap-1">
                      <Package class="h-3 w-3" aria-hidden="true" />
                      <span
                        class={cn(
                          "font-medium",
                          product.stock <= (product.minStock ?? 10)
                            ? "text-rose-600"
                            : "text-foreground",
                        )}
                      >
                        {product.stock}
                      </span>
                    </div>
                  </td>
                  <td class="p-4 align-middle text-muted-foreground">
                    <span
                      class={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        product.stock <= (product.minStock ?? 10)
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700",
                      )}
                    >
                      {product.minStock ?? 0}
                    </span>
                  </td>
                  <td class="p-4 align-middle text-muted-foreground">
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
                            <MoreVertical class="h-4 w-4" aria-hidden="true" />
                          </Button>
                        {/snippet}
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content align="end" class="border-gray-100 shadow-sm">
                        <DropdownMenu.Label>Hành động</DropdownMenu.Label>
                        <DropdownMenu.Item onclick={() => openEditProduct(product)}>
                          <Pencil class="mr-2 h-4 w-4" aria-hidden="true" />
                          Sửa sản phẩm
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                          class="text-red-600"
                          onclick={() => openDeleteProduct(product)}
                        >
                          <Trash2 class="mr-2 h-4 w-4" aria-hidden="true" />
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
                        <Package class="h-6 w-6 text-gray-300" aria-hidden="true" />
                      </div>
                      <p class="font-medium">Không tìm thấy sản phẩm nào</p>
                      {#if searchQuery || selectedCategoryId}
                        <Button
                          variant="link"
                          class="text-sm mt-2 text-purple-600 hover:text-purple-700 underline h-auto p-0"
                          onclick={() => {
                            searchQuery = "";
                            selectedCategoryId = null;
                            updateUrlParams();
                          }}
                        >
                          Xóa bộ lọc
                        </Button>
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
      <Dialog.Title>{editingCategory ? "Sửa danh mục" : "Tạo mới danh mục"}</Dialog.Title>
    </Dialog.Header>
    <form
      action={editingCategory ? "?/updateCategory" : "?/createCategory"}
      method="POST"
      novalidate
      use:enhance={(e) => {
        const form = e.formElement;
        const name = form.querySelector('input[name="name"]') as HTMLInputElement;
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
        <Button variant="outline" type="button" onclick={() => (isCategoryDialogOpen = false)}
          >Hủy</Button
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
      <Dialog.Title>{editingProduct?.id ? "Sửa sản phẩm" : "Tạo mới sản phẩm"}</Dialog.Title>
    </Dialog.Header>
    <form
      action={editingProduct?.id ? "?/updateProduct" : "?/createProduct"}
      method="POST"
      novalidate
      use:enhance={(e) => {
        const form = e.formElement;
        const name = (form.querySelector('input[name="name"]') as HTMLInputElement)?.value?.trim();
        const price = (form.querySelector('input[name="price"]') as HTMLInputElement)?.value;
        const categoryId = (form.querySelector('input[name="categoryId"]') as HTMLInputElement)
          ?.value;
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
            <span class="text-red-500 text-xs">{prodNameError}</span>
          {/if}
        </div>
        <div class="grid grid-cols-3 gap-4">
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
              <span class="text-red-500 text-xs">{prodPriceError}</span>
            {/if}
          </div>
          <div class="grid gap-2">
            <Label for="prod-stock">Tồn kho</Label>
            <Input id="prod-stock" name="stock" type="number" value={editingProduct?.stock || 0} />
          </div>
          <div class="grid gap-2">
            <Label for="prod-min-stock">Tối thiểu</Label>
            <Input
              id="prod-min-stock"
              name="minStock"
              type="number"
              value={editingProduct?.minStock || 10}
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="grid gap-2">
            <Label for="prod-category">Danh mục</Label>
            <div class="relative">
              <Select.Root
                type="single"
                name="categoryId"
                value={editingProduct?.categoryId?.toString()}
                onValueChange={(v) => {
                  prodCategoryError = "";
                  if (editingProduct) editingProduct.categoryId = parseInt(v);
                }}
              >
                <Select.Trigger class="w-full">
                  {data.categories.find(
                    (c: any) => c.id.toString() === editingProduct?.categoryId?.toString(),
                  )?.name || "Chọn danh mục"}
                </Select.Trigger>
                <Select.Content>
                  {#each data.categories as cat}
                    <Select.Item value={cat.id.toString()} label={cat.name}>
                      {cat.name}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Root>
            </div>
            {#if prodCategoryError}
              <span class="text-red-500 text-xs">{prodCategoryError}</span>
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
        <Button variant="outline" type="button" onclick={() => (isProductDialogOpen = false)}
          >Hủy</Button
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
          Cảnh báo: Xóa danh mục có thể ảnh hưởng đến các sản phẩm trong danh mục đó.
        {:else}
          Sản phẩm sẽ bị xóa vĩnh viễn.
        {/if}
      </AlertDialog.Description>
    </AlertDialog.Header>
    <form
      action={deleteType === "category" ? "?/deleteCategory" : "?/deleteProduct"}
      method="POST"
      use:enhance={handleDeleteSubmit}
    >
      <input type="hidden" name="id" value={itemToDelete?.id} />
      <AlertDialog.Footer>
        <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}>Hủy bỏ</AlertDialog.Cancel>
        <Button type="submit" variant="destructive">Xóa</Button>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
