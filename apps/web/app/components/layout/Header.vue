<script setup lang="ts">
const user = useSupabaseUser();
const client = useSupabaseClient();

const handleLogout = async () => {
  await client.auth.signOut();
  navigateTo("/login");
};
</script>

<template>
  <header
    class="flex h-16 items-center justify-between border-b border-default bg-default px-6"
  >
    <div class="flex items-center gap-4">
      <h2 class="text-lg font-semibold">Dashboard</h2>
    </div>

    <div class="flex items-center gap-3">
      <UColorModeButton />

      <UDropdownMenu
        :items="[
          [
            { label: 'Hồ sơ', icon: 'i-lucide-user' },
            { label: 'Cài đặt', icon: 'i-lucide-settings', to: '/settings' },
          ],
          [
            {
              label: 'Đăng xuất',
              icon: 'i-lucide-log-out',
              click: handleLogout,
            },
          ],
        ]"
      >
        <UButton color="neutral" variant="ghost" class="gap-2">
          <UAvatar size="xs" :alt="user?.email || 'User'" />
          <span class="hidden sm:inline text-sm">{{
            user?.email || "Admin"
          }}</span>
          <UIcon name="i-lucide-chevron-down" class="h-4 w-4" />
        </UButton>
      </UDropdownMenu>
    </div>
  </header>
</template>
