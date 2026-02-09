<script lang="ts">
import { untrack } from "svelte";
import { Button } from "$lib/components/ui/button";
import * as Tabs from "$lib/components/ui/tabs";
import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
import { Input } from "$lib/components/ui/input";
import {
  Plus,
  Search,
  X,
  History,
  FileText,
  LayoutGrid,
  CheckCircle2,
  ExternalLink,
  Trash2,
  CheckCircle,
  MoreHorizontal,
  RotateCcw,
} from "@lucide/svelte";
import { cn } from "$lib/utils";
import InvoiceBuilder from "$lib/components/invoices/InvoiceBuilder.svelte";
import { Badge } from "$lib/components/ui/badge";
import { ScrollArea } from "$lib/components/ui/scroll-area";
import { Separator } from "$lib/components/ui/separator";
import { DatePicker } from "$lib/components/ui/date-picker";
import { Checkbox } from "$lib/components/ui/checkbox";
import { toast } from "svelte-sonner";
import { PUBLIC_API_URL } from "$env/static/public";

import type { Invoice } from "$lib/types";

let { data } = $props();

// -- STATE --
let activeTab = $state("history");

// Initialize drafts from openInvoices
// Helper to map invoice to draft format
function mapInvoiceToDraft(inv: any, index: number) {
  return {
    id: inv.id.toString(),
    idx: index,
    data: {
      ...inv,
      customerId: inv.customerId ? inv.customerId.toString() : "",
      // Ensure formatting matches builder expectations
      invoiceDate:
        inv.invoiceDate ||
        (inv.createdAt
          ? new Date(inv.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]),
      items: (inv.items || []).map((item: any) => ({
        ...item,
        // Map API staffCommissions to builder staffTechnicians/staffSellers
        staffTechnicians: (item.staffCommissions || [])
          .filter((s: any) => s.role === "technician")
          .map((s: any) => ({ ...s.staff, ...s })),
        staffSellers: (item.staffCommissions || [])
          .filter((s: any) => s.role === "seller")
          .map((s: any) => ({ ...s.staff, ...s })),
      })),
      discountValue: inv.discountValue || 0,
      discountType: inv.discountType || "percent",
      amountPaid: inv.amountPaid || 0,
      paymentMethod: inv.paymentMethod || "cash",
      notes: inv.notes || "",
    },
  };
}

// Initialize drafts from openInvoices

const initialDrafts = untrack(() =>
  (data.openInvoices || []).map((inv: any, i: number) => mapInvoiceToDraft(inv, i + 1)),
);
let drafts = $state<{ id: string; idx: number; data: any }[]>(initialDrafts);
let nextDraftId = initialDrafts.length + 1;

// Sync drafts when data.openInvoices changes (e.g. after bulk open)
$effect(() => {
  const serverOpenIds = new Set((data.openInvoices || []).map((i: any) => i.id.toString()));

  untrack(() => {
    // 1. Remove drafts that are no longer in openInvoices AND aren't new local drafts
    // Note: We deliberately keep new local drafts that start with "new-"
    drafts = drafts.filter((d) => d.id.startsWith("new-") || serverOpenIds.has(d.id));

    // 2. Add any openInvoices that aren't in drafts yet
    for (const inv of data.openInvoices || []) {
      const idStr = inv.id.toString();
      if (!drafts.find((d) => d.id === idStr)) {
        // We use nextDraftId++ to ensure uniqueness for keys usually
        drafts.push(mapInvoiceToDraft(inv, nextDraftId++));
      }
    }
  });
});

// History Filter
let historyDate = $state(new Date().toISOString().split("T")[0]); // DatePicker expects string binding
let historySearch = $state("");

// Sidebar Filter
let itemSearch = $state("");

// Multi-Selection
let selectedIds = $state(new Set<number>());

function toggleSelect(id: number) {
  if (selectedIds.has(id)) {
    selectedIds.delete(id);
  } else {
    selectedIds.add(id);
  }
}

