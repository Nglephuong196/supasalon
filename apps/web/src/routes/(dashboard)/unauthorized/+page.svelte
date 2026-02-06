<script lang="ts">
  import { ShieldAlert, Home } from "@lucide/svelte";
  import { Button } from "$lib/components/ui/button";
</script>

<svelte:head>
  <title>Không có quyền truy cập | SupaSalon</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
  <div class="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
    <ShieldAlert class="h-10 w-10 text-red-500" />
  </div>

  <h1 class="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h1>

  <p class="text-gray-500 max-w-md mb-8">
    Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là
    lỗi.
  </p>

  <Button href="/" class="btn-gradient">
    <Home class="h-4 w-4 mr-2" />
    Về trang chủ
  </Button>
</div>
