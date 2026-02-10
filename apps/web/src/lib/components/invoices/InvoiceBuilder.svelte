<script lang="ts">
import { enhance } from "$app/forms";
import { PUBLIC_API_URL } from "$env/static/public";
import * as Accordion from "$lib/components/ui/accordion";
import { Button } from "$lib/components/ui/button";
import Combobox from "$lib/components/ui/combobox/combobox.svelte";
import { DatePicker } from "$lib/components/ui/date-picker";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { ScrollArea } from "$lib/components/ui/scroll-area";
import * as Select from "$lib/components/ui/select";
import { Separator } from "$lib/components/ui/separator";
import * as Tabs from "$lib/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  FileText,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  Save,
  Search,
  ShoppingBag,
  Sparkles,
  User,
  X,
} from "@lucide/svelte";
import { toast } from "svelte-sonner";
import InvoiceItemRow from "./InvoiceItemRow.svelte";
import StaffAssignmentDialog from "./StaffAssignmentDialog.svelte";

let {
  customers = [],
  staff = [],
  services = [],
  products = [],
  commissionRules = [],
  onSaveSuccess = () => {},
  invoice = $bindable({
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    customerId: "",
    items: [],
    discountValue: 0,
    discountType: "percent",
    amountPaid: 0,
    paymentMethod: "cash",
    notes: "",
  }),
} = $props<{
  customers?: any[];
  staff?: any[];
  services?: any[];
  products?: any[];
  commissionRules?: any[];
  onSaveSuccess?: () => void;
  invoice?: {
    id?: number;
    invoiceDate?: string;
    dueDate?: string;
    customerId: string;
    items: any[];
    discountValue: number;
    discountType: "percent" | "fixed";
    amountPaid: number;
    paymentMethod: "cash" | "card" | "transfer";
    notes: string;
    status?: string;
  };
}>();

let isLoading = $state(false);
let catalogSearch = $state("");
let catalogTab = $state("services"); // services | products

// Time state
let invoiceTime = $state(
  invoice.invoiceDate
    ? new Date(invoice.createdAt || new Date()).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
);

// Derived Calculations
let subtotal = $derived(
  invoice.items.reduce((sum: number, item: any) => sum + (item.total || 0), 0),
);

let invoiceDiscount = $derived(
  invoice.discountType === "percent"
    ? subtotal * (invoice.discountValue / 100)
    : invoice.discountValue,
);

let total = $derived(Math.max(0, subtotal - invoiceDiscount));
let change = $derived(Math.max(0, invoice.amountPaid - total));
let itemCount = $derived(invoice.items.length);
let assignedStaffCount = $derived(
  invoice.items.reduce(
    (sum: number, current: any) =>
      sum +
      (current.staffTechnicians || []).filter((s: any) => s.staffId).length +
      (current.staffSellers || []).filter((s: any) => s.staffId).length,
    0,
  ),
);

// Filtered Catalog
let filteredServices = $derived(
  services.filter((s: any) => s.name.toLowerCase().includes(catalogSearch.toLowerCase())),
);
let filteredProducts = $derived(
  products.filter((p: any) => p.name.toLowerCase().includes(catalogSearch.toLowerCase())),
);

function addItem(type: "service" | "product", itemData?: any) {
  invoice.items = [
    ...invoice.items,
    {
      type,
      referenceId: itemData ? itemData.id : null,
      name: itemData ? itemData.name : "",
      quantity: 1,
      unitPrice: itemData ? Number(itemData.price) : 0,
      discountValue: 0,
      discountType: "percent",
      total: itemData ? Number(itemData.price) : 0,
      staffTechnicians: [],
      staffSellers: [],
    },
  ];
}

function removeItem(index: number) {
  invoice.items = invoice.items.filter((_: any, i: number) => i !== index);
}

function removeCustomer() {
  invoice.customerId = "";
}

// Auto-save state
let saveStatus = $state<"saved" | "saving" | "error">("saved");
let saveTimeout: NodeJS.Timeout;

