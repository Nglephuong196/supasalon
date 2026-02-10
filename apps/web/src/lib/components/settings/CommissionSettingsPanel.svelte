<script lang="ts">
import { invalidateAll } from "$app/navigation";
import { page } from "$app/stores";
import { fetchAPI } from "$lib/api";
import { Button } from "$lib/components/ui/button";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import * as Select from "$lib/components/ui/select";
import { BadgePercent, DollarSign, Search, Users } from "@lucide/svelte";
import { toast } from "svelte-sonner";

type CommissionType = "percent" | "fixed";
type ItemType = "service" | "product";

type MemberRow = {
  id: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
};

type ItemRow = {
  id: number;
  name: string;
  price: number;
  categoryId: number;
};

type CategoryRow = {
  id: number;
  name: string;
};

type CommissionRuleRow = {
  id: number;
  organizationId: string;
  staffId: string;
  itemType: ItemType;
  itemId: number;
  commissionType: CommissionType;
  commissionValue: number;
  createdAt: string;
  updatedAt: string;
};

type Draft = {
  commissionType: CommissionType;
  commissionValue: string;
};

interface Props {
  data: {
    members: MemberRow[];
    services: ItemRow[];
    products: ItemRow[];
    serviceCategories: CategoryRow[];
    productCategories: CategoryRow[];
    rules: CommissionRuleRow[];
    canRead?: boolean;
    canCreate?: boolean;
    canUpdate?: boolean;
    canDelete?: boolean;
  };
}

let { data }: Props = $props();

let rules = $state<CommissionRuleRow[]>([]);
let selectedStaffId = $state("");
let itemType = $state<ItemType>("service");
let selectedCategoryId = $state<number | null>(null);
let search = $state("");

let quickType = $state<CommissionType>("percent");
let quickValue = $state("10");
let quickApplyTarget = $state<"selected" | "all">("selected");

let drafts = $state<Record<string, Draft>>({});
let rowLoading = $state<Record<string, boolean>>({});
let bulkLoading = $state(false);

$effect(() => {
  if (rules.length === 0 && data.rules.length > 0) {
    rules = [...data.rules];
  }

  if (!selectedStaffId && data.members.length > 0) {
    selectedStaffId = data.members[0].id;
  }
});

let currentItems = $derived.by(() => {
  const source = itemType === "service" ? data.services : data.products;
  const normalizedSearch = search.trim().toLowerCase();
  const categoryFiltered =
    selectedCategoryId === null
      ? source
      : source.filter((item: ItemRow) => item.categoryId === selectedCategoryId);

  if (!normalizedSearch) return categoryFiltered;

  return categoryFiltered.filter((item: ItemRow) =>
    item.name.toLowerCase().includes(normalizedSearch),
  );
});

let currentCategories = $derived.by(() =>
  itemType === "service" ? data.serviceCategories : data.productCategories,
);

function keyFor(itemId: number) {
  return `${selectedStaffId}:${itemType}:${itemId}`;
}

function formatCurrency(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function orgHeaders(): Record<string, string> {
  const organizationId = $page.data.organizationId as string | undefined;
  return organizationId ? { "X-Organization-Id": organizationId } : {};
}

function getExistingRule(itemId: number) {
  return (
    rules.find(
      (rule) =>
        rule.staffId === selectedStaffId && rule.itemType === itemType && rule.itemId === itemId,
    ) ?? null
  );
}

function defaultDraftFor(itemId: number): Draft {
  const existing = getExistingRule(itemId);
  return {
    commissionType: existing?.commissionType ?? "percent",
    commissionValue: String(existing?.commissionValue ?? 0),
  };
}

function getDraft(itemId: number): Draft {
  const key = keyFor(itemId);
  return drafts[key] ?? defaultDraftFor(itemId);
}

function setDraft(itemId: number, patch: Partial<Draft>) {
  const key = keyFor(itemId);
  const current = getDraft(itemId);

  drafts = {
    ...drafts,
    [key]: {
      ...current,
      ...patch,
    },
  };
}

function estimatePayout(itemPrice: number, draft: Draft) {
  const value = Number(draft.commissionValue || 0);
  if (!Number.isFinite(value) || value < 0) return 0;

  if (draft.commissionType === "percent") {
    return (itemPrice * value) / 100;
  }

  return value;
}

async function saveRule(item: ItemRow) {
  if (!selectedStaffId) {
    toast.error("Vui lòng chọn nhân viên");
    return;
  }

  const key = keyFor(item.id);
  const draft = getDraft(item.id);
  const numericValue = Number(draft.commissionValue);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    toast.error("Giá trị hoa hồng không hợp lệ");
    return;
  }

  rowLoading[key] = true;

  try {
    const saved = await fetchAPI<CommissionRuleRow>("/staff-commission-rules/upsert", {
      method: "POST",
      headers: orgHeaders(),
      body: JSON.stringify({
        staffId: selectedStaffId,
        itemType,
        itemId: item.id,
        commissionType: draft.commissionType,
        commissionValue: numericValue,
      }),
    });

    rules = [...rules.filter((r) => r.id !== saved.id), saved];

    toast.success("Đã lưu cấu hình hoa hồng");
  } catch (error: any) {
    toast.error(error?.message || "Không thể lưu cấu hình");
  } finally {
    rowLoading[key] = false;
  }
}

