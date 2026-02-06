<script lang="ts">
  import { page } from "$app/stores";
  import { Button } from "$lib/components/ui/button";
  import { FileQuestion, ServerCrash, Home, ArrowLeft, ShieldAlert, LogIn } from "@lucide/svelte";

  let status = $derived($page.status);
  let error = $derived($page.error);

  let title = $derived.by(() => {
    if (status === 404) return "Không tìm thấy trang";
    if (status === 401) return "Yêu cầu đăng nhập";
    return "Đã xảy ra lỗi";
  });

  let description = $derived.by(() => {
    if (status === 404) return "Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.";
    if (status === 401)
      return "Phiên đăng nhập của bạn đã hết hạn hoặc bạn cần đăng nhập để truy cập trang này.";
    return error?.message || "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.";
  });

  let iconColorClass = $derived.by(() => {
    if (status === 404) return "bg-blue-50 text-blue-500";
    if (status === 401) return "bg-amber-50 text-amber-500";
    return "bg-red-50 text-red-500";
  });
</script>

<svelte:head>
  <title>{title} | SupaSalon</title>
</svelte:head>

<div class="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
  <div class="h-24 w-24 rounded-full flex items-center justify-center mb-8 {iconColorClass}">
    {#if status === 404}
      <FileQuestion class="h-12 w-12" />
    {:else if status === 401}
      <ShieldAlert class="h-12 w-12" />
    {:else}
      <ServerCrash class="h-12 w-12" />
    {/if}
  </div>

  <h1 class="text-4xl font-bold tracking-tight text-gray-900 mb-4">
    {status}
  </h1>

  <h2 class="text-xl font-semibold text-gray-700 mb-4">
    {title}
  </h2>

  <p class="text-muted-foreground max-w-md mb-8 text-lg">
    {description}
  </p>

  <div class="flex items-center gap-4">
    <Button variant="outline" onclick={() => history.back()}>
      <ArrowLeft class="h-4 w-4 mr-2" />
      Quay lại
    </Button>
    {#if status === 401}
      <Button href="/login">
        <LogIn class="h-4 w-4 mr-2" />
        Đăng nhập
      </Button>
    {:else}
      <Button href="/">
        <Home class="h-4 w-4 mr-2" />
        Trang chủ
      </Button>
    {/if}
  </div>
</div>