// Payload helper
function getInvoicePayload(statusOverride?: string) {
  // Construct createdAt from invoiceDate and invoiceTime
  let createdAt = new Date().toISOString();
  try {
    if (invoice.invoiceDate && invoiceTime) {
      const [h, m] = invoiceTime.split(":");
      const date = new Date(invoice.invoiceDate);
      date.setHours(Number(h), Number(m));
      createdAt = date.toISOString();
    }
  } catch (e) {
    console.error("Invalid date/time", e);
  }

  // Helper to clean staff data - only send required fields for DB
  function cleanStaffData(staffArray: any[], role: "technician" | "seller") {
    if (!staffArray || !Array.isArray(staffArray)) return [];
    return staffArray
      .filter((s: any) => s.staffId) // Only include entries with a selected staff
      .map((s: any) => ({
        staffId: s.staffId,
        role: role,
        commissionValue: Number(s.commissionValue) || 0,
        commissionType: s.commissionType || "percent",
        bonus: Number(s.bonus) || 0,
      }));
  }

  return {
    customerId: invoice.customerId ? Number(invoice.customerId) : null,
    subtotal,
    discountValue: invoice.discountValue,
    discountType: invoice.discountType,
    total,
    amountPaid: invoice.amountPaid,
    change,
    paymentMethod: invoice.paymentMethod,
    notes: invoice.notes,
    status: statusOverride || "pending", // Default to pending for auto-save
    createdAt, // Add createdAt
    items: invoice.items.map((item: any) => ({
      type: item.type,
      referenceId: item.referenceId,
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discountValue: Number(item.discountValue || 0),
      discountType: item.discountType || "percent",
      total: Number(item.total) || 0,
      staff: [
        ...cleanStaffData(item.staffTechnicians, "technician"),
        ...cleanStaffData(item.staffSellers, "seller"),
      ],
    })),
  };
}

// Auto-save function
let lastError = $state<string | null>(null);

function autoSave() {
  if (!invoice.id) return;

  saveStatus = "saving";
  lastError = null;
  clearTimeout(saveTimeout);

  saveTimeout = setTimeout(async () => {
    const formData = new FormData();
    formData.append("id", invoice.id!.toString());
    formData.append("payload", JSON.stringify(getInvoicePayload()));

    try {
      const res = await fetch("?/update", {
        method: "POST",
        body: formData,
      });

      // Parse the response - SvelteKit returns JSON for form actions
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        console.log("Auto-save response:", data);

        // Check for SvelteKit action failure format
        if (data.type === "failure" || data.status >= 400) {
          saveStatus = "error";
          // Extract message from various possible locations
          lastError =
            data.data?.message || data.error || data.message || `Lỗi ${data.status || res.status}`;
          console.error("Auto-save failed:", lastError, data);
          return;
        }

        // Success
        if (data.type === "success" || data.data?.success) {
          saveStatus = "saved";
          return;
        }
      }

      // Fallback to HTTP status check
      if (res.ok) {
        saveStatus = "saved";
      } else {
        saveStatus = "error";
        lastError = `HTTP Error ${res.status}`;
        console.error("Auto-save failed:", res.status);
      }
    } catch (e) {
      saveStatus = "error";
      lastError = "Lỗi kết nối";
      console.error("Auto-save error", e);
    }
  }, 1000); // Debounce 1s
}

// Watch for changes (deep) - skip initial render
let isInitialRender = true;
let previousPayload = "";

$effect(() => {
  // Track all dependencies by calling getInvoicePayload
  // This ensures any field used in the payload will trigger this effect
  const payload = JSON.stringify(getInvoicePayload());

  // Skip initial render
  if (isInitialRender) {
    isInitialRender = false;
    previousPayload = payload;
    return;
  }

  // Skip if payload hasn't actually changed (prevent duplicate saves)
  if (payload === previousPayload) {
    return;
  }
  previousPayload = payload;

  // Only save if we have an ID
  if (invoice.id) {
    autoSave();
  }
});

// Helper to find selected customer object
let selectedCustomer = $derived(customers.find((c: any) => c.id.toString() === invoice.customerId));

function formatPrice(price: number) {
  return new Intl.NumberFormat("vi-VN").format(price) + "đ";
}

let customerItems = $derived(
  customers.map((c: any) => ({
    value: c.id.toString(),
    label: `${c.name}${c.phone ? " - " + c.phone : ""}`,
  })),
);