function toggleSelectAll() {
  if (selectedIds.size === filteredHistory.length) {
    selectedIds = new Set();
  } else {
    selectedIds = new Set(filteredHistory.map((inv: any) => inv.id));
  }
}

async function handleBulkAction(actionType: string) {
  // Implementation for the bulk action form submission
  // We'll use a dynamic form submit since we are in script
}

// -- DERIVED --

// Filtered History
let filteredHistory = $derived.by(() => {
  let res = data.invoices;
  if (historySearch) {
    const q = historySearch.toLowerCase();
    res = res.filter(
      (inv: any) => inv.id.toString().includes(q) || inv.customer?.name?.toLowerCase().includes(q),
    );
  }
  // TODO: Filter by historyDate if implemented
  return res;
});

// -- ACTIONS --
import { enhance } from "$app/forms";

let createSubmit: () => void;

// We can't really "bind" the submit function easily from a hidden form to a button outside without a trigger
// A clean way: use a form for the "Create Invoice" button.

// However, the button is in the header.
// Let's make the button a form trigger or call a hidden form submit.
// Simpler: Just make the button a submit button inside a form.

import { invalidateAll } from "$app/navigation";

async function closeDraft(dId: string, event?: Event) {
  event?.stopPropagation();

  // Find draft
  const draft = drafts.find((d) => d.id === dId);

  // Optimistic UI update
  if (activeTab === dId) {
    activeTab = "history";
  }
  drafts = drafts.filter((d) => d.id !== dId);

  // If it's a saved invoice (not a new local draft), call server to close tab
  if (draft && !dId.startsWith("new-")) {
    const formData = new FormData();
    formData.append("id", dId);

    try {
      // Call the close action
      await fetch("?/close", {
        method: "POST",
        body: formData,
      });
      await invalidateAll();
    } catch (e) {
      console.error("Failed to close tab on server", e);
    }
  }
}

async function showInvoiceInTab(invoice: any) {
  const idStr = invoice.id.toString();

  if (!drafts.find((d) => d.id === idStr)) {
    drafts = [...drafts, mapInvoiceToDraft(invoice, nextDraftId++)];
  }

  activeTab = idStr;

  if (invoice.isOpenInTab) return;

  const formData = new FormData();
  formData.append("id", idStr);
  formData.append(
    "payload",
    JSON.stringify({
      isOpenInTab: true,
    }),
  );

  try {
    await fetch("?/update", {
      method: "POST",
      body: formData,
    });
    await invalidateAll();
  } catch (error) {
    toast.error("Không thể đồng bộ trạng thái tab");
    console.error("Failed to mark invoice tab as open", error);
  }
}
// -- HELPERS --
function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

function formatDate(dateStr: string | Date | null) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

// Status map
const statusStyles: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabels: Record<string, string> = {
  paid: "Đã thanh toán",
  pending: "Chờ thanh toán",
  cancelled: "Đã hủy",
};
</script>

<svelte:head>
  <title>POS Bán Hàng | SupaSalon</title>
</svelte:head>

<div
  class="panel-shell h-[calc(100vh-6rem)] -m-6 flex flex-col overflow-hidden md:flex-row bg-muted/10"
