<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data: invoices, status } = await useAsyncData("invoices", async () => {
  const { data, error } = await client
    .from("invoice")
    .select("*, customer(name, phone)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
});

const searchQuery = ref("");

const filteredInvoices = computed(() => {
  if (!invoices.value) return [];
  const query = searchQuery.value.toLowerCase();
  return invoices.value.filter(
    (invoice: any) =>
      invoice.customer?.name?.toLowerCase().includes(query) ||
      invoice.invoice_number?.toLowerCase().includes(query)
  );
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");

const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return { color: "success" as const, label: "Đã thanh toán" };
    case "pending":
      return { color: "warning" as const, label: "Chờ thanh toán" };
    case "cancelled":
      return { color: "error" as const, label: "Đã hủy" };
    default:
      return { color: "neutral" as const, label: status };
  }
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Hóa đơn</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <UInput
          v-model="searchQuery"
          placeholder="Tìm kiếm hóa đơn..."
          icon="i-lucide-search"
          class="max-w-sm"
        />
        <UButton icon="i-lucide-plus">Tạo hóa đơn</UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :loading="status === 'pending'"
        :data="filteredInvoices"
        :columns="[
          { key: 'invoice_number', label: 'Mã hóa đơn' },
          { key: 'customer', label: 'Khách hàng' },
          { key: 'total_amount', label: 'Tổng tiền' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'created_at', label: 'Ngày tạo' },
          { key: 'actions', label: 'Thao tác' },
        ]"
      >
        <template #invoice_number-cell="{ row }">
          <span class="font-medium font-mono">{{
            row.original.invoice_number || row.original.id?.slice(0, 8)
          }}</span>
        </template>
        <template #customer-cell="{ row }">
          <div>
            <div class="font-medium">
              {{ row.original.customer?.name || "-" }}
            </div>
            <div class="text-sm text-muted">
              {{ row.original.customer?.phone }}
            </div>
          </div>
        </template>
        <template #total_amount-cell="{ row }">
          <span class="font-semibold">{{
            formatPrice(row.original.total_amount)
          }}</span>
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="getStatusBadge(row.original.status).color">
            {{ getStatusBadge(row.original.status).label }}
          </UBadge>
        </template>
        <template #created_at-cell="{ row }">
          {{ formatDate(row.original.created_at) }}
        </template>
        <template #actions-cell>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-eye"
              color="neutral"
              variant="ghost"
              size="xs"
              title="Xem chi tiết"
            />
            <UButton
              icon="i-lucide-printer"
              color="neutral"
              variant="ghost"
              size="xs"
              title="In hóa đơn"
            />
          </div>
        </template>
        <template #empty>
          <div class="text-center py-8 text-muted">
            {{
              searchQuery ? "Không tìm thấy hóa đơn nào" : "Chưa có hóa đơn nào"
            }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
