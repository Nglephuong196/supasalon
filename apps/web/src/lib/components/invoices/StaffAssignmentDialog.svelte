<script lang="ts">
import { Badge } from "$lib/components/ui/badge";
import { Button } from "$lib/components/ui/button";
import * as Dialog from "$lib/components/ui/dialog";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Popover from "$lib/components/ui/popover";
import { Separator } from "$lib/components/ui/separator";
import { Switch } from "$lib/components/ui/switch";
import {
  ChevronDown,
  Gift,
  Percent,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  UserCircle,
  Users,
  X,
} from "@lucide/svelte";
import { fly, slide } from "svelte/transition";

interface Props {
  open: boolean;
  items: any[];
  staff: any[];
  commissionRules?: any[];
  onConfirm: () => void;
}

let {
  open = $bindable(false),
  items = $bindable([]),
  staff = [],
  commissionRules = [],
  onConfirm,
}: Props = $props();
type IndexedAssignmentItem = { item: any; index: number };
let staffSearchQuery = $state("");
let filteredStaff = $derived.by(() => {
  const normalized = staffSearchQuery.trim().toLowerCase();
  if (!normalized) return staff;
  return staff.filter((member: any) => member.name?.toLowerCase().includes(normalized));
});
let serviceAssignments = $derived.by(() =>
  items
    .map((item: any, index: number): IndexedAssignmentItem => ({ item, index }))
    .filter((entry: IndexedAssignmentItem) => entry.item.type === "service"),
);
let productAssignments = $derived.by(() =>
  items
    .map((item: any, index: number): IndexedAssignmentItem => ({ item, index }))
    .filter((entry: IndexedAssignmentItem) => entry.item.type === "product"),
);
let orderedAssignments = $derived([...serviceAssignments, ...productAssignments]);
let totalAssigned = $derived(
  items.reduce(
    (sum: number, item: any) =>
      sum +
      (item.staffTechnicians || []).filter((s: any) => s.staffId).length +
      (item.staffSellers || []).filter((s: any) => s.staffId).length,
    0,
  ),
);
let itemWithAssignments = $derived(
  items.filter(
    (item: any) =>
      (item.staffTechnicians || []).some((s: any) => s.staffId) ||
      (item.staffSellers || []).some((s: any) => s.staffId),
  ).length,
);

function addStaff(item: any, role: "technician" | "seller") {
  const newEntry = {
    staffId: "",
    commissionValue: 0,
    commissionType: "percent" as "percent" | "fixed",
    bonus: 0,
    showBonus: false,
    role: role,
  };
  if (role === "technician") {
    item.staffTechnicians = [...(item.staffTechnicians || []), newEntry];
  } else {
    item.staffSellers = [...(item.staffSellers || []), newEntry];
  }
}

function removeStaff(item: any, role: "technician" | "seller", index: number) {
  if (role === "technician") {
    item.staffTechnicians = item.staffTechnicians.filter((_: any, i: number) => i !== index);
  } else {
    item.staffSellers = item.staffSellers.filter((_: any, i: number) => i !== index);
  }
}