// Grouping Helpers
function groupByCategory(items: any[]) {
  const groups: Record<string, { id: string; name: string; items: any[] }> = {};

  items.forEach((item) => {
    const catName = item.category?.name || "Khác";
    const catId = item.category?.id?.toString() || item.categoryId?.toString() || "other";

    if (!groups[catId]) {
      groups[catId] = { id: catId, name: catName, items: [] };
    }
    groups[catId].items.push(item);
  });

  return Object.values(groups);
}

let groupedServices = $derived(groupByCategory(filteredServices));
let groupedProducts = $derived(groupByCategory(filteredProducts));
type IndexedInvoiceItem = { item: any; index: number };
let serviceItemEntries = $derived.by(() =>
  invoice.items
    .map((item: any, index: number): IndexedInvoiceItem => ({ item, index }))
    .filter((entry: IndexedInvoiceItem) => entry.item.type === "service"),
);
let productItemEntries = $derived.by(() =>
  invoice.items
    .map((item: any, index: number): IndexedInvoiceItem => ({ item, index }))
    .filter((entry: IndexedInvoiceItem) => entry.item.type === "product"),
);
let catalogResultCount = $derived(
  catalogTab === "services" ? filteredServices.length : filteredProducts.length,
);

// Accordion State
let accordionValue = $state<string[]>([]);

// Auto-expand on search
$effect(() => {
  if (catalogSearch.trim()) {
    const serviceIds = groupedServices.map((g) => g.id);
    const productIds = groupedProducts.map((g) => g.id);
    accordionValue = catalogTab === "services" ? serviceIds : productIds;
  }
});

// Default open first category when switching tabs (only if not searching)
$effect(() => {
  const currentTab = catalogTab;

  if (!catalogSearch) {
    if (currentTab === "services" && groupedServices.length > 0) {
      accordionValue = [groupedServices[0].id];
    } else if (currentTab === "products" && groupedProducts.length > 0) {
      accordionValue = [groupedProducts[0].id];
    }
  }
});

let assignStaffOpen = $state(false);
</script>

