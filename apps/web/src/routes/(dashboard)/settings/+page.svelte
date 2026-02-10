<script lang="ts">
import { enhance } from "$app/forms";
import { invalidateAll } from "$app/navigation";
import { fetchAPI } from "$lib/api";
import CommissionSettingsPanel from "$lib/components/settings/CommissionSettingsPanel.svelte";
import * as AlertDialog from "$lib/components/ui/alert-dialog";
import { Button } from "$lib/components/ui/button";
import { Checkbox } from "$lib/components/ui/checkbox";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "$lib/components/ui/table";
import { cn } from "$lib/utils";
import {
  BadgePercent,
  Crown,
  Eye,
  Pencil,
  Plus,
  Settings2,
  ShieldCheck,
  ShieldX,
  Trash2,
  Users,
} from "@lucide/svelte";
import { ACTIONS, RESOURCES } from "@repo/constants";
import { toast } from "svelte-sonner";
import type { Member, MembershipTier } from "./+page.server";

let { data } = $props();

// --- State ---
let activeTab = $state<"tiers" | "general" | "permissions" | "commissions">("tiers");
let rankingMode = $state<"spending" | "points">("spending");
let isCreateDialogOpen = $state(false);
let isDeleteDialogOpen = $state(false);
let editingTier = $state<MembershipTier | null>(null);
let tierToDelete = $state<number | null>(null);
let isLoading = $state(false);

// Permission State
let isPermissionDialogOpen = $state(false);
let editingMember = $state<Member | null>(null);
type PermissionDraft = Record<string, string[]>;
let permissionDraft = $state<PermissionDraft>({});

