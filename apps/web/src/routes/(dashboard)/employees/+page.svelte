<script lang="ts">
    import { Card } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Dialog from "$lib/components/ui/dialog";
    import { Select } from "$lib/components/ui/select";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import {
        Plus,
        Search,
        Mail,
        MoreVertical,
        Loader2,
        Trash,
        Pencil,
    } from "@lucide/svelte";
    import { cn } from "$lib/utils";
    import { enhance } from "$app/forms";
    import { toast } from "svelte-sonner";
    import type { PageData } from "./$types";
    import { page } from "$app/stores";

    export let data: PageData;

    // Employee management (create/update/delete) is restricted to owner/admin only
    // since those actions are N/A for regular members in the permission system
    $: canManageEmployees =
        $page.data.memberRole === "owner" || $page.data.memberRole === "admin";

    let searchQuery = "";
    let isAddOpen = false;

    // Add Member Form
    // (We rely on form submission now, so local binding only for UI if needed, or just regular inputs)
    // But keeping bindings is fine for clearing.
    let name = "";
    let email = "";
    let password = "";
    let role = "member";

    // Edit Role Form
    let isEditRoleOpen = false;
    let editingEmployee: any = null;
    let editRoleValue = "member";

    // Delete State
    let isDeleteDialogOpen = false;
    let deletingEmployee: any = null;

    // Map members for display
    $: allEmployees = data.members
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
    <!-- Header -->

    <!-- Employees Content -->
    <div
        class="rounded-xl border border-gray-100 bg-card text-card-foreground shadow-sm"
    >
        <div
            class="p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-gray-100"
        >
            <div>
                <h3 class="font-semibold leading-none tracking-tight">
                    Danh sách nhân viên
                </h3>
                <p class="text-sm text-muted-foreground mt-2">
                    Quản lý {allEmployees.length} nhân viên trong hệ thống
                </p>
            </div>

            <div class="flex items-center gap-2 w-full sm:w-auto">
                <div class="relative flex-1 sm:w-64">
                    <Search
                        class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm nhân viên..."
                        class="pl-9 h-9"
                        bind:value={searchQuery}
                    />
                </div>
                {#if canManageEmployees}
                    <Dialog.Root bind:open={isAddOpen}>
                        <Dialog.Trigger>
                            <Button
                                class="bg-purple-600 hover:bg-purple-700 h-9"
                            >
                                <Plus class="h-4 w-4 mr-2" />
                                Thêm
                            </Button>
                        </Dialog.Trigger>
                        <Dialog.Content>
                            <Dialog.Header>
                                <Dialog.Title>Thêm nhân viên mới</Dialog.Title>
                                <Dialog.Description>
                                    Tạo tài khoản mới cho nhân viên.
                                </Dialog.Description>
                            </Dialog.Header>
                            <form
                                action="?/createMember"
                                method="POST"
                                use:enhance={handleFormSubmit}
                            >
                                <div class="grid gap-4 py-4">
                                    <div class="grid gap-2">
                                        <Label for="name">Tên hiển thị</Label>
                                        <Input
                                            id="name"
                                            name="name"
                                            bind:value={name}
                                            placeholder="Nguyễn Văn A"
                                            required
                                        />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="email">Email</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            bind:value={email}
                                            placeholder="nhanvien@salon.com"
                                            required
                                        />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="password">Mật khẩu</Label>
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            bind:value={password}
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label for="role">Vai trò</Label>
                                        <select
                                            name="role"
                                            class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            bind:value={role}
                                        >
                                            <option value="member"
                                                >Thành viên</option
                                            >
                                            <option value="admin"
                                                >Quản trị viên</option
                                            >
                                            <option value="owner"
                                                >Chủ sở hữu</option
                                            >
                                        </select>
                                    </div>
                                </div>
                                <Dialog.Footer>
                                    <Button
                                        variant="outline"
                                        type="button"
                                        onclick={() => (isAddOpen = false)}
                                        >Hủy</Button
                                    >
                                    <Button type="submit">Thêm nhân viên</Button
                                    >
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
                <form
                    action="?/updateRole"
                    method="POST"
                    use:enhance={handleFormSubmit}
                >
                    <input
                        type="hidden"
                        name="memberId"
                        value={editingEmployee?.id}
                    />
                    <div class="grid gap-4 py-4">
                        <div class="grid gap-2">
                            <Label for="edit-role">Vai trò</Label>
                            <select
                                name="role"
                                class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                bind:value={editRoleValue}
                            >
                                <option value="member">Thành viên</option>
                                <option value="admin">Quản trị viên</option>
                                <option value="owner">Chủ sở hữu</option>
                            </select>
                        </div>
                    </div>
                    <Dialog.Footer>
                        <Button
                            variant="outline"
                            type="button"
                            onclick={() => (isEditRoleOpen = false)}>Hủy</Button
                        >
                        <Button type="submit">Lưu thay đổi</Button>
                    </Dialog.Footer>
                </form>
            </Dialog.Content>
        </Dialog.Root>

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
                        <th
                            class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                        ></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    {#each allEmployees as employee (employee.id)}
                        <tr class="hover:bg-muted/50 transition-colors">
                            <td class="p-4 align-middle">
                                <input
                                    type="checkbox"
                                    class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                            </td>
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
                                            <img
                                                src={employee.image}
                                                alt="Avatar"
                                                class="h-full w-full object-cover"
                                            />
                                        {:else}
                                            {employee.name
                                                .split("@")[0]
                                                .slice(0, 2)
                                                .toUpperCase()}
                                        {/if}
                                    </div>
                                    <div class="flex flex-col">
                                        <span
                                            class="font-medium text-foreground"
                                            >{employee.name}</span
                                        >
                                        <span
                                            class="text-xs text-muted-foreground"
                                            >{employee.email}</span
                                        >
                                    </div>
                                </div>
                            </td>
                            <td class="p-4 align-middle">
                                <span
                                    class={cn(
                                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                        roleColors[employee.role] ||
                                            "bg-gray-100 text-gray-700",
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
                                                    openEditRole(employee)}
                                            >
                                                <Pencil class="mr-2 h-4 w-4" />
                                                Sửa vai trò
                                            </DropdownMenu.Item>
                                            <DropdownMenu.Item
                                                class="text-red-600 focus:text-red-600"
                                                onclick={() =>
                                                    openDeleteDialog(employee)}
                                            >
                                                <Trash class="mr-2 h-4 w-4" />
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
                            <td colspan="5" class="h-24 text-center">
                                <div
                                    class="flex flex-col items-center justify-center text-muted-foreground p-4"
                                >
                                    <p>Không tìm thấy nhân viên nào.</p>
                                    {#if searchQuery}
                                        <Button
                                            variant="link"
                                            onclick={() => (searchQuery = "")}
                                            class="mt-2 text-primary"
                                            >Xóa bộ lọc tìm kiếm</Button
                                        >
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

<!-- Delete Dialog -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Bạn có chắc chắn muốn xóa?</AlertDialog.Title>
            <AlertDialog.Description>
                Hành động này không thể hoàn tác. Nhân viên sẽ bị xóa khỏi tổ
                chức.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <form
            action="?/removeMember"
            method="POST"
            use:enhance={handleFormSubmit}
        >
            <input
                type="hidden"
                name="memberIdOrEmail"
                value={deletingEmployee?.id}
            />
            <AlertDialog.Footer>
                <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)}
                    >Hủy bỏ</AlertDialog.Cancel
                >
                <Button type="submit" variant="destructive">Xóa</Button>
            </AlertDialog.Footer>
        </form>
    </AlertDialog.Content>
</AlertDialog.Root>
