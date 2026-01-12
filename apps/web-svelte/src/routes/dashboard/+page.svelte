<script lang="ts">
    import {
        Card,
        CardContent,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { useSession, signOut } from "$lib/auth-client";
    import { goto } from "$app/navigation";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import User from "lucide-svelte/icons/user";
    import Store from "lucide-svelte/icons/store";
    import LogOut from "lucide-svelte/icons/log-out";

    const session = useSession();

    async function handleSignOut() {
        await signOut();
        goto("/login");
    }

    // Redirect to login if not authenticated
    $effect(() => {
        if (!$session.isPending && !$session.data) {
            goto("/login");
        }
    });
</script>

<svelte:head>
    <title>Dashboard | Salon Pro</title>
</svelte:head>

<div class="min-h-screen bg-muted/30">
    <header class="bg-background border-b">
        <div
            class="container mx-auto px-4 py-4 flex justify-between items-center"
        >
            <h1 class="text-xl font-bold">Salon Pro</h1>
            {#if $session.data}
                <Button variant="outline" onclick={handleSignOut}>
                    <LogOut class="h-4 w-4 mr-2" />
                    Đăng xuất
                </Button>
            {/if}
        </div>
    </header>

    <main class="container mx-auto px-4 py-8">
        {#if $session.isPending}
            <div class="flex items-center justify-center py-12">
                <Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        {:else if $session.data}
            <div class="space-y-6">
                <h2 class="text-2xl font-bold">
                    Xin chào, {$session.data.user.name}!
                </h2>

                <div class="grid gap-6 md:grid-cols-2">
                    <!-- User Info Card -->
                    <Card>
                        <CardHeader class="flex flex-row items-center gap-4">
                            <div
                                class="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
                            >
                                <User class="h-6 w-6" />
                            </div>
                            <CardTitle>Thông tin tài khoản</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    Họ và tên
                                </p>
                                <p class="font-medium">
                                    {$session.data.user.name}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    Email
                                </p>
                                <p class="font-medium">
                                    {$session.data.user.email}
                                </p>
                            </div>
                            <div>
                                <p class="text-sm text-muted-foreground">
                                    ID người dùng
                                </p>
                                <p
                                    class="font-mono text-sm text-muted-foreground"
                                >
                                    {$session.data.user.id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <!-- Salon Info Card -->
                    <Card>
                        <CardHeader class="flex flex-row items-center gap-4">
                            <div
                                class="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 text-green-600"
                            >
                                <Store class="h-6 w-6" />
                            </div>
                            <CardTitle>Thông tin Salon</CardTitle>
                        </CardHeader>
                        <CardContent class="space-y-3">
                            <p class="text-muted-foreground">
                                Thông tin salon đã được lưu trong cơ sở dữ liệu
                                khi bạn đăng ký.
                            </p>
                            <p class="text-sm text-muted-foreground">
                                Để xem chi tiết, bạn cần tạo API endpoint để lấy
                                thông tin salon theo user ID.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <!-- Debug: Raw Session Data -->
                <Card>
                    <CardHeader>
                        <CardTitle class="text-base"
                            >Debug: Session Data (Raw)</CardTitle
                        >
                    </CardHeader>
                    <CardContent>
                        <pre
                            class="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">{JSON.stringify(
                                $session.data,
                                null,
                                2,
                            )}</pre>
                    </CardContent>
                </Card>
            </div>
        {:else}
            <div class="text-center py-12">
                <p class="text-muted-foreground">Chưa đăng nhập</p>
                <Button class="mt-4" onclick={() => goto("/login")}>
                    Đăng nhập
                </Button>
            </div>
        {/if}
    </main>
</div>
