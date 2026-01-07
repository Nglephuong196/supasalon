<script setup lang="ts">
definePageMeta({
  layout: "dashboard",
});
</script>

<template>
  <div class="flex flex-col gap-6">
    <h1 class="text-2xl font-bold tracking-tight">Cài đặt</h1>

    <div class="grid gap-6 md:grid-cols-2">
      <UCard>
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Thông tin salon</h3>
            <p class="text-sm text-muted">
              Cập nhật thông tin cơ bản của salon
            </p>
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Tên salon">
            <UInput value="Salon Pro" />
          </UFormField>
          <UFormField label="Số điện thoại">
            <UInput value="0123 456 789" />
          </UFormField>
          <UFormField label="Địa chỉ">
            <UInput value="123 Đường ABC, Quận XYZ, TP.HCM" />
          </UFormField>
        </div>

        <template #footer>
          <UButton>Lưu thay đổi</UButton>
        </template>
      </UCard>

      <UCard>
        <template #header>
          <div>
            <h3 class="text-lg font-semibold">Giao diện</h3>
            <p class="text-sm text-muted">Tùy chỉnh giao diện ứng dụng</p>
          </div>
        </template>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="font-medium">Chế độ tối</p>
              <p class="text-sm text-muted">Bật/tắt chế độ tối</p>
            </div>
            <UColorModeButton />
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
