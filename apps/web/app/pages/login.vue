<script setup lang="ts">
definePageMeta({
  layout: false,
});

const client = useSupabaseClient();
const loading = ref(false);
const errorMessage = ref("");

const form = reactive({
  email: "",
  password: "",
});

const handleLogin = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { error } = await client.auth.signInWithPassword({
    email: form.email,
    password: form.password,
  });

  if (error) {
    errorMessage.value = error.message;
    loading.value = false;
    return;
  }

  navigateTo("/");
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <UCard class="w-full max-w-md">
      <div class="text-center mb-6">
        <div
          class="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-white font-bold text-2xl">S</span>
        </div>
        <h1 class="text-2xl font-bold">Đăng nhập</h1>
        <p class="text-muted mt-1">Chào mừng trở lại Salon Pro</p>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
        class="mb-4"
      />

      <form @submit.prevent="handleLogin" class="space-y-4">
        <UFormField label="Email">
          <UInput
            v-model="form.email"
            type="email"
            placeholder="email@example.com"
            icon="i-lucide-mail"
            required
          />
        </UFormField>

        <UFormField label="Mật khẩu">
          <UInput
            v-model="form.password"
            type="password"
            placeholder="••••••••"
            icon="i-lucide-lock"
            required
          />
        </UFormField>

        <div class="flex items-center justify-between">
          <UCheckbox label="Ghi nhớ đăng nhập" />
          <NuxtLink
            to="/forgot-password"
            class="text-sm text-primary hover:underline"
          >
            Quên mật khẩu?
          </NuxtLink>
        </div>

        <UButton type="submit" block :loading="loading"> Đăng nhập </UButton>
      </form>

      <div class="mt-6 text-center text-sm text-muted">
        Chưa có tài khoản?
        <NuxtLink to="/signup" class="text-primary hover:underline font-medium">
          Đăng ký ngay
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
