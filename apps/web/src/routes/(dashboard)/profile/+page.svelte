<script lang="ts">
  import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";
  import { Button } from "$lib/components/ui/button";
  import { Input } from "$lib/components/ui/input";
  import { Label } from "$lib/components/ui/label";
  import { enhance } from "$app/forms";
  import { toast } from "svelte-sonner";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();

  let name = $state(data.user?.name || "");
  let image = $state(data.user?.image || "");

  $effect(() => {
    name = data.user?.name || "";
    image = data.user?.image || "";
  });
</script>

<svelte:head>
  <title>Hồ sơ | SupaSalon</title>
</svelte:head>

<div class="max-w-3xl mx-auto w-full">
  <div class="flex items-center justify-between mb-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight display-title">Hồ sơ cá nhân</h1>
      <p class="text-muted-foreground">Cập nhật thông tin hiển thị và ảnh đại diện.</p>
    </div>
  </div>

  <Card class="card-hover">
    <CardHeader>
      <CardTitle>Thông tin tài khoản</CardTitle>
    </CardHeader>
    <CardContent>
      <form
        method="POST"
        action="?/updateProfile"
        use:enhance={async ({ result }) => {
          if (result.type === "success") {
            toast.success("Đã cập nhật hồ sơ");
          } else if (result.type === "failure") {
            toast.error(result.data?.message || "Có lỗi xảy ra");
          }
        }}
        class="space-y-5"
      >
        <div class="grid gap-2">
          <Label for="profile-name">Tên hiển thị</Label>
          <Input id="profile-name" name="name" bind:value={name} placeholder="Tên hiển thị" />
        </div>

        <div class="grid gap-2">
          <Label for="profile-email">Email</Label>
          <Input id="profile-email" name="email" value={data.user?.email || ""} disabled />
        </div>

        <div class="grid gap-2">
          <Label for="profile-image">Ảnh đại diện (URL)</Label>
          <Input id="profile-image" name="image" bind:value={image} placeholder="https://..." />
        </div>

        <div class="flex items-center gap-3">
          <Button type="submit" class="btn-gradient">Lưu thay đổi</Button>
        </div>
      </form>
    </CardContent>
  </Card>
</div>
