<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data: products, status } = await useAsyncData("products", async () => {
  const { data, error } = await client
    .from("product")
    .select("*")
    .order("name");

  if (error) throw error;
  return data || [];
});

const searchQuery = ref("");

const filteredProducts = computed(() => {
  if (!products.value) return [];
  const query = searchQuery.value.toLowerCase();
  return products.value.filter((product: any) =>
    product.name?.toLowerCase().includes(query)
  );
});

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(price);
};
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header -->
    <div class="flex flex-col gap-4">
      <h1 class="text-2xl font-bold tracking-tight">Sản phẩm</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <UInput
          v-model="searchQuery"
          placeholder="Tìm kiếm sản phẩm..."
          icon="i-lucide-search"
          class="max-w-sm"
        />
        <UButton icon="i-lucide-plus">Thêm sản phẩm</UButton>
      </div>
    </div>

    <!-- Table -->
    <UCard :ui="{ body: 'p-0' }">
      <UTable
        :loading="status === 'pending'"
        :data="filteredProducts"
        :columns="[
          { key: 'name', label: 'Tên sản phẩm' },
          { key: 'price', label: 'Giá bán' },
          { key: 'stock', label: 'Tồn kho' },
          { key: 'description', label: 'Mô tả' },
          { key: 'actions', label: 'Thao tác' },
        ]"
      >
        <template #name-cell="{ row }">
          <span class="font-medium">{{ row.original.name }}</span>
        </template>
        <template #price-cell="{ row }">
          {{ formatPrice(row.original.price) }}
        </template>
        <template #stock-cell="{ row }">
          <UBadge
            :color="row.original.stock < 10 ? 'error' : 'success'"
            variant="subtle"
          >
            {{ row.original.stock }}
          </UBadge>
        </template>
        <template #description-cell="{ row }">
          <span class="text-muted line-clamp-1">{{
            row.original.description || "-"
          }}</span>
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
                ? "Không tìm thấy sản phẩm nào"
                : "Chưa có sản phẩm nào"
            }}
          </div>
        </template>
      </UTable>
    </UCard>
  </div>
</template>
