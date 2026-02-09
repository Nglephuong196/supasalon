<script lang="ts">
import CommissionSettingsPanel from "$lib/components/settings/CommissionSettingsPanel.svelte";

let { data } = $props();
</script>

<svelte:head>
  <title>Cài đặt hoa hồng | SupaSalon</title>
</svelte:head>

<div class="flex flex-col gap-6">
  <div class="page-hero p-5 sm:p-6">
    <h1 class="section-title text-2xl font-bold tracking-tight text-foreground">
      Cài đặt hoa hồng
    </h1>
    <p class="text-muted-foreground">
      Cấu hình hoa hồng theo từng nhân viên và từng dịch vụ/sản phẩm.
    </p>
  </div>

  <CommissionSettingsPanel {data} />
</div>
