<script setup lang="ts">
const props = defineProps<{
  collapsed?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const route = useRoute();

const sidebarItems = [
  { title: "Tổng quan", href: "/", icon: "i-lucide-layout-dashboard" },
  { title: "Lịch hẹn", href: "/bookings", icon: "i-lucide-calendar-days" },
  { title: "Dịch vụ", href: "/services", icon: "i-lucide-scissors" },
  { title: "Sản phẩm", href: "/products", icon: "i-lucide-package" },
  { title: "Khách hàng", href: "/customers", icon: "i-lucide-users" },
  { title: "Hóa đơn", href: "/invoices", icon: "i-lucide-receipt" },
  { title: "Nhân viên", href: "/employees", icon: "i-lucide-user-cog" },
  { title: "Cài đặt", href: "/settings", icon: "i-lucide-settings" },
];

const isActive = (href: string) => {
  if (href === "/") return route.path === "/";
  return route.path.startsWith(href);
};
</script>

<template>
  <div
    class="flex h-full flex-col border-r border-default bg-elevated transition-all duration-300"
    :class="collapsed ? 'w-16' : 'w-64'"
  >
    <!-- Header with Logo / Toggle -->
    <div
      class="flex h-16 items-center border-b border-default px-4"
      :class="collapsed ? 'justify-center' : 'justify-between'"
    >
      <template v-if="collapsed">
        <UButton
          icon="i-lucide-panel-left"
          color="neutral"
          variant="ghost"
          size="lg"
          @click="emit('toggle')"
          title="Mở rộng menu"
        />
      </template>
      <template v-else>
        <div class="flex items-center gap-2">
          <div
            class="h-10 w-10 rounded-lg bg-primary flex items-center justify-center"
          >
            <span class="text-white font-bold text-lg">S</span>
          </div>
          <span class="font-semibold">Salon Pro</span>
        </div>
        <UButton
          icon="i-lucide-panel-left-close"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="emit('toggle')"
          title="Thu gọn menu"
        />
      </template>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 p-3 overflow-y-auto">
      <NuxtLink
        v-for="item in sidebarItems"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
        :class="[
          isActive(item.href)
            ? 'bg-primary/10 text-primary'
            : 'text-muted hover:bg-elevated hover:text-default',
          collapsed ? 'justify-center px-2' : '',
        ]"
        :title="collapsed ? item.title : undefined"
      >
        <UIcon :name="item.icon" class="h-5 w-5 shrink-0" />
        <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
      </NuxtLink>
    </nav>

    <!-- User section -->
    <div
      class="border-t border-default p-3"
      :class="collapsed ? 'flex justify-center' : ''"
    >
      <div
        class="flex items-center gap-3"
        :class="collapsed ? 'justify-center' : ''"
      >
        <UAvatar size="sm" alt="User" />
        <div v-if="!collapsed" class="flex flex-col overflow-hidden">
          <span class="text-sm font-medium truncate">Admin User</span>
          <span class="text-xs text-muted truncate">admin@salon.com</span>
        </div>
      </div>
    </div>
  </div>
</template>
