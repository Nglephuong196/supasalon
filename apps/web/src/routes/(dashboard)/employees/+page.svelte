<script lang="ts">
import * as Card from "$lib/components/ui/card";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Dialog from "$lib/components/ui/dialog";
import * as Select from "$lib/components/ui/select";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import * as AlertDialog from "$lib/components/ui/alert-dialog";
import { Plus, Search, Mail, MoreVertical, Loader2, Trash, Pencil, X } from "@lucide/svelte";
import { cn } from "$lib/utils";
import { enhance } from "$app/forms";
import { toast } from "svelte-sonner";
import type { PageData } from "./$types";
import { page } from "$app/stores";
import { goto } from "$app/navigation";

let { data }: { data: PageData } = $props();

// Employee management (create/update/delete) is restricted to owner/admin only
// since those actions are N/A for regular members in the permission system
let canManageEmployees = $derived(
  $page.data.memberRole === "owner" || $page.data.memberRole === "admin",
);

// Search state with URL sync
let searchQuery = $state($page.url.searchParams.get("q") || "");
let searchTimeout: ReturnType<typeof setTimeout>;

function updateSearchUrl() {
  const url = new URL($page.url);
  if (searchQuery) {
    url.searchParams.set("q", searchQuery);
  } else {
    url.searchParams.delete("q");
  }
  goto(url.toString(), { replaceState: true, keepFocus: true });
}

function handleSearchInput(event: Event) {
  const target = event.target as HTMLInputElement;
  searchQuery = target.value;
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(updateSearchUrl, 300);
}

function clearSearch() {
  searchQuery = "";
  updateSearchUrl();
}
let isAddOpen = $state(false);

// Add Member Form
// (We rely on form submission now, so local binding only for UI if needed, or just regular inputs)
// But keeping bindings is fine for clearing.
let name = $state("");
let email = $state("");
let password = $state("");
let role = $state("member");

// Edit Role Form
let isEditRoleOpen = $state(false);
let editingEmployee = $state<any>(null);
let editRoleValue = $state("member");

// Delete State
let isDeleteDialogOpen = $state(false);
let deletingEmployee = $state<any>(null);

// Form Validation Errors
let empNameError = $state("");
let empEmailError = $state("");
let empPasswordError = $state("");

// Map members for display
let allEmployees = $derived(
  data.members
    .map((m: any) => ({
      id: m.id,
      type: "member",
      name: m.user?.name || "Unknown",
      email: m.user?.email || "No Email",
      image: m.user?.image,
      role: m.role,
      phone: "",
      status: "active",
    }))
    .filter(
      (e: any) =>
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ),
);

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-700",
  owner: "bg-orange-100 text-orange-700",
  member: "bg-blue-100 text-blue-700",
  user: "bg-gray-100 text-gray-700",
};

function handleFormSubmit() {
  return async ({ result, update }: any) => {
    if (result.type === "success") {
      toast.success("Thao tác thành công");
      isAddOpen = false;
      isEditRoleOpen = false;
      isDeleteDialogOpen = false;
      // Reset inputs
      name = "";
      email = "";
      password = "";
      role = "member";
    } else if (result.type === "failure") {
      toast.error(result.data?.message || "Có lỗi xảy ra");
    }
    await update();
  };
}

function openEditRole(employee: any) {
  editingEmployee = employee;
  editRoleValue = employee.role;
  isEditRoleOpen = true;
}

function openDeleteDialog(employee: any) {
  deletingEmployee = employee;
  isDeleteDialogOpen = true;
}
</script>