const PERMISSION_COLUMNS = [
  { id: ACTIONS.READ, label: "Xem" },
  { id: ACTIONS.CREATE, label: "Tạo mới" },
  { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
  { id: ACTIONS.DELETE, label: "Xóa" },
];

const PERMISSION_GROUPS = [
  {
    resource: RESOURCES.CUSTOMER,
    label: "Khách hàng",
    actions: [
      { id: ACTIONS.READ, label: "Xem" },
      { id: ACTIONS.CREATE, label: "Tạo mới" },
      { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
      { id: ACTIONS.DELETE, label: "Xóa" },
    ],
  },
  {
    resource: RESOURCES.INVOICE,
    label: "Hóa đơn",
    actions: [
      { id: ACTIONS.READ, label: "Xem" },
      { id: ACTIONS.CREATE, label: "Tạo mới" },
      { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
      { id: ACTIONS.DELETE, label: "Xóa" },
    ],
  },
  {
    resource: RESOURCES.SERVICE,
    label: "Dịch vụ",
    actions: [
      { id: ACTIONS.READ, label: "Xem" },
      { id: ACTIONS.CREATE, label: "Tạo mới" },
      { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
      { id: ACTIONS.DELETE, label: "Xóa" },
    ],
  },
  {
    resource: RESOURCES.BOOKING,
    label: "Lịch hẹn",
    actions: [
      { id: ACTIONS.READ, label: "Xem" },
      { id: ACTIONS.CREATE, label: "Tạo mới" },
      { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
      { id: ACTIONS.DELETE, label: "Xóa" },
    ],
  },
  {
    resource: RESOURCES.EMPLOYEE,
    label: "Nhân viên",
    actions: [
      { id: ACTIONS.READ, label: "Xem" },
      { id: ACTIONS.UPDATE, label: "Chỉnh sửa" },
    ],
  },
  {
    resource: RESOURCES.REPORT,
    label: "Báo cáo",
    actions: [{ id: ACTIONS.READ, label: "Xem" }],
  },
];

// Form data
let formData = $state({
  name: "",
  minSpending: 0,
  discountPercent: 0,
  minSpendingToMaintain: null as number | null,
  sortOrder: 0,
});

// --- Helper Functions ---
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount);
}

// --- Actions ---
function openCreateDialog() {
  editingTier = null;
  formData = {
    name: "",
    minSpending: 0,
    discountPercent: 0,
    minSpendingToMaintain: null,
    sortOrder: data.tiers.length,
  };
  isCreateDialogOpen = true;
}

function openEditDialog(tier: MembershipTier) {
  editingTier = tier;
  formData = {
    name: tier.name,
    minSpending: tier.minSpending,
    discountPercent: tier.discountPercent,
    minSpendingToMaintain: tier.minSpendingToMaintain,
    sortOrder: tier.sortOrder,
  };
  isCreateDialogOpen = true;
}

function openDeleteDialog(id: number) {
  tierToDelete = id;
  isDeleteDialogOpen = true;
}

async function handleSave() {
  isLoading = true;
  try {
    if (editingTier) {
      // Update
      await fetchAPI(`/membership-tiers/${editingTier.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      toast.success("Hạng khách hàng đã được cập nhật!");
    } else {
      // Create
      await fetchAPI("/membership-tiers", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      toast.success("Hạng khách hàng mới đã được tạo!");
    }
    isCreateDialogOpen = false;
    await invalidateAll();
  } catch (error) {
    toast.error("Có lỗi xảy ra, vui lòng thử lại");
  } finally {
    isLoading = false;
  }
}

async function handleDelete() {
  if (!tierToDelete) return;

  isLoading = true;
  try {
    await fetchAPI(`/membership-tiers/${tierToDelete}`, {
      method: "DELETE",
    });
    toast.success("Đã xóa hạng khách hàng thành công.");
    tierToDelete = null;
    isDeleteDialogOpen = false;
    await invalidateAll();
  } catch (error) {
    toast.error("Có lỗi xảy ra khi xóa, vui lòng thử lại");
  } finally {
    isLoading = false;
  }
}

function openPermissionDialog(member: Member) {
  editingMember = member;
  permissionDraft = buildPermissionDraft(member);
  isPermissionDialogOpen = true;
}

function buildPermissionDraft(member: Member | null): PermissionDraft {
  if (!member?.permissions?.[0]?.permissions) return {};
  const raw = member.permissions[0].permissions;
  const draft: PermissionDraft = {};
  for (const [resource, actions] of Object.entries(raw)) {
    draft[resource] = [...actions];
  }
  return draft;
}

function hasDraftPermission(resource: string, action: string): boolean {
  return (permissionDraft[resource] || []).includes(action);
}

function setDraftPermission(resource: string, action: string, enabled: boolean) {
  const current = new Set(permissionDraft[resource] || []);
  if (enabled) current.add(action);
  else current.delete(action);

  permissionDraft = {
    ...permissionDraft,
    [resource]: Array.from(current),
  };
}

function setResourcePermissions(resource: string, actions: string[], enabled: boolean) {
  permissionDraft = {
    ...permissionDraft,
    [resource]: enabled ? [...actions] : [],
  };
}

function applyPermissionPreset(preset: "read" | "full" | "clear") {
  const next: PermissionDraft = {};
  for (const group of PERMISSION_GROUPS) {
    if (preset === "clear") {
      next[group.resource] = [];
    } else if (preset === "read") {
      next[group.resource] = group.actions
        .filter((action) => action.id === ACTIONS.READ)
        .map((action) => action.id);
    } else {
      next[group.resource] = group.actions.map((action) => action.id);
    }
  }
  permissionDraft = next;
}

function isResourceFullySelected(group: (typeof PERMISSION_GROUPS)[number]): boolean {
  const allowedActions = group.actions.map((action) => action.id);
  if (allowedActions.length === 0) return false;
  return allowedActions.every((action) => hasDraftPermission(group.resource, action));
}

function isResourcePartiallySelected(group: (typeof PERMISSION_GROUPS)[number]): boolean {
  const allowedActions = group.actions.map((action) => action.id);
  if (allowedActions.length === 0) return false;
  const selectedCount = allowedActions.filter((action) =>
    hasDraftPermission(group.resource, action),
  ).length;
  return selectedCount > 0 && selectedCount < allowedActions.length;
}

function getSelectedCountForResource(resource: string): number {
  return (permissionDraft[resource] || []).length;
}

function isActionAvailable(group: (typeof PERMISSION_GROUPS)[number], actionId: string): boolean {
  return group.actions.some((action) => action.id === actionId);
}

let totalPermissionOptions = $derived(
  PERMISSION_GROUPS.reduce((total, group) => total + group.actions.length, 0),
);
let grantedPermissionCount = $derived(
  Object.values(permissionDraft).reduce((total, actions) => total + actions.length, 0),
);

function getTotalPermissions(member: Member): number {
  if (!member.permissions || member.permissions.length === 0) return 0;

  const permRecord = member.permissions[0];
  if (!permRecord || !permRecord.permissions) return 0;

  // Count total number of actions across all resources
  return Object.values(permRecord.permissions).reduce(
    (total, actions) => total + actions.length,
    0,
  );
}
</script>

<svelte:head>
  <title>Cài đặt | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <!-- Header -->
  <div class="page-hero p-5 sm:p-6">
    <h1 class="section-title text-2xl font-bold tracking-tight text-foreground">Cài đặt</h1>
    <p class="text-muted-foreground mt-1">Quản lý cấu hình hệ thống của bạn</p>
  </div>

  <!-- Tabs -->
  <div class="w-full">
    <div class="filter-strip flex w-fit gap-1 p-1">
      <Button
        variant={activeTab === "tiers" ? "default" : "ghost"}
        onclick={() => (activeTab = "tiers")}
        class="rounded-lg px-4 py-2 text-sm font-medium"
      >
        <Crown class="h-4 w-4 mr-2" />
        Hạng khách hàng
      </Button>
      <Button
        variant={activeTab === "general" ? "default" : "ghost"}
        onclick={() => (activeTab = "general")}
        class="rounded-lg px-4 py-2 text-sm font-medium"
      >
        <Settings2 class="h-4 w-4 mr-2" />
        Cài đặt chung
      </Button>
      <Button
        variant={activeTab === "permissions" ? "default" : "ghost"}
        onclick={() => (activeTab = "permissions")}
        class="rounded-lg px-4 py-2 text-sm font-medium"
      >
        <Users class="h-4 w-4 mr-2" />
        Phân quyền
      </Button>
      <Button
        variant={activeTab === "commissions" ? "default" : "ghost"}
        onclick={() => (activeTab = "commissions")}
        class="rounded-lg px-4 py-2 text-sm font-medium"
      >
        <BadgePercent class="h-4 w-4 mr-2" />
        Hoa hồng
      </Button>
    </div>

    {#if activeTab === "tiers"}
      <div class="mt-6">
        <!-- Ranking Mode Selection -->
        <div class="panel-shell mb-6 p-6">
          <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Vui lòng chọn cơ chế xét hạng phù hợp:
          </h3>
          <div class="flex items-center gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rankingMode"
                value="spending"
                checked={rankingMode === "spending"}
                onchange={() => (rankingMode = "spending")}
                class="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span class="text-sm font-medium">Xét hạng theo chỉ tiêu</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="rankingMode"
                value="points"
                checked={rankingMode === "points"}
                onchange={() => (rankingMode = "points")}
                class="w-4 h-4 text-primary border-gray-300 focus:ring-primary"
              />
              <span class="text-sm font-medium">Xét hạng theo điểm tích lũy</span>
            </label>
          </div>
        </div>

        <!-- Tiers Table -->
        <div class="table-shell">
          <div class="flex items-center justify-between p-4 border-b border-border/60">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Chi tiết điều kiện
            </h3>
            <Button onclick={openCreateDialog} class="bg-primary text-white hover:bg-primary/90">
              <Plus class="h-4 w-4 mr-2" />
              Thêm hạng khách hàng
            </Button>
          </div>

          <Table>
            <TableHeader class="bg-gray-50/50">
              <TableRow class="hover:bg-transparent">
                <TableHead class="font-semibold">Hạng</TableHead>
                <TableHead class="font-semibold">Chi tiêu tối thiểu</TableHead>
                <TableHead class="font-semibold">Giảm giá mặc định</TableHead>
                <TableHead class="font-semibold">Chi tiêu tối thiểu để giữ hạng</TableHead>
                <TableHead class="text-right font-semibold w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.tiers as tier (tier.id)}
                <TableRow class="group hover:bg-purple-50/30 transition-colors">
                  <TableCell>
                    <span class="text-primary font-medium">{tier.name}</span>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(tier.minSpending)}
                  </TableCell>
                  <TableCell>
                    <span class="text-primary font-medium">{tier.discountPercent} %</span>
                  </TableCell>
                  <TableCell>
                    {#if tier.minSpendingToMaintain}
                      {formatCurrency(tier.minSpendingToMaintain)}
                    {:else}
                      <span class="text-primary">không áp dụng</span>
                    {/if}
                  </TableCell>
                  <TableCell class="text-right">
                    <div class="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onclick={() => openEditDialog(tier)}
                        class="h-8 w-8 bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Pencil class="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onclick={() => openDeleteDialog(tier.id)}
                        class="h-8 w-8 bg-red-500 hover:bg-red-600 text-white"
                      >
                        <Trash2 class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              {/each}
              {#if data.tiers.length === 0}
                <TableRow>
                  <TableCell colspan={5} class="h-24 text-center text-muted-foreground">
                    Chưa có hạng khách hàng nào. Hãy tạo hạng đầu tiên!
                  </TableCell>
                </TableRow>
              {/if}
            </TableBody>
          </Table>

          <!-- Pagination Footer -->
          <div
            class="flex items-center justify-between px-4 py-4 border-t border-border/60 bg-gray-50/30"
          >
            <div class="text-sm text-muted-foreground">
              Hiển thị từ <span class="font-medium text-foreground">1</span>
              đến
              <span class="font-medium text-foreground">{data.tiers.length}</span>
              trên tổng số
              <span class="font-medium text-foreground">{data.tiers.length}</span>
            </div>
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled class="h-8 w-8 p-0">&lt;</Button>
              <div class="flex items-center border border-border rounded px-2 py-1">
                <span class="text-sm font-medium">1</span>
              </div>
              <Button variant="outline" size="sm" disabled class="h-8 w-8 p-0">&gt;</Button>
              <Select.Root type="single" value="20 / trang">
                <Select.Trigger class="h-8 w-[120px]">20 / trang</Select.Trigger>
                <Select.Content>
                  <Select.Item value="20 / trang" label="20 / trang">20 / trang</Select.Item>
                  <Select.Item value="50 / trang" label="50 / trang">50 / trang</Select.Item>
                  <Select.Item value="100 / trang" label="100 / trang">100 / trang</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
        </div>
      </div>
    {/if}

    {#if activeTab === "general"}
      <div class="mt-6">
        <div class="panel-shell p-6">
          <p class="text-muted-foreground">Các cài đặt chung sẽ sớm được thêm vào...</p>
        </div>
      </div>
    {/if}

    {#if activeTab === "permissions"}
      <div class="mt-6">
        <div class="table-shell">
          <div class="p-4 border-b border-border/60">
            <h3 class="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Danh sách nhân viên
            </h3>
          </div>
          <Table>
            <TableHeader class="bg-gray-50/50">
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Quyền hạn</TableHead>
                <TableHead class="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {#each data.members as member (member.id)}
                <TableRow>
                  <TableCell class="font-medium">
                    <div class="flex items-center gap-2">
                      {#if member.user.image}
                        <img
                          src={member.user.image}
                          alt={member.user.name}
                          class="h-8 w-8 rounded-full"
                        />
                      {:else}
                        <div
                          class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600"
                        >
                          {member.user.name.charAt(0)}
                        </div>
                      {/if}
                      {member.user.name}
                    </div>
                  </TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    <span
                      class={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        member.role === "owner"
                          ? "bg-purple-100 text-purple-700"
                          : member.role === "admin"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-100 text-gray-700",
                      )}
                    >
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span class="text-xs text-muted-foreground">
                      {getTotalPermissions(member)} quyền được cấp
                    </span>
                  </TableCell>
                  <TableCell class="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onclick={() => openPermissionDialog(member)}
                      class="text-primary hover:text-primary/80"
                    >
                      <Settings2 class="h-4 w-4 mr-2" />
                      Phân quyền
                    </Button>
                  </TableCell>
                </TableRow>
              {/each}
              {#if data.members.length === 0}
                <TableRow>
                  <TableCell colspan={5} class="h-24 text-center text-muted-foreground">
                    Không có nhân viên nào.
                  </TableCell>
                </TableRow>
              {/if}
            </TableBody>
          </Table>
        </div>
      </div>
    {/if}

    {#if activeTab === "commissions"}
      <div class="mt-6">
        <CommissionSettingsPanel
          data={{
            members: data.members,
            services: data.services,
            products: data.products,
            serviceCategories: data.serviceCategories,
            productCategories: data.productCategories,
            rules: data.commissionRules,
            canUpdate: true,
          }}
        />
      </div>
    {/if}
  </div>
</div>

<!-- Create/Edit Dialog -->
<Dialog.Root bind:open={isCreateDialogOpen}>
  <Dialog.Content class="sm:max-w-[425px]">
    <Dialog.Header>
      <Dialog.Title>
        {editingTier ? "Chỉnh sửa hạng" : "Thêm hạng mới"}
      </Dialog.Title>
      <Dialog.Description>
        {editingTier
          ? "Cập nhật thông tin chi tiết cho hạng khách hàng này."
          : "Điền thông tin để tạo hạng khách hàng mới."}
      </Dialog.Description>
    </Dialog.Header>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="name">Tên hạng</Label>
        <Input id="name" bind:value={formData.name} placeholder="Ví dụ: Thương, Thân, Quen..." />
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div class="grid gap-2">
          <Label for="minSpending">Chi tiêu tối thiểu (VNĐ)</Label>
          <Input id="minSpending" type="number" bind:value={formData.minSpending} />
        </div>
        <div class="grid gap-2">
          <Label for="discountPercent">Giảm giá (%)</Label>
          <Input id="discountPercent" type="number" bind:value={formData.discountPercent} />
        </div>
      </div>
      <div class="grid gap-2">
        <Label for="minSpendingToMaintain">Chi tiêu để giữ hạng (tùy chọn)</Label>
        <Input
          id="minSpendingToMaintain"
          type="number"
          bind:value={formData.minSpendingToMaintain}
          placeholder="Để trống nếu không áp dụng"
        />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="outline" onclick={() => (isCreateDialogOpen = false)} disabled={isLoading}>
        Hủy
      </Button>
      <Button
        onclick={handleSave}
        disabled={isLoading}
        class="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Permission Dialog -->
<Dialog.Root bind:open={isPermissionDialogOpen}>
  <Dialog.Content class="sm:max-w-[760px] max-h-[88vh] flex flex-col">
    <Dialog.Header>
      <Dialog.Title>Phân quyền nhân viên</Dialog.Title>
      <Dialog.Description>
        Cấp quyền truy cập chi tiết cho <b>{editingMember?.user.name}</b>
      </Dialog.Description>
      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span class="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
          Đã cấp: <span class="font-semibold text-foreground">{grantedPermissionCount}</span> /
          <span class="font-semibold text-foreground">{totalPermissionOptions}</span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-7 gap-1.5"
          onclick={() => applyPermissionPreset("read")}
        >
          <Eye class="h-3.5 w-3.5" />
          Chỉ xem
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-7 gap-1.5"
          onclick={() => applyPermissionPreset("full")}
        >
          <ShieldCheck class="h-3.5 w-3.5" />
          Toàn quyền
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          class="h-7 gap-1.5 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          onclick={() => applyPermissionPreset("clear")}
        >
          <ShieldX class="h-3.5 w-3.5" />
          Bỏ chọn hết
        </Button>
      </div>
    </Dialog.Header>

    <form
      action="?/updatePermissions"
      method="POST"
      class="flex min-h-0 flex-1 flex-col"
      use:enhance={() => {
        return async ({ result, update }) => {
          if (result.type === "success") {
            toast.success("Cập nhật quyền thành công!");
            isPermissionDialogOpen = false;
          } else {
            toast.error("Có lỗi xảy ra");
          }
          await update();
        };
      }}
    >
      <input type="hidden" name="memberId" value={editingMember?.id} />
      {#each Object.entries(permissionDraft) as [resource, actions]}
        {#each actions as action}
          <input type="hidden" name={"permissions[" + resource + "][" + action + "]"} value="on" />
        {/each}
      {/each}

      <div class="min-h-0 flex-1 py-4">
        <div class="h-full space-y-3">
          <div
            class="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground"
          >
            Mẹo: Chọn vào tên tài nguyên để bật/tắt nhanh toàn bộ quyền của dòng đó.
          </div>

          <div
            class="hidden h-full overflow-auto rounded-xl border border-border/70 bg-background md:block"
          >
            <div class="min-w-[700px] space-y-2 p-3">
              <div
                class="sticky top-0 z-10 grid grid-cols-[minmax(220px,1fr)_96px_96px_96px_96px] items-center rounded-lg border border-border/70 bg-muted/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur"
              >
                <span>Tài nguyên</span>
                {#each PERMISSION_COLUMNS as column}
                  <span class="text-center">{column.label}</span>
                {/each}
              </div>

              {#each PERMISSION_GROUPS as group}
                <div
                  class="grid grid-cols-[minmax(220px,1fr)_96px_96px_96px_96px] items-center rounded-lg border border-border/70 bg-white px-3 py-2 transition-colors hover:bg-muted/20"
                >
                  <div class="flex items-center gap-2">
                    <Checkbox
                      checked={isResourceFullySelected(group)}
                      indeterminate={isResourcePartiallySelected(group)}
                      onCheckedChange={(checked) =>
                        setResourcePermissions(
                          group.resource,
                          group.actions.map((action) => action.id),
                          checked === true,
                        )}
                    />
                    <span class="font-medium">{group.label}</span>
                    <span
                      class="ml-auto rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                    >
                      {getSelectedCountForResource(group.resource)}/{group.actions.length}
                    </span>
                  </div>

                  {#each PERMISSION_COLUMNS as column}
                    <div class="flex justify-center">
                      {#if isActionAvailable(group, column.id)}
                        <Checkbox
                          id={group.resource + "-" + column.id}
                          class="border-gray-300 text-primary focus:ring-primary"
                          checked={hasDraftPermission(group.resource, column.id)}
                          onCheckedChange={(checked) =>
                            setDraftPermission(group.resource, column.id, checked === true)}
                        />
                      {:else}
                        <span
                          class="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          -
                        </span>
                      {/if}
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>

          <div class="space-y-3 overflow-auto md:hidden">
            {#each PERMISSION_GROUPS as group}
              <div class="rounded-lg border border-border/70 bg-background p-3">
                <div class="mb-3 flex items-center gap-2">
                  <Checkbox
                    checked={isResourceFullySelected(group)}
                    indeterminate={isResourcePartiallySelected(group)}
                    onCheckedChange={(checked) =>
                      setResourcePermissions(
                        group.resource,
                        group.actions.map((action) => action.id),
                        checked === true,
                      )}
                  />
                  <span class="font-medium">{group.label}</span>
                  <span
                    class="ml-auto rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {getSelectedCountForResource(group.resource)}/{group.actions.length}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-2">
                  {#each PERMISSION_COLUMNS as column}
                    {#if isActionAvailable(group, column.id)}
                      <button
                        type="button"
                        class={cn(
                          "h-9 rounded-md border text-sm font-medium transition-colors",
                          hasDraftPermission(group.resource, column.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-background text-muted-foreground",
                        )}
                        onclick={() =>
                          setDraftPermission(
                            group.resource,
                            column.id,
                            !hasDraftPermission(group.resource, column.id),
                          )}
                      >
                        {column.label}
                      </button>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>

      <Dialog.Footer>
        <Button variant="outline" type="button" onclick={() => (isPermissionDialogOpen = false)}
          >Hủy</Button
        >
        <Button type="submit">Lưu quyền hạn</Button>
      </Dialog.Footer>
    </form>
  </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
  <AlertDialog.Content>
    <AlertDialog.Header>
      <AlertDialog.Title>Bạn có chắc chắn muốn xóa?</AlertDialog.Title>
      <AlertDialog.Description>
        Hành động này không thể hoàn tác. Hạng khách hàng này sẽ bị xóa vĩnh viễn khỏi cơ sở dữ
        liệu.
      </AlertDialog.Description>
    </AlertDialog.Header>
    <AlertDialog.Footer>
      <AlertDialog.Cancel onclick={() => (isDeleteDialogOpen = false)} disabled={isLoading}>
        Hủy bỏ
      </AlertDialog.Cancel>
      <AlertDialog.Action
        onclick={handleDelete}
        disabled={isLoading}
        class="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
      >
        {isLoading ? "Đang xóa..." : "Xóa hạng"}
      </AlertDialog.Action>
    </AlertDialog.Footer>
  </AlertDialog.Content>
</AlertDialog.Root>
