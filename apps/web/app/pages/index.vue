<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});

const formattedDate = computed(() => {
  return new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

// Mock data for dashboard
const todayBookings = [
  {
    time: "09:00",
    customer: "Nguyễn Văn A",
    service: "Cắt tóc nam",
    stylist: "Minh",
  },
  {
    time: "10:30",
    customer: "Trần Thị B",
    service: "Nhuộm tóc",
    stylist: "Hương",
  },
  { time: "11:00", customer: "Lê Văn C", service: "Uốn tóc", stylist: "Lan" },
  {
    time: "14:00",
    customer: "Phạm Thị D",
    service: "Gội đầu",
    stylist: "Minh",
  },
];

const topStylists = [
  { name: "Nguyễn Minh", revenue: "5.200.000đ", bookings: 45 },
  { name: "Trần Hương", revenue: "4.800.000đ", bookings: 42 },
  { name: "Lê Lan", revenue: "4.500.000đ", bookings: 38 },
  { name: "Phạm Đức", revenue: "4.200.000đ", bookings: 35 },
  { name: "Hoàng Mai", revenue: "3.900.000đ", bookings: 32 },
];

const lowStockProducts = [
  { name: "Dầu gội Loreal", stock: 3, unit: "chai" },
  { name: "Thuốc nhuộm Revlon", stock: 5, unit: "hộp" },
  { name: "Kéo cắt tóc", stock: 2, unit: "cái" },
  { name: "Wax vuốt tóc", stock: 4, unit: "hũ" },
];
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Header Section -->
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div>
        <h1 class="text-2xl font-bold tracking-tight">
          Chào mừng trở lại, Salon Pro
        </h1>
        <p class="text-muted">
          Đây là những gì đang xảy ra tại salon của bạn hôm nay.
        </p>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted capitalize">{{ formattedDate }}</span>
        <UButton icon="i-lucide-plus" to="/bookings/new"
          >Tạo lịch hẹn mới</UButton
        >
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UCard>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-dollar-sign"
              class="h-6 w-6 text-purple-600"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Tổng doanh thu</p>
            <p class="text-2xl font-bold">12.450.000đ</p>
            <p class="text-xs text-green-600">+12% so với tháng trước</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-calendar-days"
              class="h-6 w-6 text-blue-600"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Lịch hẹn hôm nay</p>
            <p class="text-2xl font-bold">45</p>
            <p class="text-xs text-green-600">+5% so với hôm qua</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <UIcon name="i-lucide-users" class="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p class="text-sm text-muted">Khách hàng mới</p>
            <p class="text-2xl font-bold">8</p>
            <p class="text-xs text-green-600">+2% so với tuần trước</p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-4">
          <div
            class="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
          >
            <UIcon
              name="i-lucide-trending-up"
              class="h-6 w-6 text-orange-600"
            />
          </div>
          <div>
            <p class="text-sm text-muted">Giá trị trung bình</p>
            <p class="text-2xl font-bold">85.000đ</p>
            <p class="text-xs text-green-600">+1.5% so với tháng trước</p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Main Content Grid -->
    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Revenue Chart -->
      <UCard class="lg:col-span-3">
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Doanh thu theo tháng</h3>
            <p class="text-sm text-muted">
              Biểu đồ doanh thu 12 tháng gần nhất
            </p>
          </div>
        </template>
        <div class="h-[300px] flex items-center justify-center text-muted">
          Biểu đồ doanh thu sẽ hiển thị ở đây
        </div>
      </UCard>

      <!-- Today's Schedule -->
      <UCard class="lg:col-span-2">
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Lịch hẹn hôm nay</h3>
            <p class="text-sm text-muted">Các cuộc hẹn sắp tới</p>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="booking in todayBookings"
            :key="booking.time"
            class="flex items-center gap-4 p-3 rounded-lg bg-muted/50"
          >
            <div class="text-sm font-medium w-12">{{ booking.time }}</div>
            <div class="flex-1">
              <div class="font-medium">{{ booking.customer }}</div>
              <div class="text-sm text-muted">{{ booking.service }}</div>
            </div>
            <div class="text-sm text-muted">{{ booking.stylist }}</div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Bottom Section -->
    <div class="grid gap-6 md:grid-cols-2">
      <!-- Top Stylists -->
      <UCard>
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Nhân viên xuất sắc</h3>
            <p class="text-sm text-muted">
              Top 5 nhân viên có doanh thu cao nhất
            </p>
          </div>
        </template>
        <div class="space-y-4">
          <div
            v-for="(stylist, i) in topStylists"
            :key="stylist.name"
            class="flex items-center gap-4"
          >
            <div
              class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary"
            >
              {{ i + 1 }}
            </div>
            <div class="flex-1">
              <div class="font-medium">{{ stylist.name }}</div>
              <div class="text-sm text-muted">
                {{ stylist.bookings }} lịch hẹn
              </div>
            </div>
            <div class="text-sm font-medium">{{ stylist.revenue }}</div>
          </div>
        </div>
      </UCard>

      <!-- Low Stock Alerts -->
      <UCard>
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Cảnh báo tồn kho</h3>
            <p class="text-sm text-muted">Sản phẩm sắp hết hàng</p>
          </div>
        </template>
        <div class="space-y-3">
          <div
            v-for="product in lowStockProducts"
            :key="product.name"
            class="flex items-center gap-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="h-5 w-5 text-red-600"
            />
            <div class="flex-1">
              <div class="font-medium">{{ product.name }}</div>
              <div class="text-sm text-red-600">
                Còn {{ product.stock }} {{ product.unit }}
              </div>
            </div>
            <UButton size="xs" variant="outline">Đặt hàng</UButton>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
