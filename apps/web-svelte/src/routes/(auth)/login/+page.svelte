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
    import LogIn from "lucide-svelte/icons/log-in";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import { signIn } from "$lib/auth-client";
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
        });

        if (result.error) {
            error =
                result.error.message ||
                "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.";
            isLoading = false;
        } else {
            goto("/dashboard");
        }
    }
</script>

<Card class="shadow-2xl border-0">
    <CardHeader class="space-y-1 text-center">
        <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
            <LogIn class="h-7 w-7" />
        </div>
        <CardTitle class="text-2xl font-bold">Đăng nhập</CardTitle>
        <CardDescription>
            Nhập email và mật khẩu để đăng nhập vào hệ thống
        </CardDescription>
    </CardHeader>
    <CardContent>
        {#if error}
            <div
                class="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20"
            >
                {error}
            </div>
        {/if}
        <form onsubmit={handleSubmit} class="space-y-4">
            <div class="space-y-2">
                <Label for="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    autocomplete="email"
                    disabled={isLoading}
                    bind:value={email}
                    onblur={() => validateEmail(email)}
                />
                {#if emailError}
                    <p class="text-sm text-destructive">{emailError}</p>
                {/if}
            </div>
            <div class="space-y-2">
                <Label for="password">Mật khẩu</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    autocomplete="current-password"
                    disabled={isLoading}
                    bind:value={password}
                    onblur={() => validatePassword(password)}
                />
                {#if passwordError}
                    <p class="text-sm text-destructive">{passwordError}</p>
                {/if}
            </div>
            <Button type="submit" class="w-full" size="lg" disabled={isLoading}>
                {#if isLoading}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Đang đăng nhập...
                {:else}
                    Đăng nhập
                {/if}
            </Button>
        </form>
    </CardContent>
    <CardFooter class="flex flex-col space-y-4">
        <div class="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?
            <a href="/signup" class="text-primary font-medium hover:underline">
                Đăng ký ngay
            </a>
        </div>
    </CardFooter>
</Card>
