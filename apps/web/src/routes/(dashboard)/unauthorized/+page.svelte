<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { Home, ShieldAlert } from "@lucide/svelte";
</script>

<svelte:head>
  <title>Không có quyền truy cập | SupaSalon</title>
</svelte:head>

<div class="flex min-h-[60vh] items-center justify-center px-4">
  <div
    class="page-hero mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-2xl p-8 text-center"
  >
    <div
      class="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-100 to-rose-100"
    >
      <ShieldAlert class="h-10 w-10 text-red-500" />
    </div>

    <h1 class="section-title mb-2 text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>

    <p class="mb-8 max-w-md text-gray-500">
      Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là
      lỗi.
    </p>

    <Button href="/" class="btn-gradient">
      <Home class="mr-2 h-4 w-4" />
      Về trang chủ
    </Button>
  </div>
</div>
