<script setup lang="ts">
useHead({
  meta: [{ name: "viewport", content: "width=device-width, initial-scale=1" }],
  link: [{ rel: "icon", href: "/favicon.ico" }],
  htmlAttrs: { lang: "vi" },
});

useSeoMeta({
  title: "Salon Pro - Quản lý salon chuyên nghiệp",
  description:
    "Phần mềm quản lý salon tóc, spa chuyên nghiệp. Quản lý lịch hẹn, khách hàng, dịch vụ, nhân viên và doanh thu.",
  ogTitle: "Salon Pro - Quản lý salon chuyên nghiệp",
  ogDescription: "Phần mềm quản lý salon tóc, spa chuyên nghiệp.",
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
