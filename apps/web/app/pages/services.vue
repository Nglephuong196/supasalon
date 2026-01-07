<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const client = useSupabaseClient();

const { data, status } = await useAsyncData("services-data", async () => {
  const [servicesRes, categoriesRes] = await Promise.all([
    client.from("service").select("*, service_category(name)").order("name"),
    client.from("service_category").select("*").order("name"),
  ]);

  if (servicesRes.error) throw servicesRes.error;
  if (categoriesRes.error) throw categoriesRes.error;

  return {
    services: servicesRes.data || [],
    categories: categoriesRes.data || [],
  };
});

const searchQuery = ref("");
const selectedCategory = ref<string | null>(null);

const filteredServices = computed(() => {
  if (!data.value?.services) return [];
  return data.value.services.filter((service: any) => {
    const matchesSearch = service.name
      ?.toLowerCase()
      .includes(searchQuery.value.toLowerCase());
    const matchesCategory =
      !selectedCategory.value || service.category_id === selectedCategory.value;
    return matchesSearch && matchesCategory;
  });
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
      <h1 class="text-2xl font-bold tracking-tight">Dịch vụ</h1>
      <div class="flex flex-col sm:flex-row gap-4 justify-between">
        <div class="flex gap-4 flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Tìm kiếm dịch vụ..."
            icon="i-lucide-search"
            class="max-w-sm flex-1"
          />
          <USelect
            v-model="selectedCategory"
            :items="[
              { label: 'Tất cả danh mục', value: null },
              ...(data?.categories || []).map((c: any) => ({ label: c.name, value: c.id }))
            ]"
            class="w-auto"
          />
        </div>
        <UButton icon="i-lucide-plus">Thêm dịch vụ</UButton>
      </div>
    </div>

    <!-- Services Grid -->
    <div
      v-if="status === 'pending'"
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton v-for="i in 8" :key="i" class="h-40" />
    </div>
    <div
      v-else-if="filteredServices.length === 0"
      class="text-center py-12 text-muted"
    >
      {{ searchQuery ? "Không tìm thấy dịch vụ nào" : "Chưa có dịch vụ nào" }}
    </div>
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <UCard
        v-for="service in filteredServices"
        :key="service.id"
        class="hover:shadow-md transition-shadow"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-start justify-between">
            <div>
              <h3 class="font-medium">{{ service.name }}</h3>
              <UBadge
                v-if="service.service_category"
                color="neutral"
                variant="subtle"
                size="xs"
                class="mt-1"
              >
                {{ service.service_category.name }}
              </UBadge>
            </div>
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              size="xs"
            />
          </div>
          <p v-if="service.description" class="text-sm text-muted line-clamp-2">
            {{ service.description }}
          </p>
          <div
            class="flex items-center justify-between pt-2 border-t border-default"
          >
            <div class="flex items-center gap-2 text-sm text-muted">
              <UIcon name="i-lucide-clock" class="h-4 w-4" />
              {{ service.duration_minutes }} phút
            </div>
            <div class="font-semibold text-primary">
              {{ formatPrice(service.price) }}
            </div>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
