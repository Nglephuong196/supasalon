<script lang="ts">
import { enhance } from "$app/forms";
import { Button } from "$lib/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
import { Input } from "$lib/components/ui/input";
import { Label } from "$lib/components/ui/label";
import { toast } from "svelte-sonner";
import type { PageData } from "./$types";
let { data }: { data: PageData } = $props();

let name = $state("");
let image = $state("");
let organizationName = $state("");
let organizationSlug = $state("");

$effect(() => {
  name = data.user?.name || "";
  image = data.user?.image || "";
  organizationName = data.organization?.name || "";
  organizationSlug = data.organization?.slug || "";
});
</script>

<svelte:head>
  <title>Hồ sơ | SupaSalon</title>
</svelte:head>

<div class="max-w-3xl mx-auto w-full">
  <div class="page-hero mb-6 p-5 sm:p-6">
    <div>
      <h1 class="section-title text-2xl font-bold tracking-tight display-title">Hồ sơ cá nhân</h1>
      <p class="text-muted-foreground">Cập nhật thông tin cá nhân và salon của bạn.</p>
    </div>
  </div>

  <Card class="premium-card card-hover">
    <CardHeader>
      <CardTitle>Thông tin tài khoản</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/updateProfile"
        use:enhance={() => {
          return async ({ result }) => {
            if (result.type === "success") {
              toast.success("Đã cập nhật hồ sơ");
            } else if (result.type === "failure") {
              const message =
                typeof result.data?.message === "string" ? result.data.message : "Có lỗi xảy ra";
              toast.error(message);
            }
          };
        }}
        class="space-y-5"
      >
        <div class="grid gap-2">
          <Label for="profile-name">Tên hiển thị</Label>
          <Input
            id="profile-name"
            name="name"
            bind:value={name}
            placeholder="Tên hiển thị"
            class="soft-input"
          />
        </div>

        <div class="grid gap-2">
          <Label for="profile-email">Email</Label>
          <Input
            id="profile-email"
            name="email"
            value={data.user?.email || ""}
            disabled
            class="soft-input"
          />
        </div>

        <div class="grid gap-2">
          <Label for="profile-image">Ảnh đại diện (URL)</Label>
          <Input
            id="profile-image"
            name="image"
            bind:value={image}
            placeholder="https://..."
            class="soft-input"
          />
        </div>

        <div class="pt-2 border-t">
          <p class="text-sm font-medium text-muted-foreground mb-3">Thông tin salon</p>
          <div class="grid gap-2 mb-4">
            <Label for="organization-name">Tên salon</Label>
            <Input
              id="organization-name"
              name="organizationName"
              bind:value={organizationName}
              placeholder="Tên salon"
              class="soft-input"
            />
          </div>
          <div class="grid gap-2">
            <Label for="organization-slug">Slug salon</Label>
            <Input
              id="organization-slug"
              name="organizationSlug"
              bind:value={organizationSlug}
              placeholder="vd: beauty-spa-nail"
              class="soft-input"
            />
            <p class="text-xs text-muted-foreground">
              URL đặt lịch dự kiến: `/book/{organizationSlug || "slug-cua-ban"}`
            </p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Button type="submit" class="btn-gradient">Lưu thay đổi</Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
