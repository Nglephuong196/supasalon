<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data: customers, status } = await useAsyncData(
  "customers",
  async () => {
    const { data, error } = await client
      .from("customer")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }
);

const searchQuery = ref("");

const filteredCustomers = computed(() => {
  if (!customers.value) return [];
  const query = searchQuery.value.toLowerCase();
  return customers.value.filter(
    (customer: any) =>
      customer.name?.toLowerCase().includes(query) ||
      customer.phone?.includes(query) ||
      customer.email?.toLowerCase().includes(query)
  );
});

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "-";

const getGenderLabel = (gender: string | null) => {
  if (gender === "male") return "Nam";
  if (gender === "female") return "Nữ";
  return "-";
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Khách hàng</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <UInput
          v-model="searchQuery"
          placeholder="Tìm kiếm khách hàng..."
          icon="i-lucide-search"
          class="max-w-sm"
        />
        <UButton icon="i-lucide-plus">Thêm khách hàng</UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :loading="status === 'pending'"
        :data="filteredCustomers"
        :columns="[
          { key: 'name', label: 'Tên khách hàng' },
          { key: 'phone', label: 'Số điện thoại' },
          { key: 'email', label: 'Email' },
          { key: 'gender', label: 'Giới tính' },
          { key: 'date_of_birth', label: 'Ngày sinh' },
          { key: 'notes', label: 'Ghi chú' },
          { key: 'actions', label: 'Thao tác' },
        ]"
      >
        <template #name-cell="{ row }">
          <span class="font-medium">{{ row.original.name }}</span>
        </template>
        <template #phone-cell="{ row }">
          {{ row.original.phone || "-" }}
        </template>
        <template #email-cell="{ row }">
          {{ row.original.email || "-" }}
        </template>
        <template #gender-cell="{ row }">
          <UBadge v-if="row.original.gender" color="neutral" variant="subtle">
            {{ getGenderLabel(row.original.gender) }}
          </UBadge>
          <span v-else class="text-muted">-</span>
        </template>
        <template #date_of_birth-cell="{ row }">
          {{ formatDate(row.original.date_of_birth) }}
        </template>
        <template #notes-cell="{ row }">
          <span class="text-muted">{{ row.original.notes || "-" }}</span>
        </template>
        <template #actions-cell>
          <div class="flex items-center gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              size="xs"
            />
          </div>
        </template>
        <template #empty>
          <div class="text-center py-8 text-muted">
            {{
              searchQuery
                ? "Không tìm thấy khách hàng nào"
                : "Chưa có khách hàng nào"
            }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
