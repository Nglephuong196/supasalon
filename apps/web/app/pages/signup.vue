<script setup lang="ts">
definePageMeta({
  layout: false,
});

const client = useSupabaseClient();
const loading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const form = reactive({
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  salonName: "",
  salonProvince: "",
  salonAddress: "",
  salonPhone: "",
});

const handleSignup = async () => {
  if (form.password !== form.confirmPassword) {
    errorMessage.value = "Mật khẩu không khớp";
    return;
  }

  if (!form.fullName) {
    errorMessage.value = "Vui lòng nhập họ và tên";
    return;
  }

  if (!form.salonName) {
    errorMessage.value = "Vui lòng nhập tên salon";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  const { error } = await client.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.fullName,
        salon_name: form.salonName,
        salon_province: form.salonProvince || "",
        salon_address: form.salonAddress || "",
        salon_phone: form.salonPhone || "",
      },
    },
  });

  if (error) {
    console.log(error);
    errorMessage.value = error.message;
    loading.value = false;
    return;
  }

  successMessage.value =
    "Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.";
  loading.value = false;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-muted/30 p-4">
    <UCard class="w-full max-w-lg">
      <div class="text-center mb-6">
        <div
          class="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4"
        >
          <span class="text-white font-bold text-2xl">S</span>
        </div>
        <h1 class="text-2xl font-bold">Đăng ký</h1>
        <p class="text-muted mt-1">Tạo tài khoản và salon của bạn</p>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        icon="i-lucide-alert-circle"
        :title="errorMessage"
        class="mb-4"
      />

      <UAlert
        v-if="successMessage"
        color="success"
        icon="i-lucide-check-circle"
        :title="successMessage"
        class="mb-4"
      />

      <form
        v-if="!successMessage"
        @submit.prevent="handleSignup"
        class="space-y-4"
      >
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Email" required class="sm:col-span-2">
            <UInput
              v-model="form.email"
              type="email"
              placeholder="email@example.com"
              icon="i-lucide-mail"
              required
            />
          </UFormField>

          <UFormField label="Họ và tên" required class="sm:col-span-2">
            <UInput
              v-model="form.fullName"
              placeholder="Nguyễn Văn A"
              icon="i-lucide-user"
              required
            />
          </UFormField>

          <UFormField label="Mật khẩu" required>
            <UInput
              v-model="form.password"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              required
            />
          </UFormField>

          <UFormField label="Xác nhận mật khẩu" required>
            <UInput
              v-model="form.confirmPassword"
              type="password"
              placeholder="••••••••"
              icon="i-lucide-lock"
              required
            />
          </UFormField>
        </div>

        <USeparator label="Thông tin Salon" />

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Tên Salon" required class="sm:col-span-2">
            <UInput
              v-model="form.salonName"
              placeholder="Beauty Salon ABC"
              icon="i-lucide-scissors"
              required
            />
          </UFormField>

          <UFormField label="Tỉnh/Thành phố">
            <UInput
              v-model="form.salonProvince"
              placeholder="TP. Hồ Chí Minh"
              icon="i-lucide-map-pin"
            />
          </UFormField>

          <UFormField label="Số điện thoại">
            <UInput
              v-model="form.salonPhone"
              placeholder="0901234567"
              icon="i-lucide-phone"
            />
          </UFormField>

          <UFormField label="Địa chỉ" class="sm:col-span-2">
            <UInput
              v-model="form.salonAddress"
              placeholder="123 Đường ABC, Quận 1"
              icon="i-lucide-home"
            />
          </UFormField>
        </div>

        <UButton type="submit" block :loading="loading" class="mt-6">
          Đăng ký
        </UButton>
      </form>

      <div class="mt-6 text-center text-sm text-muted">
        Đã có tài khoản?
        <NuxtLink to="/login" class="text-primary hover:underline font-medium">
          Đăng nhập
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