async function clearRule(item: ItemRow) {
  const key = keyFor(item.id);
  const existing = getExistingRule(item.id);

  if (!existing) {
    setDraft(item.id, {
      commissionType: "percent",
      commissionValue: "0",
    });
    return;
  }

  rowLoading[key] = true;

  try {
    await fetchAPI<{ success: boolean }>(`/staff-commission-rules/${existing.id}`, {
      method: "DELETE",
      headers: orgHeaders(),
    });

    rules = rules.filter((r) => r.id !== existing.id);
    setDraft(item.id, {
      commissionType: "percent",
      commissionValue: "0",
    });

    toast.success("Đã xóa cấu hình, mặc định về 0");
  } catch (error: any) {
    toast.error(error?.message || "Không thể xóa cấu hình");
  } finally {
    rowLoading[key] = false;
  }
}

async function applyQuickToFiltered() {
  if (quickApplyTarget === "selected" && !selectedStaffId) {
    toast.error("Vui lòng chọn nhân viên");
    return;
  }

  const quickNumeric = Number(quickValue);

  if (!Number.isFinite(quickNumeric) || quickNumeric < 0) {
    toast.error("Giá trị áp dụng nhanh không hợp lệ");
    return;
  }

  if (currentItems.length === 0) {
    toast.error("Không có mục nào để áp dụng");
    return;
  }

  const targetStaffIds =
    quickApplyTarget === "all"
      ? data.members.map((member: MemberRow) => member.id)
      : [selectedStaffId];

  if (targetStaffIds.length === 0) {
    toast.error("Không có nhân viên để áp dụng");
    return;
  }

  bulkLoading = true;

  try {
    const allPayload = targetStaffIds.flatMap((staffId: string) =>
      currentItems.map((item: ItemRow) => ({
        staffId,
        itemType,
        itemId: item.id,
        commissionType: quickType,
        commissionValue: quickNumeric,
      })),
    );

    const chunkSize = 400;
    const savedRules: CommissionRuleRow[] = [];

    for (let i = 0; i < allPayload.length; i += chunkSize) {
      const chunk = allPayload.slice(i, i + chunkSize);
      const res = await fetchAPI<{ rules: CommissionRuleRow[] }>(
        "/staff-commission-rules/bulk-upsert",
        {
          method: "POST",
          headers: orgHeaders(),
          body: JSON.stringify({ rules: chunk }),
        },
      );
      savedRules.push(...res.rules);
    }

    const updatedIds = new Set(savedRules.map((r) => r.id));
    rules = [...rules.filter((r) => !updatedIds.has(r.id)), ...savedRules];

    for (const item of currentItems) {
      setDraft(item.id, {
        commissionType: quickType,
        commissionValue: String(quickNumeric),
      });
    }

    if (quickApplyTarget === "all") {
      toast.success(
        `Đã áp dụng cho ${currentItems.length} mục x ${targetStaffIds.length} nhân viên`,
      );
    } else {
      toast.success(`Đã áp dụng cho ${currentItems.length} mục`);
    }
  } catch (error: any) {
    toast.error(error?.message || "Không thể áp dụng hàng loạt");
  } finally {
    bulkLoading = false;
  }
}

