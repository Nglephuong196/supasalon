<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data: bookings, status } = await useAsyncData("bookings", async () => {
  const { data, error } = await client
    .from("booking")
    .select("*, customer(name, phone), employee(name), service(name, price)")
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false });

  if (error) throw error;
  return data || [];
});

const searchQuery = ref("");

const filteredBookings = computed(() => {
  if (!bookings.value) return [];
  const query = searchQuery.value.toLowerCase();
  return bookings.value.filter(
    (booking: any) =>
      booking.customer?.name?.toLowerCase().includes(query) ||
      booking.service?.name?.toLowerCase().includes(query)
  );
});

const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return { color: "info" as const, label: "Đã xác nhận" };
    case "completed":
      return { color: "success" as const, label: "Hoàn thành" };
    case "cancelled":
      return { color: "error" as const, label: "Đã hủy" };
    case "no_show":
      return { color: "neutral" as const, label: "Không đến" };
    default:
      return { color: "warning" as const, label: "Chờ xác nhận" };
  }
};

const formatDate = (date: string) => new Date(date).toLocaleDateString("vi-VN");
const formatTime = (time: string) => time?.slice(0, 5) || "";
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <UInput
          v-model="searchQuery"
          placeholder="Tìm kiếm lịch hẹn..."
          icon="i-lucide-search"
          class="max-w-sm"
        />
        <UButton icon="i-lucide-plus">Tạo lịch hẹn</UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :loading="status === 'pending'"
        :data="filteredBookings"
        :columns="[
          { key: 'booking_date', label: 'Ngày' },
          { key: 'start_time', label: 'Giờ' },
          { key: 'customer', label: 'Khách hàng' },
          { key: 'service', label: 'Dịch vụ' },
          { key: 'employee', label: 'Nhân viên' },
          { key: 'status', label: 'Trạng thái' },
          { key: 'actions', label: 'Thao tác' },
        ]"
      >
        <template #booking_date-cell="{ row }">
          {{ formatDate(row.original.booking_date) }}
        </template>
        <template #start_time-cell="{ row }">
          <span class="font-medium">{{
            formatTime(row.original.start_time)
          }}</span>
        </template>
        <template #customer-cell="{ row }">
          <div>
            <div class="font-medium">{{ row.original.customer?.name }}</div>
            <div class="text-sm text-muted">
              {{ row.original.customer?.phone }}
            </div>
          </div>
        </template>
        <template #service-cell="{ row }">
          {{ row.original.service?.name }}
        </template>
        <template #employee-cell="{ row }">
          {{ row.original.employee?.name || "-" }}
        </template>
        <template #status-cell="{ row }">
          <UBadge :color="getStatusBadge(row.original.status).color">
            {{ getStatusBadge(row.original.status).label }}
          </UBadge>
        </template>
        <template #actions-cell>
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="ghost"
            size="xs"
          />
        </template>
        <template #empty>
          <div class="text-center py-8 text-muted">
            {{
              searchQuery
                ? "Không tìm thấy lịch hẹn nào"
                : "Chưa có lịch hẹn nào"
            }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