<div class="h-full flex flex-col lg:flex-row items-stretch overflow-hidden bg-transparent">
  <!-- LEFT COLUMN: FORM (Scrollable) -->
  <ScrollArea class="flex-1 h-full">
    <div class="flex-1 min-w-0 p-6 pb-20">
      <div class="bg-card text-card-foreground rounded-xl shadow-sm p-6 space-y-6">
        <!-- Header -->
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
              <FileText class="h-6 w-6" /> Tạo Hóa Đơn
            </h2>
            <p class="text-muted-foreground">Điền thông tin chi tiết để tạo hóa đơn mới</p>
          </div>
          <div class="text-right">
            <div class="text-xs text-muted-foreground uppercase tracking-wider">
              {#if saveStatus === "saving"}
                <span class="flex items-center justify-end gap-1 text-blue-500">
                  <Loader2 class="h-3 w-3 animate-spin" /> Đang lưu...
                </span>
              {:else if saveStatus === "error"}
                <span class="text-red-500 cursor-help" title={lastError || "Lỗi không xác định"}>
                  ⚠️ Lỗi: {lastError || "Không thể lưu"}
                </span>
              {:else}
                <span class="text-green-600">Đã lưu</span>
              {/if}
            </div>
            <div class="text-2xl font-black font-mono">
              #{invoice.id || "AUTO"}
            </div>
          </div>
        </div>
        <div class="grid gap-2 sm:grid-cols-3">
          <div class="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wider text-muted-foreground">Số mục</p>
            <p class="text-sm font-semibold">{itemCount} mục</p>
          </div>
          <div class="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wider text-muted-foreground">
              Nhân viên đã xếp
            </p>
            <p class="text-sm font-semibold">{assignedStaffCount} người</p>
          </div>
          <div class="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
            <p class="text-[11px] uppercase tracking-wider text-muted-foreground">Tổng tạm tính</p>
            <p class="text-sm font-semibold">{formatPrice(subtotal)}</p>
          </div>
        </div>

        <!-- Customer & Dates Info -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Customer -->
          <div class="space-y-2">
            <Label class="flex items-center gap-2">
              <User class="h-4 w-4" /> Khách hàng
            </Label>
            {#if selectedCustomer}
              <div
                class="h-[44px] rounded-lg border border-blue-100 bg-blue-50/50 px-3 dark:bg-blue-900/10 flex items-center justify-between gap-2"
              >
                <div class="min-w-0 overflow-hidden">
                  <div class="truncate text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {selectedCustomer.name}
                  </div>
                  <div class="truncate text-xs text-muted-foreground">
                    {selectedCustomer.phone || "Không có SĐT"}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-7 w-7 shrink-0"
                  onclick={removeCustomer}
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            {:else}
              <div>
                <Combobox
                  items={customerItems}
                  bind:value={invoice.customerId}
                  placeholder="Tìm khách hàng..."
                  searchPlaceholder="Tìm theo tên hoặc SĐT..."
                  emptyText="Không tìm thấy khách hàng."
                  class="w-full h-[44px]"
                />
              </div>
            {/if}
          </div>

          <!-- Date -->
          <div class="space-y-2">
            <Label class="flex items-center gap-2">
              <CalendarIcon class="h-4 w-4" /> Ngày hóa đơn
            </Label>
            <DatePicker
              bind:value={invoice.invoiceDate}
              class="w-full bg-muted/50 h-[44px]"
              disabled={false}
            />
          </div>

          <!-- Time -->
          <div class="space-y-2">
            <Label class="flex items-center gap-2">
              <CalendarIcon class="h-4 w-4" /> Thời gian
            </Label>
            <Input
              type="time"
              bind:value={invoiceTime}
              class="h-[44px] bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
          </div>
        </div>

        <!-- Items List -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <Label class="flex items-center gap-2 text-base">
              <Package class="h-4 w-4" /> Chi tiết dịch vụ & sản phẩm
            </Label>
          </div>

          {#if invoice.items.length > 0}
            <div class="space-y-4">
              {#if serviceItemEntries.length > 0}
                <div class="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm font-semibold text-primary">
                      <Sparkles class="h-4 w-4" />
                      Dịch vụ
                    </div>
                    <span
                      class="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                    >
                      {serviceItemEntries.length} mục
                    </span>
                  </div>
                  <div class="mb-2 overflow-x-auto">
                    <div
                      class="hidden min-w-[760px] items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(180px,1fr)_110px_64px_170px_120px_34px]"
                    >
                      <span>Mục</span>
                      <span>Đơn giá</span>
                      <span class="text-center">SL</span>
                      <span>Giảm giá</span>
                      <span class="text-right">Thành tiền</span>
                      <span></span>
                    </div>
                  </div>
                  <div class="space-y-2 overflow-x-auto">
                    {#each serviceItemEntries as entry (entry.index)}
                      <InvoiceItemRow
                        bind:item={invoice.items[entry.index]}
                        index={entry.index}
                        {removeItem}
                        compact
                      />
                    {/each}
                  </div>
                </div>
              {/if}

              {#if productItemEntries.length > 0}
                <div class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                  <div class="mb-3 flex items-center justify-between">
                    <div class="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                      <ShoppingBag class="h-4 w-4" />
                      Sản phẩm
                    </div>
                    <span
                      class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
                    >
                      {productItemEntries.length} mục
                    </span>
                  </div>
                  <div class="mb-2 overflow-x-auto">
                    <div
                      class="hidden min-w-[760px] items-center gap-2 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground md:grid md:grid-cols-[minmax(180px,1fr)_110px_64px_170px_120px_34px]"
                    >
                      <span>Mục</span>
                      <span>Đơn giá</span>
                      <span class="text-center">SL</span>
                      <span>Giảm giá</span>
                      <span class="text-right">Thành tiền</span>
                      <span></span>
                    </div>
                  </div>
                  <div class="space-y-2 overflow-x-auto">
                    {#each productItemEntries as entry (entry.index)}
                      <InvoiceItemRow
                        bind:item={invoice.items[entry.index]}
                        index={entry.index}
                        {removeItem}
                        compact
                      />
                    {/each}
                  </div>
                </div>
              {/if}
            </div>
          {:else}
            <div
              class="text-center py-12 border-2 border-dashed rounded-xl bg-muted/30 text-muted-foreground"
            >
              <p>Chưa có dịch vụ hoặc sản phẩm nào được chọn</p>
              <p class="text-sm">Vui lòng chọn từ danh sách bên phải</p>
              <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
                <Button variant="outline" size="sm" onclick={() => addItem("service")}>
                  <Plus class="h-3.5 w-3.5 mr-1" />
                  Thêm dịch vụ tùy chỉnh
                </Button>
                <Button variant="outline" size="sm" onclick={() => addItem("product")}>
                  <Plus class="h-3.5 w-3.5 mr-1" />
                  Thêm sản phẩm tùy chỉnh
                </Button>
              </div>
            </div>
          {/if}
        </div>

        <!-- Footer Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <!-- Notes -->
          <div class="space-y-2 block">
            <Label>Ghi chú</Label>
            <textarea
              class="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Thêm ghi chú hoặc điều khoản..."
              bind:value={invoice.notes}
            ></textarea>
          </div>

          <!-- Totals -->
          <div class="space-y-4 pl-0 md:pl-6">
            <div class="flex items-center gap-2 mb-4">
              <span class="font-semibold text-sm">Tổng hợp thanh toán</span>
            </div>

            <div class="flex justify-between text-sm">
              <span class="text-muted-foreground">Tạm tính</span>
              <span>{formatPrice(subtotal)}</span>
            </div>

            <div class="flex justify-between items-center text-sm">
              <span class="text-muted-foreground">Giảm giá</span>
              <div class="flex items-center gap-2">
                <div class="relative w-24">
                  <Input
                    type="number"
                    class="h-8 text-right pr-7"
                    bind:value={invoice.discountValue}
                  />
                  <span class="absolute right-2 top-1.5 text-xs text-muted-foreground">
                    {invoice.discountType === "percent" ? "%" : "đ"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8 text-xs"
                  onclick={() =>
                    (invoice.discountType =
                      invoice.discountType === "percent" ? "fixed" : "percent")}
                >
                  {invoice.discountType === "percent" ? "%" : "$"}
                </Button>
              </div>
            </div>

            <Separator />

            <div class="flex justify-between items-end">
              <span class="font-bold text-lg">Tổng cộng</span>
              <span class="font-bold text-2xl text-primary">{formatPrice(total)}</span>
            </div>

            <!-- Payment Method -->
            <div class="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
              <Label>Phương thức thanh toán</Label>
              <Select.Root
                type="single"
                value={invoice.paymentMethod}
                onValueChange={(v) => (invoice.paymentMethod = v as any)}
              >
                <Select.Trigger class="w-full sm:w-[180px]">
                  {invoice.paymentMethod === "cash"
                    ? "Tiền mặt"
                    : invoice.paymentMethod === "card"
                      ? "Thẻ"
                      : "Chuyển khoản"}
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="cash">Tiền mặt</Select.Item>
                  <Select.Item value="card">Thẻ</Select.Item>
                  <Select.Item value="transfer">Chuyển khoản</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <div class="mt-4 space-y-3">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <form
                  class="min-w-0"
                  method="POST"
                  action="?/delete"
                  use:enhance={({ formData, cancel }) => {
                    if (!invoice.id || !confirm("Bạn có chắc muốn hủy hóa đơn này?")) {
                      cancel();
                      return;
                    }
                    isLoading = true;
                    formData.set("id", invoice.id.toString());
                    return async ({ result }) => {
                      isLoading = false;
                      if (result.type === "success") {
                        toast.success("Đã hủy hóa đơn");
                        onSaveSuccess();
                      } else if (result.type === "failure") {
                        toast.error((result.data?.message as string) || "Không thể hủy hóa đơn");
                      }
                    };
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    size="lg"
                    class="w-full min-w-0 whitespace-normal text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    disabled={isLoading}
                  >
                    Hủy thanh toán
                  </Button>
                </form>

                <Button
                  variant="outline"
                  size="lg"
                  class="w-full min-w-0 whitespace-normal text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                  onclick={() => (assignStaffOpen = true)}
                >
                  <User class="h-4 w-4 mr-2" /> Xếp nhân viên
                </Button>
              </div>

              <form
                method="POST"
                action="?/update"
                use:enhance={({ formData, cancel }) => {
                  if (!invoice.id) {
                    toast.error("Không tìm thấy mã hóa đơn");
                    cancel();
                    return;
                  }
                  if (invoice.items.length === 0) {
                    toast.error("Vui lòng thêm ít nhất một dịch vụ hoặc sản phẩm");
                    cancel();
                    return;
                  }
                  isLoading = true;
                  formData.set("id", invoice.id.toString());
                  formData.set("payload", JSON.stringify(getInvoicePayload("paid")));
                  return async ({ result }) => {
                    isLoading = false;
                    if (result.type === "success") {
                      toast.success("Hoàn thành hóa đơn thành công");
                      onSaveSuccess();
                    } else if (result.type === "failure") {
                      toast.error((result.data?.message as string) || "Có lỗi xảy ra");
                    }
                  };
                }}
              >
                <Button
                  type="submit"
                  class="w-full btn-gradient shadow-md shadow-primary/25"
                  size="lg"
                  disabled={isLoading}
                >
                  {#if isLoading}
                    <Loader2 class="h-4 w-4 mr-2 animate-spin" />
                  {/if}
                  Hoàn thành
                </Button>
              </form>
            </div>

            {#if invoice.status === "paid"}
              <form
                method="POST"
                action="?/update"
                use:enhance={({ formData, cancel }) => {
                  if (!invoice.id) return cancel();

                  isLoading = true;
                  formData.set("id", invoice.id.toString());
                  // Send status pending and clear paidAt (backend should handle null/undefined if flexible, or logic handles it)
                  // Based on plan: payload: { status: 'pending', paidAt: null }
                  formData.set(
                    "payload",
                    JSON.stringify({
                      status: "pending",
                      paidAt: null,
                    }),
                  );

                  return async ({ result }) => {
                    isLoading = false;
                    if (result.type === "success") {
                      toast.success("Đã hủy hoàn thành hóa đơn");
                      onSaveSuccess();
                    } else {
                      toast.error("Không thể cập nhật trạng thái");
                    }
                  };
                }}
              >
                <Button
                  type="submit"
                  variant="outline"
                  class="w-full border-orange-200 text-orange-700 hover:bg-orange-50 mt-2"
                  disabled={isLoading}
                >
                  <RotateCcw class="h-4 w-4 mr-2" />
                  Hủy hoàn thành
                </Button>
              </form>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </ScrollArea>

  <!-- RIGHT COLUMN: CATALOG -->
  <div class="w-full shrink-0 flex flex-col h-full bg-muted/5 p-6 lg:w-[360px] lg:min-w-[340px]">
    <!-- Catalog Header & Search (Fixed) -->
    <div class="flex flex-col">
      <div class="p-4 pb-2">
        <div class="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold flex items-center gap-2">
            <Package class="h-4 w-4" /> Danh mục
          </h3>
          <Button
            size="sm"
            variant="secondary"
            class="h-7 text-xs whitespace-nowrap"
            onclick={() => addItem("service")}
          >
            <Plus class="h-3 w-3 mr-1" /> Tùy chỉnh
          </Button>
        </div>

        <Tabs.Root
          value={catalogTab}
          onValueChange={(v) => (catalogTab = v as string)}
          class="w-full"
        >
          <Tabs.List class="mb-0 grid w-full grid-cols-2 rounded-lg bg-muted/50 p-1">
            <Tabs.Trigger
              value="services"
              class="min-w-0 rounded-md px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >Dịch vụ</Tabs.Trigger
            >
            <Tabs.Trigger
              value="products"
              class="min-w-0 rounded-md px-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >Sản phẩm</Tabs.Trigger
            >
          </Tabs.List>
        </Tabs.Root>
        <p class="mt-2 text-xs text-muted-foreground">
          Hiển thị {catalogResultCount} mục phù hợp
        </p>
      </div>

      <Separator />

      <div class="p-4">
        <div class="relative">
          <Search class="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            class="pl-9 pr-8 bg-muted/20 border-none shadow-none focus-visible:ring-1"
            bind:value={catalogSearch}
          />
          {#if catalogSearch}
            <button
              type="button"
              class="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              onclick={() => (catalogSearch = "")}
              aria-label="Xóa tìm kiếm"
            >
              <X class="h-3.5 w-3.5" />
            </button>
          {/if}
        </div>
      </div>

      <div class="flex-1 min-h-0 bg-muted/5">
        <ScrollArea class="h-full">
          <!-- Note: Tabs Content must be here, but Tabs.Root is in header.
                              Separating Tabs.Root and Content is not standard in some libs, but shadcn Tabs uses Context so it should work if Root wraps everything.
                              Ah, I closed Tabs.Root in the header div. That won't work.
                              I must wrap the whole thing in Tabs.Root.
                         -->
          <!-- RE-WRAPPING LOGIC below in "Tabs Fix" -->
          {#if catalogTab === "services"}
            {#if groupedServices.length > 0}
              <Accordion.Root type="multiple" bind:value={accordionValue} class="w-full">
                {#each groupedServices as group}
                  <Accordion.Item value={group.id} class="border-b-0">
                    <Accordion.Trigger
                      class="px-3 py-2 hover:bg-muted/50 hover:no-underline rounded-md data-[state=open]:bg-muted/50 text-sm font-semibold"
                    >
                      {group.name} ({group.items.length})
                    </Accordion.Trigger>
                    <Accordion.Content class="pt-1 pb-2">
                      <div class="space-y-1">
                        {#each group.items as s}
                          <button
                            class="w-full flex items-center justify-between p-2 pl-4 rounded-md hover:bg-background hover:shadow-sm border border-transparent hover:border-gray-200 text-sm transition-all group bg-transparent/50"
                            onclick={() => addItem("service", s)}
                          >
                            <div class="flex flex-col items-start text-left">
                              <span
                                class="font-medium text-xs group-hover:text-primary transition-colors"
                              >
                                {s.name}
                              </span>
                            </div>
                            <span
                              class="font-semibold text-xs text-muted-foreground group-hover:text-primary whitespace-nowrap ml-2"
                            >
                              {formatPrice(s.price)}
                            </span>
                          </button>
                        {/each}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                {/each}
              </Accordion.Root>
            {:else}
              <div class="text-center py-8 text-muted-foreground text-sm">
                Không tìm thấy dịch vụ
              </div>
            {/if}
          {:else if groupedProducts.length > 0}
            <Accordion.Root type="multiple" bind:value={accordionValue} class="w-full">
              {#each groupedProducts as group}
                <Accordion.Item value={group.id} class="border-b-0">
                  <Accordion.Trigger
                    class="px-3 py-2 hover:bg-muted/50 hover:no-underline rounded-md data-[state=open]:bg-muted/50 text-sm font-semibold"
                  >
                    {group.name} ({group.items.length})
                  </Accordion.Trigger>
                  <Accordion.Content class="pt-1 pb-2">
                    <div class="space-y-1">
                      {#each group.items as p}
                        <button
                          class="w-full flex items-center justify-between p-2 pl-4 rounded-md hover:bg-background hover:shadow-sm border border-transparent hover:border-gray-200 text-sm transition-all group bg-transparent/50"
                          onclick={() => addItem("product", p)}
                        >
                          <div class="flex flex-col items-start text-left">
                            <span
                              class="font-medium text-xs group-hover:text-primary transition-colors"
                            >
                              {p.name}
                            </span>
                          </div>
                          <span
                            class="font-semibold text-xs text-muted-foreground group-hover:text-primary whitespace-nowrap ml-2"
                          >
                            {formatPrice(p.price)}
                          </span>
                        </button>
                      {/each}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              {/each}
            </Accordion.Root>
          {:else}
            <div class="text-center py-8 text-muted-foreground text-sm">
              Không tìm thấy sản phẩm
            </div>
          {/if}
        </ScrollArea>
      </div>
    </div>
  </div>

  <!-- Staff Assignment Dialog -->
  <StaffAssignmentDialog
    bind:open={assignStaffOpen}
    bind:items={invoice.items}
    {staff}
    {commissionRules}
    onConfirm={() => {
      // Trigger auto-save by re-assigning invoice.items
      invoice.items = [...invoice.items];
    }}
  />
</div>
