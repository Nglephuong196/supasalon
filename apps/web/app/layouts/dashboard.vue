<script setup lang="ts">
const sidebarCollapsed = ref(false);

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value;
};
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- Sidebar -->
    <LayoutSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

    <!-- Main content -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <LayoutHeader />
      <main class="flex-1 overflow-y-auto bg-muted/30 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
