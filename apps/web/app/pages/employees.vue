<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data: employees, status } = await useAsyncData(
  "employees",
  async () => {
    const { data, error } = await client
      .from("employee")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }
);

const searchQuery = ref("");

const filteredEmployees = computed(() => {
  if (!employees.value) return [];
  const query = searchQuery.value.toLowerCase();
  return employees.value.filter(
    (emp: any) =>
      emp.name?.toLowerCase().includes(query) || emp.phone?.includes(query)
  );
});

const formatDate = (date: string) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "-";
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Nhân viên</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <UInput
          v-model="searchQuery"
          placeholder="Tìm kiếm nhân viên..."
          icon="i-lucide-search"
          class="max-w-sm"
        />
        <UButton icon="i-lucide-plus">Thêm nhân viên</UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :loading="status === 'pending'"
        :data="filteredEmployees"
        :columns="[
          { key: 'name', label: 'Tên nhân viên' },
          { key: 'phone', label: 'Số điện thoại' },
          { key: 'email', label: 'Email' },
          { key: 'position', label: 'Chức vụ' },
          { key: 'hire_date', label: 'Ngày vào làm' },
          { key: 'actions', label: 'Thao tác' },
        ]"
      >
        <template #name-cell="{ row }">
          <div class="flex items-center gap-3">
            <UAvatar size="sm" :alt="row.original.name" />
            <span class="font-medium">{{ row.original.name }}</span>
          </div>
        </template>
        <template #phone-cell="{ row }">
          {{ row.original.phone || "-" }}
        </template>
        <template #email-cell="{ row }">
          {{ row.original.email || "-" }}
        </template>
        <template #position-cell="{ row }">
          <UBadge v-if="row.original.position" color="info" variant="subtle">
            {{ row.original.position }}
          </UBadge>
          <span v-else class="text-muted">-</span>
        </template>
        <template #hire_date-cell="{ row }">
          {{ formatDate(row.original.hire_date) }}
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
                ? "Không tìm thấy nhân viên nào"
                : "Chưa có nhân viên nào"
            }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