>
  <!-- MAIN: TABS & WORKSPACE -->
  <div class="flex-1 flex flex-col h-full min-w-0 bg-muted/5">
    <div class="glass-topbar bg-background px-4 pt-2 flex items-center justify-between gap-4">
      <!-- Tabs List -->
      <div class="flex-1 overflow-x-auto">
        <Tabs.Root
          value={activeTab}
          onValueChange={(v) => (activeTab = v as string)}
          class="w-full"
        >
          <Tabs.List class="w-max justify-start rounded-none border-b-0 p-0 bg-transparent h-12">
            <Tabs.Trigger
              value="history"
              class="relative h-10 rounded-t-md px-4 pb-2 pt-2 font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-x data-[state=active]:border-t border-b-2 border-b-transparent data-[state=active]:border-b-background -mb-[2px] mr-1"
            >
              <History class="h-4 w-4 mr-2" />
              Lịch sử
            </Tabs.Trigger>

            {#each drafts as draft}
              {@const customer = data.customers.find(
                (c: any) => c.id.toString() === draft.data.customerId?.toString(),
              )}
              <Tabs.Trigger
                value={draft.id}
                class="relative h-10 rounded-t-md px-4 pb-2 pt-2 group font-medium text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-x data-[state=active]:border-t border-b-2 border-b-transparent data-[state=active]:border-b-background -mb-[2px] mr-1 flex items-center gap-2"
              >
                <FileText class="h-4 w-4" />
                <span class="truncate max-w-[150px]">
                  {customer ? customer.name : "Khách vãng lai"}
                </span>
                <div
                  role="button"
                  tabindex={0}
                  class="p-0.5 rounded-full hover:bg-muted ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onclick={(e) => {
                    e.stopPropagation();
                    closeDraft(draft.id);
                  }}
                  onkeydown={(e) => {
                    if (e.key === "Enter") closeDraft(draft.id);
                  }}
                >
                  <X class="h-3 w-3" />
                </div>
              </Tabs.Trigger>
            {/each}
          </Tabs.List>
        </Tabs.Root>
      </div>

      <!-- Top Actions -->
      <div class="flex items-center gap-2 pb-2">
        <form
          method="POST"
          action="?/create"
          use:enhance={() => {
            return async ({ result }) => {
              if (result.type === "success" && result.data?.invoice) {
                const newInvoice = result.data.invoice as Invoice;
                // Add to drafts immediately (optimistic/authoritative)
                // Note: The effect will also run when data updates, we need to ensure no dupes
                // Using a unique ID 'new-' logic or just relying on database ID if returned

                // Since we have the ID from DB now:
                const idStr = newInvoice.id.toString();
                if (!drafts.find((d) => d.id === idStr)) {
                  drafts.push({
                    id: idStr,
                    idx: nextDraftId++,
                    data: {
                      ...newInvoice,
                      invoiceDate: new Date().toISOString().split("T")[0],
                      items: [],
                      discountValue: 0,
                      discountType: "percent",
                      amountPaid: 0,
                      paymentMethod: "cash",
                      notes: "",
                    },
                  });
                }
                activeTab = idStr;
              } else if (result.type === "failure") {
                toast.error((result.data?.message as string) || "Không thể tạo hóa đơn");
              }
            };
          }}
        >
          <Button type="submit" class="btn-gradient shadow-md">
            <Plus class="h-4 w-4 mr-2" />
            Tạo hóa đơn
          </Button>
        </form>
      </div>
    </div>

    <Separator />

    <!-- Tab Content Area -->
    <div class="flex-1 overflow-hidden relative">
      {#if activeTab === "history"}
        <div
          class="h-full flex flex-col p-6 overflow-y-auto animate-in fade-in zoom-in-95 duration-200"
        >
          <!-- HISTORY VIEW -->
          <div class="flex items-center justify-between mb-6">
            <div>
              <h2 class="section-title text-2xl font-bold tracking-tight">Lịch sử hóa đơn</h2>
              <p class="text-muted-foreground">Quản lý các giao dịch gần đây</p>
            </div>
            <div class="relative w-72">
              <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm mã HĐ, tên khách..."
                class="soft-input pl-9"
                bind:value={historySearch}
              />
            </div>
          </div>

          <div class="table-shell bg-card overflow-hidden">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="h-12 w-[50px] px-4 align-middle">
                    <Checkbox
                      checked={selectedIds.size === filteredHistory.length &&
                        filteredHistory.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </th>
                  <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >Mã hóa đơn</th
                  >
                  <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >Khách hàng</th
                  >
                  <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >Ngày tạo</th
                  >
                  <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >Tổng tiền</th
                  >
                  <th class="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                    >Trạng thái</th
                  >
                  <th class="h-12 px-4 text-right align-middle font-medium text-muted-foreground"
                  ></th>
                </tr>
              </thead>
              <tbody class="divide-y">
                {#each filteredHistory as invoice (invoice.id)}
                  <tr class="hover:bg-muted/50 transition-colors">
                    <td class="p-4 align-middle">
                      <Checkbox
                        checked={selectedIds.has(invoice.id)}
                        onCheckedChange={() => toggleSelect(invoice.id)}
                      />
                    </td>
                    <td class="p-4 font-medium">#{invoice.id}</td>
                    <td class="p-4">{invoice.customer?.name || "Khách vãng lai"}</td>
                    <td class="p-4 text-muted-foreground">{formatDate(invoice.createdAt)}</td>
                    <td class="p-4 font-medium">{formatPrice(invoice.total)}</td>
                    <td class="p-4">
                      <Badge
                        variant="outline"
                        class={cn("font-normal", statusStyles[invoice.status])}
                      >
                        {statusLabels[invoice.status] || invoice.status}
                      </Badge>
                    </td>
                    <td class="p-4 text-right">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          {#snippet child({ props })}
                            <Button {...props} variant="ghost" size="icon" class="h-8 w-8">
                              <MoreHorizontal class="h-4 w-4" />
                              <span class="sr-only">Menu</span>
                            </Button>
                          {/snippet}
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content align="end">
                          <DropdownMenu.Label>Hành động</DropdownMenu.Label>
                          <DropdownMenu.Separator />
                          <DropdownMenu.Item
                            class="w-full"
                            onclick={() => showInvoiceInTab(invoice)}
                          >
                            <ExternalLink class="mr-2 h-4 w-4" /> Hiển thị trong tab
                          </DropdownMenu.Item>

                          {#if invoice.status === "pending"}
                            <DropdownMenu.Separator />
                            <form
                              method="POST"
                              action="?/update"
                              use:enhance={() =>
                                async ({ update }) =>
                                  await update()}
                            >
                              <input type="hidden" name="id" value={invoice.id} />
                              <input
                                type="hidden"
                                name="payload"
                                value={JSON.stringify({
                                  status: "paid",
                                  isOpenInTab: false,
                                })}
                              />
                              <DropdownMenu.Item
                                class="w-full text-green-600 transition-colors focus:text-green-600"
                              >
                                {#snippet child({ props })}
                                  <button {...props} type="submit">
                                    <CheckCircle class="mr-2 h-4 w-4 text-green-600" /> Hoàn tất
                                  </button>
                                {/snippet}
                              </DropdownMenu.Item>
                            </form>
                          {/if}

                          {#if invoice.status === "paid"}
                            <DropdownMenu.Separator />
                            <form
                              method="POST"
                              action="?/update"
                              use:enhance={() =>
                                async ({ update }) =>
                                  await update()}
                            >
                              <input type="hidden" name="id" value={invoice.id} />
                              <input
                                type="hidden"
                                name="payload"
                                value={JSON.stringify({
                                  status: "pending",
                                  paidAt: null,
                                })}
                              />
                              <DropdownMenu.Item
                                class="w-full text-orange-600 transition-colors focus:text-orange-600"
                              >
                                {#snippet child({ props })}
                                  <button {...props} type="submit">
                                    <RotateCcw class="mr-2 h-4 w-4 text-orange-600" /> Hủy hoàn thành
                                  </button>
                                {/snippet}
                              </DropdownMenu.Item>
                            </form>
                          {/if}

                          {#if invoice.status !== "cancelled"}
                            <DropdownMenu.Separator />
                            <form
                              method="POST"
                              action="?/delete"
                              use:enhance={() =>
                                async ({ update }) =>
                                  await update()}
                            >
                              <input type="hidden" name="id" value={invoice.id} />
                              <DropdownMenu.Item variant="destructive" class="w-full">
                                {#snippet child({ props })}
                                  <button {...props} type="submit" class="flex w-full items-center">
                                    <Trash2 class="mr-2 h-4 w-4" /> Hủy hóa đơn
                                  </button>
                                {/snippet}
                              </DropdownMenu.Item>
                            </form>
                          {/if}
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                {/each}
                {#if filteredHistory.length === 0}
                  <tr
                    ><td colspan="7" class="py-8 text-center text-muted-foreground"
                      >Không tìm thấy dữ liệu</td
                    ></tr
                  >
                {/if}
              </tbody>
            </table>
          </div>

          <!-- Bulk Action Bar -->
          {#if selectedIds.size > 0}
            <div
              class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/95 backdrop-blur border shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-300 z-50 border-primary/20"
            >
              <div class="flex items-center gap-2 border-r pr-6">
                <span
                  class="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                >
                  {selectedIds.size}
                </span>
                <span class="text-sm font-medium">Đang chọn</span>
              </div>

              <div class="flex items-center gap-3">
                <form
                  method="POST"
                  action="?/bulk"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === "success") {
                        toast.success(`Đã mở lại các tab`);
                        selectedIds = new Set();
                        await update();
                      }
                    };
                  }}
                >
                  <input type="hidden" name="actionType" value="open" />
                  {#each Array.from(selectedIds).filter((id) => {
                    const inv = data.invoices.find((i: any) => i.id === id);
                    return inv && !inv.isOpenInTab;
                  }) as id}
                    <input type="hidden" name="ids" value={id} />
                  {/each}
                  <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    class="rounded-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <ExternalLink class="h-4 w-4" />
                    Mở lại tab
                  </Button>
                </form>

                <form
                  method="POST"
                  action="?/bulk"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === "success") {
                        toast.success(`Đã hoàn tất các hóa đơn được chọn`);
                        selectedIds = new Set();
                        await update();
                      }
                    };
                  }}
                >
                  <input type="hidden" name="actionType" value="complete" />
                  {#each Array.from(selectedIds).filter((id) => {
                    const inv = data.invoices.find((i: any) => i.id === id);
                    return inv && inv.status === "pending";
                  }) as id}
                    <input type="hidden" name="ids" value={id} />
                  {/each}
                  <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    class="rounded-full gap-2 border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle class="h-4 w-4" />
                    Hoàn tất
                  </Button>
                </form>

                <form
                  method="POST"
                  action="?/bulk"
                  use:enhance={() => {
                    return async ({ result, update }) => {
                      if (result.type === "success") {
                        toast.success(`Đã hủy các hóa đơn được chọn`);
                        selectedIds = new Set();
                        await update();
                      }
                    };
                  }}
                >
                  <input type="hidden" name="actionType" value="cancel" />
                  {#each Array.from(selectedIds).filter((id) => {
                    const inv = data.invoices.find((i: any) => i.id === id);
                    return inv && inv.status !== "cancelled";
                  }) as id}
                    <input type="hidden" name="ids" value={id} />
                  {/each}
                  <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    class="rounded-full gap-2 border-red-200 text-red-700 hover:bg-red-50"
                  >
                    <Trash2 class="h-4 w-4" />
                    Hủy hàng loạt
                  </Button>
                </form>

                <Separator orientation="vertical" class="h-6 mx-1" />

                <Button
                  variant="ghost"
                  size="sm"
                  onclick={() => (selectedIds = new Set())}
                  class="rounded-full text-muted-foreground"
                >
                  Hủy chọn
                </Button>
              </div>
            </div>
          {/if}
        </div>
      {:else}
        {#each drafts as draft (draft.id)}
          <div
            class={cn(
              "h-full flex flex-col animate-in fade-in slide-in-from-right-4 duration-200 bg-background",
              activeTab !== draft.id && "hidden",
            )}
          >
            <InvoiceBuilder
              bind:invoice={draft.data}
              customers={data.customers}
              staff={data.staff}
              services={data.services}
              products={data.products}
              commissionRules={data.commissionRules}
              onSaveSuccess={() => closeDraft(draft.id)}
            />
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>
