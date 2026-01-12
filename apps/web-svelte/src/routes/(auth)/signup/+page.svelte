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
    import { Select } from "$lib/components/ui/select";
    import Store from "lucide-svelte/icons/store";
    import Loader2 from "lucide-svelte/icons/loader-2";
    import { VIETNAM_PROVINCES, VIETNAM_PHONE_REGEX } from "@repo/constants";
    import { signUp } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    // Form state
    let ownerName = $state("");
    let email = $state("");
    let password = $state("");
    let confirmPassword = $state("");
    let salonName = $state("");
    let province = $state("");
    let address = $state("");
    let phone = $state("");

    let error = $state<string | null>(null);
    let isLoading = $state(false);

    // Validation errors
    let errors = $state<Record<string, string | null>>({
        ownerName: null,
        email: null,
        password: null,
        confirmPassword: null,
        salonName: null,
        province: null,
        address: null,
        phone: null,
    });

    function validateOwnerName(value: string): boolean {
        if (!value || value.length < 2) {
            errors.ownerName = "Họ tên phải có ít nhất 2 ký tự";
            return false;
        }
        errors.ownerName = null;
        return true;
    }

    function validateEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            errors.email = "Vui lòng nhập email";
            return false;
        }
        if (!emailRegex.test(value)) {
            errors.email = "Email không hợp lệ";
            return false;
        }
        errors.email = null;
        return true;
    }

    function validatePassword(value: string): boolean {
        if (!value || value.length < 6) {
            errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
            return false;
        }
        errors.password = null;
        return true;
    }

    function validateConfirmPassword(value: string): boolean {
        if (value !== password) {
            errors.confirmPassword = "Mật khẩu không khớp";
            return false;
        }
        errors.confirmPassword = null;
        return true;
    }

    function validateSalonName(value: string): boolean {
        if (!value || value.length < 2) {
            errors.salonName = "Tên salon phải có ít nhất 2 ký tự";
            return false;
        }
        errors.salonName = null;
        return true;
    }

    function validateProvince(value: string): boolean {
        if (!value) {
            errors.province = "Vui lòng chọn tỉnh/thành phố";
            return false;
        }
        errors.province = null;
        return true;
    }

    function validateAddress(value: string): boolean {
        if (!value || value.length < 5) {
            errors.address = "Vui lòng nhập địa chỉ đầy đủ";
            return false;
        }
        errors.address = null;
        return true;
    }

    function validatePhone(value: string): boolean {
        if (!value) {
            errors.phone = "Vui lòng nhập số điện thoại";
            return false;
        }
        if (!VIETNAM_PHONE_REGEX.test(value)) {
            errors.phone = "Số điện thoại không hợp lệ (VD: 0901234567)";
            return false;
        }
        errors.phone = null;
        return true;
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        const isValid = [
            validateOwnerName(ownerName),
            validateEmail(email),
            validatePassword(password),
            validateConfirmPassword(confirmPassword),
            validateSalonName(salonName),
            validateProvince(province),
            validateAddress(address),
            validatePhone(phone),
        ].every(Boolean);

        if (!isValid) {
            return;
        }

        isLoading = true;
        error = null;

        const result = await signUp.email({
            email,
            password,
            name: ownerName,
            salonName,
            province,
            address,
            phone,
        });

        if (result.error) {
            error =
                result.error.message || "Đăng ký thất bại. Vui lòng thử lại.";
            isLoading = false;
        } else {
            goto("/dashboard");
        }
    }
</script>

<svelte:head>
    <title>Đăng ký Salon | Salon Pro</title>
</svelte:head>

