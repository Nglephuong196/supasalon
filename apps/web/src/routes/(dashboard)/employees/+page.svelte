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
            name: m.user.name,
            email: m.user.email,
            image: m.user.image,
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
    <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
        <div>
            <h1 class="text-2xl font-bold tracking-tight">Nhân viên</h1>
            <p class="text-muted-foreground">Quản lý nhân viên salon</p>
        </div>

        {#if canManageEmployees}
            <Dialog.Root bind:open={isAddOpen}>
                <Dialog.Trigger>
                    <Button class="bg-purple-600 hover:bg-purple-700">
                        <Plus class="h-4 w-4 mr-2" />
                        Thêm nhân viên
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
                                onclick={() => (isAddOpen = false)}>Hủy</Button
                            >
                            <Button type="submit">Thêm nhân viên</Button>
                        </Dialog.Footer>
                    </form>
                </Dialog.Content>
            </Dialog.Root>
        {/if}

        <!-- Edit Role Dialog -->
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
    </div>

    <!-- Search -->
    <div class="flex items-center gap-4">
        <div class="relative flex-1 max-w-sm">
            <Search
                class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm nhân viên..."
                class="pl-9"
                bind:value={searchQuery}
            />
        </div>
    </div>

    <!-- Employees Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {#each allEmployees as employee (employee.id)}
            <Card class="p-4 hover:shadow-md transition-shadow relative group">
                <!-- Action Menu (only for owners/admins) -->
                {#if canManageEmployees}
                    <div
                        class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
                                {#snippet child({ props })}
                                    <Button
                                        {...props}
                                        variant="ghost"
                                        size="icon"
                                        class="h-8 w-8"
                                    >
                                        <MoreVertical class="h-4 w-4" />
                                    </Button>
                                {/snippet}
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content align="end">
                                <DropdownMenu.Label
                                    >Hành động</DropdownMenu.Label
                                >
                                <DropdownMenu.Item
                                    onclick={() => openEditRole(employee)}
                                >
                                    <Pencil class="mr-2 h-4 w-4" />
                                    Sửa vai trò
                                </DropdownMenu.Item>
                                <DropdownMenu.Item
                                    class="text-red-600"
                                    onclick={() => openDeleteDialog(employee)}
                                >
                                    <Trash class="mr-2 h-4 w-4" />
                                    Xóa
                                </DropdownMenu.Item>
                            </DropdownMenu.Content>
                        </DropdownMenu.Root>
                    </div>
                {/if}

                <div class="flex items-start gap-4">
                    <div
                        class={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium shrink-0 overflow-hidden",
                            employee.status === "active"
                                ? "bg-primary/10 text-primary"
                                : "bg-muted text-muted-foreground",
                        )}
                    >
                        {#if employee.image}
                            <!-- svelte-ignore a11y-img-redundant-alt -->
                            <img
                                src={employee.image}
                                alt="User Avatar"
                                class="h-full w-full object-cover"
                            />
                        {:else}
                            {employee.name
                                .split("@")[0]
                                .slice(0, 2)
                                .toUpperCase()}
                        {/if}
                    </div>
                    <div class="flex-1 min-w-0 pr-6">
                        <div class="flex items-center gap-2">
                            <h3
                                class="font-semibold truncate"
                                title={employee.name}
                            >
                                {employee.name}
                            </h3>
                        </div>

                        <div class="flex flex-wrap gap-2 mt-1">
                            <span
                                class={cn(
                                    "inline-block px-2 py-0.5 rounded-full text-xs font-medium",
                                    roleColors[employee.role] ||
                                        "bg-gray-100 text-gray-700",
                                )}
                            >
                                {employee.role}
                            </span>
                        </div>

                        <div class="space-y-1 mt-2">
                            <div
                                class="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                                <Mail class="h-3 w-3" />
                                <span class="truncate" title={employee.email}
                                    >{employee.email}</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        {/each}

        {#if allEmployees.length === 0}
            <div
                class="col-span-full border border-dashed rounded-lg p-12 flex flex-col items-center justify-center text-muted-foreground"
            >
                <p>Không tìm thấy nhân viên nào.</p>
                {#if searchQuery}
                    <Button
                        variant="link"
                        onclick={() => (searchQuery = "")}
                        class="mt-2">Xóa bộ lọc tìm kiếm</Button
                    >
                {/if}
            </div>
        {/if}
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