function getStaffInitials(name: string): string {
  if (!name) return "?";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getStaffName(staffId: string): string {
  return staff.find((s) => s.id === staffId)?.name || "";
}

function getCommissionRule(item: any, staffId: string) {
  if (!item?.referenceId || !staffId) return null;

  return (
    commissionRules.find(
      (rule: any) =>
        rule.staffId === staffId &&
        rule.itemType === item.type &&
        Number(rule.itemId) === Number(item.referenceId),
    ) || null
  );
}

function applyCommissionFromRule(item: any, staffEntry: any, staffId: string) {
  staffEntry.staffId = staffId;

  const matchedRule = getCommissionRule(item, staffId);
  if (!matchedRule) {
    staffEntry.commissionType = "percent";
    staffEntry.commissionValue = 0;
    staffEntry.ruleApplied = false;
    return;
  }

  staffEntry.commissionType = matchedRule.commissionType;
  staffEntry.commissionValue = Number(matchedRule.commissionValue) || 0;
  staffEntry.ruleApplied = true;
}

function getRuleLabel(staffEntry: any) {
  const value = Number(staffEntry.commissionValue || 0);
  if (staffEntry.commissionType === "percent") return `Theo quy tắc: ${value}%`;
  return `Theo quy tắc: ${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

// Normalize staff entries when dialog opens
$effect(() => {
  if (open) {
    for (const item of items) {
      for (const s of item.staffTechnicians || []) {
        if (s.showBonus === undefined) {
          s.showBonus = (s.bonus || 0) > 0;
        }
        if (s.ruleApplied === undefined) s.ruleApplied = false;
      }
      for (const s of item.staffSellers || []) {
        if (s.showBonus === undefined) {
          s.showBonus = (s.bonus || 0) > 0;
        }
        if (s.ruleApplied === undefined) s.ruleApplied = false;
      }
    }
  } else {
    staffSearchQuery = "";
  }
});
</script>

<Dialog.Root bind:open>
  <Dialog.Content class="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
    <!-- Header -->
    <Dialog.Header class="p-6 pb-4 shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
      <Dialog.Title class="flex items-center gap-3 text-xl">
        <div class="p-2 bg-primary/10 rounded-lg">
          <Users class="h-5 w-5 text-primary" />
        </div>
        Xếp nhân viên
      </Dialog.Title>
      <Dialog.Description class="text-muted-foreground">
        Phân công nhân viên thực hiện và tính hoa hồng cho từng dịch vụ/sản phẩm
      </Dialog.Description>
      <div class="mt-3 grid grid-cols-2 gap-2 sm:w-fit sm:grid-cols-3">
        <div class="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs">
          <span class="text-muted-foreground">Mục trong hóa đơn:</span>
          <span class="ml-1 font-semibold text-foreground">{items.length}</span>
        </div>
        <div class="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs">
          <span class="text-muted-foreground">Đã phân công:</span>
          <span class="ml-1 font-semibold text-foreground"
            >{itemWithAssignments}/{items.length}</span
          >
        </div>
        <div class="rounded-md border border-border/70 bg-background px-3 py-1.5 text-xs">
          <span class="text-muted-foreground">Tổng lượt xếp:</span>
          <span class="ml-1 font-semibold text-foreground">{totalAssigned}</span>
        </div>
      </div>
    </Dialog.Header>

    <Separator class="shrink-0" />

    <!-- Content -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div class="p-6 space-y-4">
        {#if items.length === 0}
          <div class="text-center py-12 space-y-4">
            <div class="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ShoppingBag class="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p class="font-medium text-lg">Chưa có dịch vụ nào</p>
              <p class="text-sm text-muted-foreground">
                Thêm dịch vụ hoặc sản phẩm vào hóa đơn trước khi phân công nhân viên
              </p>
            </div>
          </div>
        {:else}
          {#each orderedAssignments as entry, orderIndex (entry.index)}
            {@const item = entry.item}
            {@const i = entry.index}
            {#if orderIndex === 0 || orderedAssignments[orderIndex - 1].item.type !== item.type}
              <div
                class="rounded-lg border px-3 py-2 {item.type === 'service'
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-emerald-300 bg-emerald-50/70'}"
              >
                <div class="flex items-center justify-between">
                  <div
                    class="flex items-center gap-2 text-sm font-semibold {item.type === 'service'
                      ? 'text-primary'
                      : 'text-emerald-700'}"
                  >
                    {#if item.type === "service"}
                      <Sparkles class="h-4 w-4" />
                      Dịch vụ
                    {:else}
                      <ShoppingBag class="h-4 w-4" />
                      Sản phẩm
                    {/if}
                  </div>
                  <Badge variant="secondary">
                    {item.type === "service"
                      ? serviceAssignments.length
                      : productAssignments.length}
                  </Badge>
                </div>
              </div>
            {/if}
            <div
              class="rounded-xl bg-card shadow-sm overflow-hidden transition-all hover:shadow-md"
              in:fly={{ y: 20, duration: 300, delay: i * 50 }}
            >
              <!-- Item Header -->
              <div
                class="px-4 py-3 flex items-center justify-between gap-4 {item.type === 'service'
                  ? 'bg-primary/5 border-l-4 border-l-primary'
                  : 'bg-emerald-50 dark:bg-emerald-950/30 border-l-4 border-l-emerald-500'}"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <div
                    class="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center {item.type ===
                    'service'
                      ? 'bg-primary/10'
                      : 'bg-emerald-100 dark:bg-emerald-900'}"
                  >
                    {#if item.type === "service"}
                      <Sparkles class="h-5 w-5 text-primary" />
                    {:else}
                      <ShoppingBag class="h-5 w-5 text-emerald-600" />
                    {/if}
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-semibold truncate">
                      {item.name || "Mục chưa đặt tên"}
                    </h4>
                    <p class="text-xs text-muted-foreground">SL: {item.quantity || 1}</p>
                  </div>
                </div>
                <Badge variant="secondary" class="shrink-0">
                  {new Intl.NumberFormat("vi-VN").format(item.total || 0)}đ
                </Badge>
              </div>

              <div class="p-4 space-y-5">
                <!-- Technician Section -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      <Label class="text-sm font-medium">Kỹ thuật viên</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-7 text-xs gap-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-950"
                      onclick={() => addStaff(item, "technician")}
                    >
                      <Plus class="h-3.5 w-3.5" /> Thêm
                    </Button>
                  </div>

                  {#if !item.staffTechnicians || item.staffTechnicians.length === 0}
                    <div
                      class="text-sm text-muted-foreground italic py-3 px-4 bg-muted/20 rounded-lg"
                    >
                      Chưa phân công kỹ thuật viên
                    </div>
                  {:else}
                    <div class="space-y-3">
                      {#each item.staffTechnicians as staffEntry, si (si)}
                        <div
                          class="p-3 rounded-lg bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/20 space-y-3 transition-all"
                          in:slide={{ duration: 200 }}
                        >
                          <div class="flex items-center gap-3 flex-wrap">
                            <!-- Staff Selector -->
                            <Popover.Root>
                              <Popover.Trigger>
                                <button
                                  type="button"
                                  class="group flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all {staffEntry.staffId
                                    ? 'bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-600 dark:text-blue-200'
                                    : 'bg-muted border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary'}"
                                >
                                  {#if staffEntry.staffId}
                                    <span
                                      class="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center"
                                    >
                                      {getStaffInitials(getStaffName(staffEntry.staffId))}
                                    </span>
                                    <span class="font-medium text-sm">
                                      {getStaffName(staffEntry.staffId)}
                                    </span>
                                  {:else}
                                    <UserCircle class="h-5 w-5" />
                                    <span class="text-sm">Chọn nhân viên</span>
                                  {/if}
                                  <ChevronDown
                                    class="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity"
                                  />
                                </button>
                              </Popover.Trigger>
                              <Popover.Content class="w-[260px] p-2 max-h-[300px]" align="start">
                                <div class="space-y-2">
                                  <div class="relative">
                                    <Search
                                      class="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground"
                                    />
                                    <Input
                                      class="h-8 pl-8 pr-2 text-xs"
                                      placeholder="Tìm nhân viên..."
                                      bind:value={staffSearchQuery}
                                    />
                                  </div>
                                  <div class="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                                    {#if filteredStaff.length === 0}
                                      <div
                                        class="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground"
                                      >
                                        Không tìm thấy nhân viên phù hợp
                                      </div>
                                    {:else}
                                      {#each filteredStaff as s}
                                        <button
                                          type="button"
                                          class="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-muted transition-colors {staffEntry.staffId ===
                                          s.id
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : ''}"
                                          onclick={() => {
                                            applyCommissionFromRule(item, staffEntry, s.id);
                                            staffSearchQuery = "";
                                          }}
                                        >
                                          <span
                                            class="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0"
                                          >
                                            {getStaffInitials(s.name)}
                                          </span>
                                          <span class="truncate">{s.name}</span>
                                        </button>
                                      {/each}
                                    {/if}
                                  </div>
                                </div>
                              </Popover.Content>
                            </Popover.Root>

                            <!-- Commission Controls -->
                            <div class="flex items-center gap-1.5 ml-auto">
                              <Label class="text-xs text-muted-foreground whitespace-nowrap"
                                >Hoa hồng:</Label
                              >
                              <div
                                class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-background"
                              >
                                <Input
                                  type="number"
                                  class="w-16 h-8 border-0 text-right text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="0"
                                  bind:value={staffEntry.commissionValue}
                                  disabled={!staffEntry.staffId}
                                  oninput={() => {
                                    staffEntry.ruleApplied = false;
                                  }}
                                />
                                <!-- Segmented Toggle -->
                                <div class="flex border-l">
                                  <button
                                    type="button"
                                    class="h-8 w-8 flex items-center justify-center text-xs transition-colors {staffEntry.commissionType ===
                                    'percent'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'}"
                                    disabled={!staffEntry.staffId}
                                    onclick={() => {
                                      staffEntry.commissionType = "percent";
                                      staffEntry.ruleApplied = false;
                                    }}
                                  >
                                    <Percent class="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    class="h-8 w-8 flex items-center justify-center text-xs border-l transition-colors {staffEntry.commissionType ===
                                    'fixed'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'}"
                                    disabled={!staffEntry.staffId}
                                    onclick={() => {
                                      staffEntry.commissionType = "fixed";
                                      staffEntry.ruleApplied = false;
                                    }}
                                  >
                                    đ
                                  </button>
                                </div>
                              </div>
                            </div>
                            {#if staffEntry.ruleApplied}
                              <Badge
                                variant="secondary"
                                class="h-6 border border-emerald-200 bg-emerald-50 text-emerald-700"
                              >
                                {getRuleLabel(staffEntry)}
                              </Badge>
                            {/if}

                            <!-- Remove Button -->
                            <Button
                              variant="ghost"
                              size="icon"
                              class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onclick={() => removeStaff(item, "technician", si)}
                            >
                              <X class="h-4 w-4" />
                            </Button>
                          </div>

                          <!-- Bonus Section -->
                          <div class="flex items-center gap-3 pt-2 border-t border-dashed">
                            <div class="flex items-center gap-2">
                              <Switch
                                id="bonus-tech-{i}-{si}"
                                checked={staffEntry.showBonus ?? false}
                                onCheckedChange={(checked) => {
                                  staffEntry.showBonus = checked;
                                }}
                              />
                              <Label
                                for="bonus-tech-{i}-{si}"
                                class="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5"
                              >
                                <Gift class="h-3.5 w-3.5 text-amber-500" /> Có thưởng
                              </Label>
                            </div>
                            {#if staffEntry.showBonus}
                              <div
                                class="flex items-center gap-1.5"
                                transition:slide={{
                                  duration: 150,
                                  axis: "x",
                                }}
                              >
                                <Input
                                  type="number"
                                  class="h-7 w-24 text-right text-sm"
                                  placeholder="0"
                                  bind:value={staffEntry.bonus}
                                />
                                <span class="text-xs text-muted-foreground">đ</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <Separator />

                <!-- Seller Section -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                      <Label class="text-sm font-medium">Nhân viên bán hàng</Label>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      class="h-7 text-xs gap-1 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 dark:hover:bg-purple-950"
                      onclick={() => addStaff(item, "seller")}
                    >
                      <Plus class="h-3.5 w-3.5" /> Thêm
                    </Button>
                  </div>

                  {#if !item.staffSellers || item.staffSellers.length === 0}
                    <div
                      class="text-sm text-muted-foreground italic py-3 px-4 bg-muted/20 rounded-lg"
                    >
                      Chưa phân công nhân viên bán hàng
                    </div>
                  {:else}
                    <div class="space-y-3">
                      {#each item.staffSellers as staffEntry, si (si)}
                        <div
                          class="p-3 rounded-lg bg-gradient-to-r from-purple-50/50 to-transparent dark:from-purple-950/20 space-y-3 transition-all"
                          in:slide={{ duration: 200 }}
                        >
                          <div class="flex items-center gap-3 flex-wrap">
                            <!-- Staff Selector -->
                            <Popover.Root>
                              <Popover.Trigger>
                                <button
                                  type="button"
                                  class="group flex items-center gap-2 px-3 py-1.5 rounded-full border-2 transition-all {staffEntry.staffId
                                    ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900 dark:border-purple-600 dark:text-purple-200'
                                    : 'bg-muted border-dashed border-muted-foreground/30 text-muted-foreground hover:border-primary'}"
                                >
                                  {#if staffEntry.staffId}
                                    <span
                                      class="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center"
                                    >
                                      {getStaffInitials(getStaffName(staffEntry.staffId))}
                                    </span>
                                    <span class="font-medium text-sm">
                                      {getStaffName(staffEntry.staffId)}
                                    </span>
                                  {:else}
                                    <UserCircle class="h-5 w-5" />
                                    <span class="text-sm">Chọn nhân viên</span>
                                  {/if}
                                  <ChevronDown
                                    class="h-4 w-4 opacity-50 group-hover:opacity-100 transition-opacity"
                                  />
                                </button>
                              </Popover.Trigger>
                              <Popover.Content class="w-[260px] p-2 max-h-[300px]" align="start">
                                <div class="space-y-2">
                                  <div class="relative">
                                    <Search
                                      class="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground"
                                    />
                                    <Input
                                      class="h-8 pl-8 pr-2 text-xs"
                                      placeholder="Tìm nhân viên..."
                                      bind:value={staffSearchQuery}
                                    />
                                  </div>
                                  <div class="max-h-[220px] overflow-y-auto space-y-1 pr-1">
                                    {#if filteredStaff.length === 0}
                                      <div
                                        class="rounded-md border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground"
                                      >
                                        Không tìm thấy nhân viên phù hợp
                                      </div>
                                    {:else}
                                      {#each filteredStaff as s}
                                        <button
                                          type="button"
                                          class="w-full flex items-center gap-2 px-2 py-2 rounded-md text-left text-sm hover:bg-muted transition-colors {staffEntry.staffId ===
                                          s.id
                                            ? 'bg-primary/10 text-primary font-medium'
                                            : ''}"
                                          onclick={() => {
                                            applyCommissionFromRule(item, staffEntry, s.id);
                                            staffSearchQuery = "";
                                          }}
                                        >
                                          <span
                                            class="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white text-xs font-bold flex items-center justify-center shrink-0"
                                          >
                                            {getStaffInitials(s.name)}
                                          </span>
                                          <span class="truncate">{s.name}</span>
                                        </button>
                                      {/each}
                                    {/if}
                                  </div>
                                </div>
                              </Popover.Content>
                            </Popover.Root>

                            <!-- Commission Controls -->
                            <div class="flex items-center gap-1.5 ml-auto">
                              <Label class="text-xs text-muted-foreground whitespace-nowrap"
                                >Hoa hồng:</Label
                              >
                              <div
                                class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-background"
                              >
                                <Input
                                  type="number"
                                  class="w-16 h-8 border-0 text-right text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                                  placeholder="0"
                                  bind:value={staffEntry.commissionValue}
                                  disabled={!staffEntry.staffId}
                                  oninput={() => {
                                    staffEntry.ruleApplied = false;
                                  }}
                                />
                                <!-- Segmented Toggle -->
                                <div class="flex border-l">
                                  <button
                                    type="button"
                                    class="h-8 w-8 flex items-center justify-center text-xs transition-colors {staffEntry.commissionType ===
                                    'percent'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'}"
                                    disabled={!staffEntry.staffId}
                                    onclick={() => {
                                      staffEntry.commissionType = "percent";
                                      staffEntry.ruleApplied = false;
                                    }}
                                  >
                                    <Percent class="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    class="h-8 w-8 flex items-center justify-center text-xs border-l transition-colors {staffEntry.commissionType ===
                                    'fixed'
                                      ? 'bg-primary text-primary-foreground'
                                      : 'hover:bg-muted'}"
                                    disabled={!staffEntry.staffId}
                                    onclick={() => {
                                      staffEntry.commissionType = "fixed";
                                      staffEntry.ruleApplied = false;
                                    }}
                                  >
                                    đ
                                  </button>
                                </div>
                              </div>
                            </div>
                            {#if staffEntry.ruleApplied}
                              <Badge
                                variant="secondary"
                                class="h-6 border border-emerald-200 bg-emerald-50 text-emerald-700"
                              >
                                {getRuleLabel(staffEntry)}
                              </Badge>
                            {/if}

                            <!-- Remove Button -->
                            <Button
                              variant="ghost"
                              size="icon"
                              class="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              onclick={() => removeStaff(item, "seller", si)}
                            >
                              <X class="h-4 w-4" />
                            </Button>
                          </div>

                          <!-- Bonus Section -->
                          <div class="flex items-center gap-3 pt-2 border-t border-dashed">
                            <div class="flex items-center gap-2">
                              <Switch
                                id="bonus-seller-{i}-{si}"
                                checked={staffEntry.showBonus ?? false}
                                onCheckedChange={(checked) => {
                                  staffEntry.showBonus = checked;
                                }}
                              />
                              <Label
                                for="bonus-seller-{i}-{si}"
                                class="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5"
                              >
                                <Gift class="h-3.5 w-3.5 text-amber-500" /> Có thưởng
                              </Label>
                            </div>
                            {#if staffEntry.showBonus}
                              <div
                                class="flex items-center gap-1.5"
                                transition:slide={{
                                  duration: 150,
                                  axis: "x",
                                }}
                              >
                                <Input
                                  type="number"
                                  class="h-7 w-24 text-right text-sm"
                                  placeholder="0"
                                  bind:value={staffEntry.bonus}
                                />
                                <span class="text-xs text-muted-foreground">đ</span>
                              </div>
                            {/if}
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <Separator class="shrink-0" />

    <!-- Footer -->
    <div class="p-4 flex justify-end gap-3 shrink-0 bg-muted/30">
      <Button variant="outline" onclick={() => (open = false)}>Hủy</Button>
      <Button
        onclick={() => {
          onConfirm();
          open = false;
        }}
        class="gap-2"
      >
        <Users class="h-4 w-4" />
        Xác nhận
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