<Card class="shadow-2xl border-0">
    <CardHeader class="space-y-1 text-center">
        <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground"
        >
            <Store class="h-7 w-7" />
        </div>
        <CardTitle class="text-2xl font-bold">Đăng ký Salon</CardTitle>
        <CardDescription>
            Tạo tài khoản và đăng ký salon của bạn
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
            <!-- Account Section -->
            <div class="space-y-3">
                <div
                    class="text-sm font-medium text-muted-foreground uppercase tracking-wide"
                >
                    Thông tin tài khoản
                </div>
                <div class="space-y-2">
                    <Label for="ownerName">Họ và tên</Label>
                    <Input
                        id="ownerName"
                        placeholder="Nguyễn Văn A"
                        autocomplete="name"
                        disabled={isLoading}
                        bind:value={ownerName}
                        onblur={() => validateOwnerName(ownerName)}
                    />
                    {#if errors.ownerName}
                        <p class="text-sm text-destructive">
                            {errors.ownerName}
                        </p>
                    {/if}
                </div>
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
                    {#if errors.email}
                        <p class="text-sm text-destructive">{errors.email}</p>
                    {/if}
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-2">
                        <Label for="password">Mật khẩu</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            autocomplete="new-password"
                            disabled={isLoading}
                            bind:value={password}
                            onblur={() => validatePassword(password)}
                        />
                        {#if errors.password}
                            <p class="text-sm text-destructive">
                                {errors.password}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="confirmPassword">Xác nhận</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            autocomplete="new-password"
                            disabled={isLoading}
                            bind:value={confirmPassword}
                            onblur={() =>
                                validateConfirmPassword(confirmPassword)}
                        />
                        {#if errors.confirmPassword}
                            <p class="text-sm text-destructive">
                                {errors.confirmPassword}
                            </p>
                        {/if}
                    </div>
                </div>
            </div>

            <!-- Salon Section -->
            <div class="space-y-3 pt-2 border-t">
                <div
                    class="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2"
                >
                    Thông tin Salon
                </div>
                <div class="space-y-2">
                    <Label for="salonName">Tên Salon</Label>
                    <Input
                        id="salonName"
                        placeholder="VD: Beauty Spa & Nail"
                        disabled={isLoading}
                        bind:value={salonName}
                        onblur={() => validateSalonName(salonName)}
                    />
                    {#if errors.salonName}
                        <p class="text-sm text-destructive">
                            {errors.salonName}
                        </p>
                    {/if}
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="space-y-2">
                        <Label for="province">Tỉnh/Thành phố</Label>
                        <Select
                            id="province"
                            disabled={isLoading}
                            bind:value={province}
                            placeholder="Chọn tỉnh/thành"
                            onchange={() => validateProvince(province)}
                        >
                            {#each VIETNAM_PROVINCES as prov}
                                <option value={prov}>{prov}</option>
                            {/each}
                        </Select>
                        {#if errors.province}
                            <p class="text-sm text-destructive">
                                {errors.province}
                            </p>
                        {/if}
                    </div>
                    <div class="space-y-2">
                        <Label for="phone">Số điện thoại</Label>
                        <Input
                            id="phone"
                            type="tel"
                            placeholder="0901234567"
                            disabled={isLoading}
                            bind:value={phone}
                            onblur={() => validatePhone(phone)}
                        />
                        {#if errors.phone}
                            <p class="text-sm text-destructive">
                                {errors.phone}
                            </p>
                        {/if}
                    </div>
                </div>
                <div class="space-y-2">
                    <Label for="address">Địa chỉ</Label>
                    <Input
                        id="address"
                        placeholder="Số nhà, đường, phường/xã, quận/huyện"
                        disabled={isLoading}
                        bind:value={address}
                        onblur={() => validateAddress(address)}
                    />
                    {#if errors.address}
                        <p class="text-sm text-destructive">{errors.address}</p>
                    {/if}
                </div>
            </div>

            <Button type="submit" class="w-full" size="lg" disabled={isLoading}>
                {#if isLoading}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Đang tạo tài khoản...
                {:else}
                    Đăng ký
                {/if}
            </Button>
        </form>
    </CardContent>
    <CardFooter class="flex flex-col space-y-4">
        <div class="text-center text-sm text-muted-foreground">
            Đã có tài khoản?
            <a href="/login" class="text-primary font-medium hover:underline">
                Đăng nhập
            </a>
        </div>
    </CardFooter>
</Card>
