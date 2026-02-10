<script lang="ts">
import { enhance } from "$app/forms";
import { goto } from "$app/navigation";
import { page } from "$app/stores";
import * as AlertDialog from "$lib/components/ui/alert-dialog";
import { Button } from "$lib/components/ui/button";
import { Card } from "$lib/components/ui/card";
import * as Dialog from "$lib/components/ui/dialog";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import type { Customer } from "$lib/types";
import { cn } from "$lib/utils";
import {
  Calendar,
  Crown,
  Mail,
  MapPin,
  MoreVertical,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "@lucide/svelte";
import { toast } from "svelte-sonner";
import type { SubmitFunction } from "./$types";

let isCreateDialogOpen = $state(false);
let isEditDialogOpen = $state(false);
let isDeleteDialogOpen = $state(false);
let isLoading = $state(false);
let selectedCustomer = $state<Customer | null>(null);

// Form Validation Errors
let createNameError = $state("");
let createPhoneError = $state("");
let editNameError = $state("");
let editPhoneError = $state("");

// Search and filter state (synced with URL)
let searchQuery = $state($page.url.searchParams.get("q") || "");
let activeFilter = $state<"all" | "vip">(
  ($page.url.searchParams.get("filter") as "all" | "vip") || "all",
);

// Debounce timer for search
let searchTimeout: ReturnType<typeof setTimeout>;

// Update URL when search/filter changes
function updateUrlParams() {
  const url = new URL($page.url);
  if (searchQuery) {
    url.searchParams.set("q", searchQuery);
  } else {
    url.searchParams.delete("q");
  }
  if (activeFilter !== "all") {
    url.searchParams.set("filter", activeFilter);
  } else {
    url.searchParams.delete("filter");
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

function setFilter(filter: "all" | "vip") {
  activeFilter = filter;
  updateUrlParams();
}

let { data } = $props();

// Filtered customers based on search and filter
let filteredCustomers = $derived.by(() => {
  let result = data.customers;

  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    result = result.filter(
      (c: Customer) =>
        c.name.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query),
    );
  }

  // Apply VIP filter
  if (activeFilter === "vip") {
    result = result.filter((c: Customer) => c.membershipTier);
  }

  return result;
});

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
  <div class="page-hero p-5 sm:p-6">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="section-title text-2xl font-bold tracking-tight text-gray-900">Khách hàng</h1>
        <p class="mt-1 text-gray-500">Quản lý thông tin khách hàng của bạn</p>
      </div>
      {#if data.canCreate}
        <Button
          onclick={() => (isCreateDialogOpen = true)}
          class="btn-gradient shadow-lg shadow-purple-200"
        >
          <Plus class="mr-2 h-4 w-4" aria-hidden="true" />
          Tạo mới khách hàng
        </Button>
      {/if}
    </div>
  </div>

  <!-- Search and filters -->
  <div class="filter-strip flex flex-col items-start gap-4 p-4 sm:flex-row sm:items-center">
    <div class="relative flex-1 max-w-md w-full">
      <label for="customer-search" class="sr-only">Tìm kiếm khách hàng</label>
      <Search
        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        aria-hidden="true"
      />
      <Input
        id="customer-search"
        type="search"
        placeholder="Tìm kiếm khách hàng…"
        class="soft-input rounded-xl pl-10 pr-10 focus:border-purple-300 focus:ring-purple-100"
        value={searchQuery}
        oninput={handleSearchInput}
      />
      {#if searchQuery}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-gray-100 hover:bg-gray-200"
          onclick={clearSearch}
        >
          <X class="h-3 w-3 text-gray-500" aria-hidden="true" />
        </Button>
      {/if}
    </div>
    <div class="flex gap-2" role="group" aria-label="Bộ lọc khách hàng">
      <Button
        variant={activeFilter === "all" ? "default" : "outline"}
        class="px-4 py-2 text-sm font-medium rounded-xl h-auto"
        onclick={() => setFilter("all")}
        aria-pressed={activeFilter === "all"}>Tất cả</Button
      >
      <Button
        variant={activeFilter === "vip" ? "default" : "outline"}
        class="px-4 py-2 text-sm font-medium rounded-xl flex items-center gap-1.5 h-auto"
        onclick={() => setFilter("vip")}
        aria-pressed={activeFilter === "vip"}
      >
        <Crown
          class={cn("h-3.5 w-3.5", activeFilter === "vip" ? "text-white" : "text-amber-500")}
          aria-hidden="true"
        />
        VIP
      </Button>
    </div>
  </div>

  <!-- Customers Table -->
  <div class="table-shell overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-gray-50/50 border-b border-gray-100">
          <tr>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500 w-[80px]"
              >Avatar</th
            >
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Khách hàng</th>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Liên hệ</th>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Hạng</th>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Địa chỉ</th>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Chi tiêu</th>
            <th class="h-12 px-4 text-left align-middle font-medium text-gray-500">Giới tính</th>
            <th class="h-12 px-4 text-right align-middle font-medium text-gray-500">Thao tác</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each filteredCustomers as customer, index}
            <tr class="group transition-colors hover:bg-gray-50/50">
              <!-- Avatar -->
              <td class="p-4 align-middle">
                <div
                  class={cn(
                    "h-10 w-10 rounded-full bg-gradient-to-br text-white flex items-center justify-center text-sm font-bold shadow-sm",
                    getAvatarGradient(index),
                  )}
                >
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
              </td>

              <!-- Customer Info -->
              <td class="p-4 align-middle">
                <div class="font-medium text-gray-900">
                  {customer.name}
                </div>
                <div class="text-xs text-gray-500">
                  {customer.email || ""}
                </div>
              </td>

              <!-- Contact -->
              <td class="p-4 align-middle">
                <div class="flex items-center gap-2 text-gray-600">
                  <Phone class="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{customer.phone || "N/A"}</span>
                </div>
              </td>

              <!-- Tier -->
              <td class="p-4 align-middle">
                {#if customer.membershipTier}
                  <div
                    class="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full text-white text-xs font-medium"
                  >
                    <Crown class="h-3 w-3" aria-hidden="true" />
                    <span>{customer.membershipTier.name}</span>
                  </div>
                {:else}
                  <span class="text-xs text-gray-400">-</span>
                {/if}
              </td>

              <!-- Location -->
              <td class="p-4 align-middle">
                <div class="flex items-center gap-1.5 text-gray-600 max-w-[200px] truncate">
                  {#if customer.location}
                    <MapPin class="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden="true" />
                    <span class="truncate">{customer.location}</span>
                  {:else}
                    <span class="text-gray-400 text-xs">-</span>
                  {/if}
                </div>
              </td>

              <!-- Spent -->
              <td class="p-4 align-middle">
                <div class="font-medium text-gray-900" style="font-variant-numeric: tabular-nums;">
                  {formatCurrency(customer.totalSpent || 0)}đ
                </div>
              </td>

              <!-- Gender -->
              <td class="p-4 align-middle">
                {#if customer.gender}
                  <span
                    class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600"
                  >
                    {customer.gender === "male"
                      ? "Nam"
                      : customer.gender === "female"
                        ? "Nữ"
                        : "Khác"}
                  </span>
                {:else}
                  <span class="text-gray-400 text-xs">-</span>
                {/if}
              </td>

              <!-- Actions -->
              <td class="p-4 align-middle text-right">
                {#if data.canUpdate || data.canDelete}
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      {#snippet child({ props })}
                        <Button
                          {...props}
                          variant="ghost"
                          size="icon"
                          class="h-8 w-8 text-gray-500"
                          aria-label="Tùy chọn thao tác {customer.name}"
                        >
                          <MoreVertical class="h-4 w-4" aria-hidden="true" />
                        </Button>
                      {/snippet}
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end" class="border-gray-100 shadow-sm">
                      {#if data.canUpdate}
                        <DropdownMenu.Item onclick={() => openEditDialog(customer)}>
                          <Pencil class="mr-2 h-4 w-4" aria-hidden="true" />
                          Chỉnh sửa
                        </DropdownMenu.Item>
                      {/if}
                      {#if data.canDelete}
                        <DropdownMenu.Item
                          variant="destructive"
                          onclick={() => openDeleteDialog(customer)}
                        >
                          <Trash2 class="mr-2 h-4 w-4" aria-hidden="true" />
                          Xóa
                        </DropdownMenu.Item>
                      {/if}
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if filteredCustomers.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-center text-gray-500">
        <div class="bg-gray-50 p-4 rounded-full mb-3">
          <Search class="h-6 w-6 text-gray-400" aria-hidden="true" />
        </div>
        {#if searchQuery || activeFilter !== "all"}
          <p>Không tìm thấy khách hàng nào phù hợp.</p>
          <Button
            variant="link"
            class="mt-2 text-sm text-purple-600 hover:text-purple-700 underline h-auto p-0"
            onclick={() => {
              searchQuery = "";
              activeFilter = "all";
              updateUrlParams();
            }}
          >
            Xóa bộ lọc
          </Button>
        {:else}
          <p>Chưa có khách hàng nào. Hãy thêm khách hàng đầu tiên!</p>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Create Dialog -->
<Dialog.Root bind:open={isCreateDialogOpen}>
  <Dialog.Content class="sm:max-w-[500px]">
    <form
      method="POST"
      action="?/createCustomer"
      novalidate
      use:enhance={(e) => {
        createNameError = "";
        createPhoneError = "";
        let hasError = false;
        if (!createFormData.name.trim()) {
          createNameError = "Vui lòng nhập tên khách hàng";
          hasError = true;
        }
        if (!createFormData.phone.trim()) {
          createPhoneError = "Vui lòng nhập số điện thoại";
          hasError = true;
        }
        if (hasError) {
          e.cancel();
          return;
        }
        return handleCreateSubmit(e);
      }}
    >
      <Dialog.Header>
        <Dialog.Title>Thêm khách hàng mới</Dialog.Title>
        <Dialog.Description>
          Nhập thông tin khách hàng mới vào bên dưới. Nhấn lưu để hoàn tất.
        </Dialog.Description>
      </Dialog.Header>
      <div class="grid gap-4 py-4">
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="name" class="text-right">Tên *</Label>
          <div class="col-span-3 space-y-1">
            <Input
              id="name"
              name="name"
              bind:value={createFormData.name}
              placeholder="Nguyễn Văn A"
              autocomplete="name"
              oninput={() => (createNameError = "")}
            />
            {#if createNameError}
              <span class="text-red-500 text-xs">{createNameError}</span>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="phone" class="text-right">SĐT *</Label>
          <div class="col-span-3 space-y-1">
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputmode="tel"
              bind:value={createFormData.phone}
              placeholder="0901234567"
              autocomplete="tel"
              oninput={() => (createPhoneError = "")}
            />
            {#if createPhoneError}
              <span class="text-red-500 text-xs">{createPhoneError}</span>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="email" class="text-right">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            bind:value={createFormData.email}
            placeholder="example@gmail.com"
            autocomplete="email"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="gender" class="text-right">Giới tính</Label>
          <Select.Root type="single" name="gender" bind:value={createFormData.gender}>
            <Select.Trigger class="w-full col-span-3">
              {createFormData.gender === "male"
                ? "Nam"
                : createFormData.gender === "female"
                  ? "Nữ"
                  : createFormData.gender === "other"
                    ? "Khác"
                    : "Chọn giới tính"}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="male" label="Nam">Nam</Select.Item>
              <Select.Item value="female" label="Nữ">Nữ</Select.Item>
              <Select.Item value="other" label="Khác">Khác</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="location" class="text-right">Địa chỉ</Label>
          <Input
            id="location"
            name="location"
            bind:value={createFormData.location}
            placeholder="123 Đường ABC, Quận 1"
            autocomplete="street-address"
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
        <Button variant="outline" type="button" onclick={() => (isCreateDialogOpen = false)}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu…" : "Lưu khách hàng"}
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
      novalidate
      use:enhance={(e) => {
        editNameError = "";
        editPhoneError = "";
        let hasError = false;
        if (!editFormData.name.trim()) {
          editNameError = "Vui lòng nhập tên khách hàng";
          hasError = true;
        }
        if (!editFormData.phone.trim()) {
          editPhoneError = "Vui lòng nhập số điện thoại";
          hasError = true;
        }
        if (hasError) {
          e.cancel();
          return;
        }
        return handleEditSubmit(e);
      }}
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
          <div class="col-span-3 space-y-1">
            <Input
              id="edit-name"
              name="name"
              bind:value={editFormData.name}
              placeholder="Nguyễn Văn A"
              autocomplete="name"
              oninput={() => (editNameError = "")}
            />
            {#if editNameError}
              <span class="text-red-500 text-xs">{editNameError}</span>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="edit-phone" class="text-right">SĐT *</Label>
          <div class="col-span-3 space-y-1">
            <Input
              id="edit-phone"
              name="phone"
              type="tel"
              inputmode="tel"
              bind:value={editFormData.phone}
              placeholder="0901234567"
              autocomplete="tel"
              oninput={() => (editPhoneError = "")}
            />
            {#if editPhoneError}
              <span class="text-red-500 text-xs">{editPhoneError}</span>
            {/if}
          </div>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="edit-email" class="text-right">Email</Label>
          <Input
            id="edit-email"
            name="email"
            type="email"
            bind:value={editFormData.email}
            placeholder="example@gmail.com"
            autocomplete="email"
            class="col-span-3"
          />
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="edit-gender" class="text-right">Giới tính</Label>
          <Select.Root type="single" name="gender" bind:value={editFormData.gender}>
            <Select.Trigger class="w-full col-span-3">
              {editFormData.gender === "male"
                ? "Nam"
                : editFormData.gender === "female"
                  ? "Nữ"
                  : editFormData.gender === "other"
                    ? "Khác"
                    : "Chọn giới tính"}
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="male" label="Nam">Nam</Select.Item>
              <Select.Item value="female" label="Nữ">Nữ</Select.Item>
              <Select.Item value="other" label="Khác">Khác</Select.Item>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid grid-cols-4 items-center gap-4">
          <Label for="edit-location" class="text-right">Địa chỉ</Label>
          <Input
            id="edit-location"
            name="location"
            bind:value={editFormData.location}
            placeholder="123 Đường ABC, Quận 1"
            autocomplete="street-address"
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
        <Button variant="outline" type="button" onclick={() => (isEditDialogOpen = false)}>
          Hủy
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang lưu…" : "Cập nhật"}
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
        Bạn có chắc chắn muốn xóa khách hàng <strong>{selectedCustomer?.name}</strong>? Hành động
        này không thể hoàn tác.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}>Hủy bỏ</AlertDialog.Cancel>
      <form method="POST" action="?/deleteCustomer" use:enhance={handleDeleteSubmit} class="inline">
        <input type="hidden" name="id" value={selectedCustomer?.id} />
        <Button type="submit" disabled={isLoading} class="bg-red-600 text-white hover:bg-red-700">
          {isLoading ? "Đang xóa…" : "Xóa khách hàng"}
        </Button>
      </form>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
