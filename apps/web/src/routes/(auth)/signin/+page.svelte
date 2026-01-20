<script lang="ts">
    import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
    } from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { LogIn, Loader, Sparkles } from "@lucide/svelte";
    import { signIn, authClient } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    let email = $state("");
    let password = $state("");
    let error = $state<string | null>(null);
    let isLoading = $state(false);

    // Form validation errors
    let emailError = $state<string | null>(null);
    let passwordError = $state<string | null>(null);

    function validateEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            emailError = "Vui lòng nhập email";
            return false;
        }
        if (!emailRegex.test(value)) {
            emailError = "Email không hợp lệ";
            return false;
        }
        emailError = null;
        return true;
    }

    function validatePassword(value: string): boolean {
        if (!value) {
            passwordError = "Vui lòng nhập mật khẩu";
            return false;
        }
        if (value.length < 6) {
            passwordError = "Mật khẩu phải có ít nhất 6 ký tự";
            return false;
        }
        passwordError = null;
        return true;
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();
        console.log("submit");

        const isEmailValid = validateEmail(email);
        const isPasswordValid = validatePassword(password);

        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        isLoading = true;
        error = null;

        const result = await signIn.email({
            email,
            password,
            fetchOptions: {
                onSuccess: async () => {
                    goto("/");
                },
            },
        });

        if (result.error) {
            error =
                result.error.message ||
                "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.";
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Đăng nhập | SupaSalon</title>
</svelte:head>

<div
    class="flex items-center justify-center min-h-screen bg-[#FAFAFA] relative overflow-hidden"
>
    <!-- Subtle Background Blob - Very Soft Lavender -->
    <div
        class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
        class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none"
    ></div>

    <Card
        class="w-full max-w-md border-0 shadow-xl shadow-purple-900/5 bg-white rounded-2xl relative z-10 backdrop-blur-sm"
    >
        <CardHeader class="space-y-2 text-center pb-8 pt-8">
            <div class="flex justify-center mb-2">
                <div
                    class="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-200"
                >
                    <Sparkles class="h-6 w-6" />
                </div>
            </div>
            <CardTitle class="text-2xl font-bold text-gray-900 tracking-tight"
                >Chào mừng trở lại</CardTitle
            >
            <CardDescription class="text-base text-gray-500">
                Đăng nhập để quản lý salon của bạn
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-6 px-8">
            {#if error}
                <div
                    class="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600 border border-red-100 flex items-center gap-2"
                >
                    ⚠️ {error}
                </div>
            {/if}
            <form onsubmit={handleSubmit} class="space-y-5">
                <div class="space-y-2">
                    <Label
                        for="email"
                        class="text-sm font-semibold text-gray-700">Email</Label
                    >
                    <Input
                        id="email"
                        type="email"
                        placeholder="email@salon.com"
                        autocomplete="email"
                        disabled={isLoading}
                        bind:value={email}
                        onblur={() => validateEmail(email)}
                        class="h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-purple-500 transition-all rounded-lg"
                    />
                    {#if emailError}
                        <p class="text-xs text-red-500 font-medium">
                            {emailError}
                        </p>
                    {/if}
                </div>
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <Label
                            for="password"
                            class="text-sm font-semibold text-gray-700"
                            >Mật khẩu</Label
                        >
                        <a
                            href="#"
                            class="text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
                            >Quên mật khẩu?</a
                        >
                    </div>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        autocomplete="current-password"
                        disabled={isLoading}
                        bind:value={password}
                        onblur={() => validatePassword(password)}
                        class="h-11 bg-gray-50/50 border-gray-200 focus:bg-white focus:border-purple-500 transition-all rounded-lg"
                    />
                    {#if passwordError}
                        <p class="text-xs text-red-500 font-medium">
                            {passwordError}
                        </p>
                    {/if}
                </div>
                <!-- Primary Action Button with Gradient -->
                <Button
                    type="submit"
                    class="w-full btn-primary h-11 rounded-xl text-base mt-2"
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <Loader class="mr-2 h-5 w-5 animate-spin" />
                        Đang đăng nhập...
                    {:else}
                        Đăng nhập
                    {/if}
                </Button>
            </form>
        </CardContent>
        <CardFooter class="flex flex-col space-y-4 pb-8">
            <div class="text-center text-sm text-gray-500">
                Chưa có tài khoản?
                <a
                    href="/signup"
                    class="text-purple-600 font-semibold hover:text-purple-700 ml-1"
                >
                    Đăng ký ngay
                </a>
            </div>
        </CardFooter>
    </Card>
</div>