<svelte:head>
  <title>Nhân viên | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <div class="page-hero p-5 sm:p-6">
    <h1 class="section-title text-2xl font-bold tracking-tight text-foreground">Nhân viên</h1>
    <p class="mt-1 text-muted-foreground">
      Quản lý tài khoản nội bộ, vai trò và quyền truy cập theo tổ chức.
    </p>
  </div>

  <!-- Employees Content -->
  <div class="table-shell bg-card text-card-foreground">
    <div
      class="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100"
    >
      <div>
        <h3 class="font-semibold leading-none tracking-tight">Danh sách nhân viên</h3>
        <p class="text-sm text-muted-foreground mt-2">
          Quản lý {allEmployees.length} nhân viên trong hệ thống
        </p>
      </div>

      <div class="flex items-center gap-2 w-full sm:w-auto">
        <div class="relative flex-1 sm:w-64">
          <label for="employee-search" class="sr-only">Tìm kiếm nhân viên</label>
          <Search
            class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="employee-search"
            type="search"
            placeholder="Tìm kiếm nhân viên…"
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
        {#if canManageEmployees}
          <Dialog.Root bind:open={isAddOpen}>
            <Dialog.Trigger>
              {#snippet child({ props })}
                <Button {...props} class="btn-gradient h-9">
                  <Plus class="h-4 w-4 mr-2" aria-hidden="true" />
                  Tạo mới nhân viên
                </Button>
              {/snippet}
            </Dialog.Trigger>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>Thêm nhân viên mới</Dialog.Title>
                <Dialog.Description>Tạo tài khoản mới cho nhân viên.</Dialog.Description>
              </Dialog.Header>
              <form
                action="?/createMember"
                method="POST"
                novalidate
                use:enhance={(e) => {
                  empNameError = "";
                  empEmailError = "";
                  empPasswordError = "";
                  let hasError = false;
                  if (!name.trim()) {
                    empNameError = "Vui lòng nhập tên hiển thị";
                    hasError = true;
                  }
                  if (!email.trim()) {
                    empEmailError = "Vui lòng nhập email";
                    hasError = true;
                  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    empEmailError = "Email không hợp lệ";
                    hasError = true;
                  }
                  if (!password) {
                    empPasswordError = "Vui lòng nhập mật khẩu";
                    hasError = true;
                  } else if (password.length < 6) {
                    empPasswordError = "Mật khẩu phải có ít nhất 6 ký tự";
                    hasError = true;
                  }
                  if (hasError) {
                    e.cancel();
                    return;
                  }
                  return handleFormSubmit();
                }}
              >
                <div class="grid gap-4 py-4">
                  <div class="grid gap-2">
                    <Label for="name">Tên hiển thị</Label>
                    <Input
                      id="name"
                      name="name"
                      bind:value={name}
                      placeholder="Nguyễn Văn A"
                      autocomplete="name"
                      oninput={() => (empNameError = "")}
                    />
                    {#if empNameError}
                      <span class="text-red-500 text-xs">{empNameError}</span>
                    {/if}
                  </div>
                  <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      bind:value={email}
                      placeholder="nhanvien@salon.com"
                      autocomplete="email"
                      oninput={() => (empEmailError = "")}
                    />
                    {#if empEmailError}
                      <span class="text-red-500 text-xs">{empEmailError}</span>
                    {/if}
                  </div>
                  <div class="grid gap-2">
                    <Label for="password">Mật khẩu</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      bind:value={password}
                      placeholder="••••••••"
                      autocomplete="new-password"
                      oninput={() => (empPasswordError = "")}
                    />
                    {#if empPasswordError}
                      <span class="text-red-500 text-xs">{empPasswordError}</span>
                    {/if}
                  </div>
                  <div class="grid gap-2">
                    <Label for="role">Vai trò</Label>
                    <Select.Root type="single" name="role" bind:value={role}>
                      <Select.Trigger class="w-full">
                        {role === "member"
                          ? "Thành viên"
                          : role === "admin"
                            ? "Quản trị viên"
                            : role === "owner"
                              ? "Chủ sở hữu"
                              : "Thành viên"}
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="member" label="Thành viên">Thành viên</Select.Item>
                        <Select.Item value="admin" label="Quản trị viên">Quản trị viên</Select.Item>
                        <Select.Item value="owner" label="Chủ sở hữu">Chủ sở hữu</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
                <Dialog.Footer>
                  <Button variant="outline" type="button" onclick={() => (isAddOpen = false)}
                    >Hủy</Button
                  >
                  <Button type="submit">Tạo mới nhân viên</Button>
                </Dialog.Footer>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        {/if}
      </div>
    </div>

    <!-- Edit Role Dialog (Hidden, triggers via state) -->
    <Dialog.Root bind:open={isEditRoleOpen}>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Cập nhật vai trò</Dialog.Title>
          <Dialog.Description>
            Thay đổi vai trò cho {editingEmployee?.name}
          </Dialog.Description>
        </Dialog.Header>
        <form action="?/updateRole" method="POST" use:enhance={handleFormSubmit}>
          <input type="hidden" name="memberId" value={editingEmployee?.id} />
          <div class="grid gap-4 py-4">
            <div class="grid gap-2">
              <Label for="edit-role">Vai trò</Label>
              <Select.Root type="single" name="role" bind:value={editRoleValue}>
                <Select.Trigger class="w-full">
                  {editRoleValue === "member"
                    ? "Thành viên"
                    : editRoleValue === "admin"
                      ? "Quản trị viên"
                      : editRoleValue === "owner"
                        ? "Chủ sở hữu"
                        : "Thành viên"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="member" label="Thành viên">Thành viên</Select.Item>
                  <Select.Item value="admin" label="Quản trị viên">Quản trị viên</Select.Item>
                  <Select.Item value="owner" label="Chủ sở hữu">Chủ sở hữu</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
          <Dialog.Footer>
            <Button variant="outline" type="button" onclick={() => (isEditRoleOpen = false)}
              >Hủy</Button
            >
            <Button type="submit">Lưu thay đổi</Button>
          </Dialog.Footer>
        </form>
      </Dialog.Content>
    </Dialog.Root>

    <div class="hidden md:block overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="border-b border-gray-100 bg-muted/40">
          <tr>
            <th
              class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
              >Nhân viên</th
            >
            <th
              class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
              >Vai trò</th
            >
            <th
              class="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-nowrap"
              >Trạng thái</th
            >
            <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          {#each allEmployees as employee (employee.id)}
            <tr class="hover:bg-muted/50 transition-colors">
              <td class="p-4 align-middle">
                <div class="flex items-center gap-3">
                  <div
                    class={cn(
                      "h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden",
                      employee.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {#if employee.image}
                      <img src={employee.image} alt="Avatar" class="h-full w-full object-cover" />
                    {:else}
                      {employee.name.split("@")[0].slice(0, 2).toUpperCase()}
                    {/if}
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-foreground">{employee.name}</span>
                    <span class="text-xs text-muted-foreground">{employee.email}</span>
                  </div>
                </div>
              </td>
              <td class="p-4 align-middle">
                <span
                  class={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    roleColors[employee.role] || "bg-gray-100 text-gray-700",
                  )}
                >
                  {employee.role}
                </span>
              </td>
              <td class="p-4 align-middle">
                <span
                  class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700"
                >
                  Active
                </span>
              </td>
              <td class="p-4 align-middle text-right">
                {#if canManageEmployees}
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
                      <DropdownMenu.Item onclick={() => openEditRole(employee)}>
                        <Pencil class="mr-2 h-4 w-4" aria-hidden="true" />
                        Sửa vai trò
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        variant="destructive"
                        onclick={() => openDeleteDialog(employee)}
                      >
                        <Trash class="mr-2 h-4 w-4" aria-hidden="true" />
                        Xóa
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                {/if}
              </td>
            </tr>
          {/each}
          {#if allEmployees.length === 0}
            <tr>
              <td colspan="4" class="h-24 text-center">
                <div class="flex flex-col items-center justify-center text-muted-foreground p-4">
                  <p>Không tìm thấy nhân viên nào.</p>
                  {#if searchQuery}
                    <Button
                      variant="link"
                      onclick={() => (searchQuery = "")}
                      class="mt-2 text-primary">Xóa bộ lọc tìm kiếm</Button
                    >
                  {/if}
                </div>
              </td>
            </tr>
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Mobile Card View -->
    <div class="md:hidden flex flex-col gap-4 p-4">
      {#if allEmployees.length === 0}
        <div
          class="flex flex-col items-center justify-center text-muted-foreground p-8 border border-dashed rounded-lg bg-muted/50"
        >
          <p>Không tìm thấy nhân viên nào.</p>
          {#if searchQuery}
            <Button variant="link" onclick={() => (searchQuery = "")} class="mt-2 text-primary"
              >Xóa bộ lọc tìm kiếm</Button
            >
          {/if}
        </div>
      {:else}
        {#each allEmployees as employee (employee.id)}
          <Card.Root>
            <Card.Header class="flex flex-row items-center gap-3 p-4 pb-2 space-y-0">
              <div
                class={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden",
                  employee.status === "active"
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {#if employee.image}
                  <img src={employee.image} alt="Avatar" class="h-full w-full object-cover" />
                {:else}
                  {employee.name.split("@")[0].slice(0, 2).toUpperCase()}
                {/if}
              </div>
              <div class="flex flex-col overflow-hidden">
                <Card.Title class="text-base truncate">{employee.name}</Card.Title>
                <Card.Description class="truncate text-xs">{employee.email}</Card.Description>
              </div>
            </Card.Header>
            <Card.Content class="p-4 pt-2 grid gap-2 text-sm">
              <div class="flex justify-between py-1 border-b border-gray-50 last:border-0">
                <span class="text-muted-foreground">Vai trò:</span>
                <span
                  class={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                    roleColors[employee.role] || "bg-gray-100 text-gray-700",
                  )}
                >
                  {employee.role}
                </span>
              </div>
              <div class="flex justify-between py-1">
                <span class="text-muted-foreground">Trạng thái:</span>
                <span
                  class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700"
                >
                  Active
                </span>
              </div>
            </Card.Content>
            {#if canManageEmployees}
              <Card.Footer class="p-3 bg-muted/30 flex justify-end gap-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  class="h-8 text-xs"
                  onclick={() => openEditRole(employee)}
                >
                  <Pencil class="mr-1.5 h-3 w-3" />
                  Sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  class="h-8 text-xs"
                  onclick={() => openDeleteDialog(employee)}
                >
                  <Trash class="mr-1.5 h-3 w-3" />
                  Xóa
                </Button>
              </Card.Footer>
            {/if}
          </Card.Root>
        {/each}
      {/if}
    </div>
  </div>
</div>

<!-- Delete Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Bạn có chắc chắn muốn xóa?</AlertDialog.Title>
      <AlertDialog.Description>
        Hành động này không thể hoàn tác. Nhân viên sẽ bị xóa khỏi tổ chức.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <form action="?/removeMember" method="POST" use:enhance={handleFormSubmit}>
      <input type="hidden" name="memberIdOrEmail" value={deletingEmployee?.id} />
      <AlertDialog.Footer>
        <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}>Hủy bỏ</AlertDialog.Cancel>
        <Button type="submit" variant="destructive">Xóa</Button>
      </AlertDialog.Footer>
    </form>
  </AlertDialog.Content>
</AlertDialog.Root>