async function refreshAll() {
  await invalidateAll();
}
</script>

<div class="grid gap-4 lg:grid-cols-3">
  <div class="panel-shell lg:col-span-2 p-4">
    <div class="grid gap-4 md:grid-cols-3">
      <div class="md:col-span-2">
        <Label for="staff-select" class="mb-2 block">Nhân viên</Label>
        <Select.Root type="single" bind:value={selectedStaffId}>
          <Select.Trigger id="staff-select" class="w-full soft-input">
            {#if selectedStaffId}
              {data.members.find((m: MemberRow) => m.id === selectedStaffId)?.user.name}
            {:else}
              Chọn nhân viên
            {/if}
          </Select.Trigger>
          <Select.Content>
            {#each data.members as staff}
              <Select.Item value={staff.id} label={staff.user.name}>
                <div class="flex flex-col">
                  <span>{staff.user.name}</span>
                  <span class="text-xs text-muted-foreground">{staff.user.email}</span>
                </div>
              </Select.Item>
            {/each}
          </Select.Content>
        </Select.Root>
      </div>

      <div>
        <Label for="search-item" class="mb-2 block">Tìm kiếm mục</Label>
        <div class="relative">
          <Search
            class="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          />
          <Input
            id="search-item"
            class="soft-input pl-9"
            placeholder="Tên dịch vụ/sản phẩm"
            bind:value={search}
          />
        </div>
      </div>
    </div>

    <div class="filter-strip mt-4 flex flex-wrap gap-2 p-3">
      <Button
        type="button"
        variant={itemType === "service" ? "default" : "outline"}
        class={itemType === "service" ? "chip-pill-active" : "chip-pill"}
        onclick={() => {
          itemType = "service";
          selectedCategoryId = null;
        }}
      >
        Dịch vụ
      </Button>
      <Button
        type="button"
        variant={itemType === "product" ? "default" : "outline"}
        class={itemType === "product" ? "chip-pill-active" : "chip-pill"}
        onclick={() => {
          itemType = "product";
          selectedCategoryId = null;
        }}
      >
        Sản phẩm
      </Button>
      <Button type="button" variant="ghost" class="chip-pill" onclick={refreshAll}
        >Làm mới dữ liệu</Button
      >
    </div>

    <div class="mt-4 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant={selectedCategoryId === null ? "default" : "outline"}
        class={selectedCategoryId === null ? "chip-pill-active" : "chip-pill"}
        onclick={() => (selectedCategoryId = null)}
      >
        Tất cả danh mục
      </Button>
      {#each currentCategories as category}
        <Button
          type="button"
          size="sm"
          variant={selectedCategoryId === category.id ? "default" : "outline"}
          class={selectedCategoryId === category.id ? "chip-pill-active" : "chip-pill"}
          onclick={() => (selectedCategoryId = category.id)}
        >
          {category.name}
        </Button>
      {/each}
    </div>
  </div>

  <div class="panel-shell p-4">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h2 class="font-semibold">Áp dụng nhanh</h2>
        <p class="mt-1 text-sm text-muted-foreground">Áp dụng cùng 1 mức cho danh sách đang lọc.</p>
      </div>
      <BadgePercent class="h-5 w-5 text-primary" />
    </div>

    <div class="mt-4 grid gap-3">
      <div>
        <Label class="mb-2 block">Loại</Label>
        <Select.Root type="single" bind:value={quickType}>
          <Select.Trigger class="w-full">
            {quickType === "percent" ? "Phần trăm" : "Cố định"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="percent" label="Phần trăm">Phần trăm (%)</Select.Item>
            <Select.Item value="fixed" label="Cố định">Cố định (đ)</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div>
        <Label class="mb-2 block">Phạm vi áp dụng</Label>
        <Select.Root type="single" bind:value={quickApplyTarget}>
          <Select.Trigger class="w-full">
            {quickApplyTarget === "all" ? "Tất cả nhân viên" : "Nhân viên đang chọn"}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="selected" label="Nhân viên đang chọn">
              Nhân viên đang chọn
            </Select.Item>
            <Select.Item value="all" label="Tất cả nhân viên">Tất cả nhân viên</Select.Item>
          </Select.Content>
        </Select.Root>
      </div>
      <div>
        <Label for="quick-value" class="mb-2 block">Giá trị</Label>
        <Input
          id="quick-value"
          type="number"
          min="0"
          step="0.01"
          bind:value={quickValue}
          class="soft-input"
        />
      </div>
      <Button
        type="button"
        disabled={bulkLoading || !data.canUpdate}
        class="btn-gradient"
        onclick={applyQuickToFiltered}
      >
        {bulkLoading
          ? "Đang áp dụng..."
          : quickApplyTarget === "all"
            ? `Áp dụng cho ${currentItems.length} mục x ${data.members.length} nhân viên`
            : `Áp dụng cho ${currentItems.length} mục`}
      </Button>
    </div>
  </div>
</div>

<div class="table-shell mt-4 overflow-hidden">
  <div
    class="filter-strip rounded-none border-x-0 border-t-0 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2"
  >
    <Users class="h-4 w-4" />
    {#if selectedStaffId}
      Đang cấu hình cho: <span class="font-medium text-foreground"
        >{data.members.find((m: MemberRow) => m.id === selectedStaffId)?.user.name}</span
      >
    {:else}
      Chưa chọn nhân viên
    {/if}
    <span class="ml-auto">{currentItems.length} mục</span>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full min-w-[920px] text-sm">
      <thead class="text-muted-foreground">
        <tr>
          <th class="px-4 py-3 text-left font-medium"
            >{itemType === "service" ? "Dịch vụ" : "Sản phẩm"}</th
          >
          <th class="px-4 py-3 text-left font-medium">Giá bán</th>
          <th class="px-4 py-3 text-left font-medium">Loại hoa hồng</th>
          <th class="px-4 py-3 text-left font-medium">Giá trị</th>
          <th class="px-4 py-3 text-left font-medium">Ước tính</th>
          <th class="px-4 py-3 text-left font-medium">Trạng thái</th>
          <th class="px-4 py-3 text-right font-medium">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {#if currentItems.length === 0}
          <tr>
            <td colspan="7" class="px-4 py-8 text-center text-muted-foreground">
              Không có dữ liệu phù hợp.
            </td>
          </tr>
        {/if}

        {#each currentItems as item}
          {@const key = keyFor(item.id)}
          {@const draft = getDraft(item.id)}
          {@const existing = getExistingRule(item.id)}
          {@const saving = !!rowLoading[key]}

          <tr class="align-top border-t border-border/60 transition-colors hover:bg-muted/20">
            <td class="px-4 py-3 font-medium text-foreground">{item.name}</td>
            <td class="px-4 py-3">{formatCurrency(item.price)}</td>
            <td class="px-4 py-3 w-48">
              <Select.Root
                type="single"
                value={draft.commissionType}
                onValueChange={(value) => {
                  if (value === "percent" || value === "fixed") {
                    setDraft(item.id, {
                      commissionType: value,
                    });
                  }
                }}
              >
                <Select.Trigger class="w-full soft-input">
                  {draft.commissionType === "percent" ? "Phần trăm" : "Cố định"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="percent" label="Phần trăm">Phần trăm (%)</Select.Item>
                  <Select.Item value="fixed" label="Cố định">Cố định (đ)</Select.Item>
                </Select.Content>
              </Select.Root>
            </td>
            <td class="px-4 py-3 w-48">
              <Input
                type="number"
                min="0"
                step="0.01"
                class="soft-input"
                value={draft.commissionValue}
                oninput={(event) => {
                  setDraft(item.id, {
                    commissionValue: (event.target as HTMLInputElement).value,
                  });
                }}
              />
            </td>
            <td class="px-4 py-3">
              <div class="flex items-center gap-1.5 font-medium">
                <DollarSign class="h-3.5 w-3.5 text-muted-foreground" />
                {formatCurrency(estimatePayout(item.price, draft))}
              </div>
            </td>
            <td class="px-4 py-3">
              {#if existing}
                <span
                  class="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700"
                >
                  Đã cấu hình
                </span>
              {:else}
                <span
                  class="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                >
                  Mặc định 0
                </span>
              {/if}
            </td>
            <td class="px-4 py-3">
              <div class="flex justify-end gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={saving || !data.canUpdate}
                  onclick={() => clearRule(item)}
                >
                  Đặt về 0
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={saving || !data.canUpdate}
                  onclick={() => saveRule(item)}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
