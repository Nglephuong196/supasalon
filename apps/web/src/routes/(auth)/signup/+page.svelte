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
    import Combobox from "$lib/components/ui/combobox/combobox.svelte";
    import { Store, Loader } from "@lucide/svelte";
    import { VIETNAM_PROVINCES, VIETNAM_PHONE_REGEX } from "@repo/constants";
    import { signUp, organization } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    // Initialize state
    let formData = $state({
        ownerName: "",
        email: "",
        password: "",
        confirmPassword: "",
        salonName: "",
        province: "",
        address: "",
        phone: "",
    });

    let error = $state<string | null>(null);
    let isLoading = $state(false);

    // Validation errors
    let errors = $state<Record<string, string | null>>({});

    function validateOwnerName(value: string): boolean {
        if (!value || value.length < 2) {
            errors = { ...errors, ownerName: "Họ tên phải có ít nhất 2 ký tự" };
            return false;
        }
        errors = { ...errors, ownerName: null };
        return true;
    }

    function validateEmail(value: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
            errors = { ...errors, email: "Vui lòng nhập email" };
            return false;
        }
        if (!emailRegex.test(value)) {
            errors = { ...errors, email: "Email không hợp lệ" };
            return false;
        }
        errors = { ...errors, email: null };
        return true;
    }

    function validatePassword(value: string): boolean {
        if (!value || value.length < 8) {
            errors = {
                ...errors,
                password: "Mật khẩu phải có ít nhất 8 ký tự",
            };
            return false;
        }
        errors = { ...errors, password: null };
        return true;
    }

    function validateConfirmPassword(value: string): boolean {
        if (value !== formData.password) {
            errors = { ...errors, confirmPassword: "Mật khẩu không khớp" };
            return false;
        }
        errors = { ...errors, confirmPassword: null };
        return true;
    }

    function validateSalonName(value: string): boolean {
        if (!value || value.length < 2) {
            errors = {
                ...errors,
                salonName: "Tên salon phải có ít nhất 2 ký tự",
            };
            return false;
        }
        errors = { ...errors, salonName: null };
        return true;
    }

    function validateProvince(value: string): boolean {
        if (!value) {
            errors = { ...errors, province: "Vui lòng chọn tỉnh/thành phố" };
            return false;
        }
        errors = { ...errors, province: null };
        return true;
    }

    function validateAddress(value: string): boolean {
        if (!value || value.length < 5) {
            errors = { ...errors, address: "Vui lòng nhập địa chỉ đầy đủ" };
            return false;
        }
        errors = { ...errors, address: null };
        return true;
    }

    function validatePhone(value: string): boolean {
        if (!value) {
            errors = { ...errors, ownerPhone: "Vui lòng nhập số điện thoại" };
            return false;
        }
        if (!VIETNAM_PHONE_REGEX.test(value)) {
            errors = {
                ...errors,
                ownerPhone: "Số điện thoại không hợp lệ (VD: 0901234567)",
            };
            return false;
        }
        errors = { ...errors, ownerPhone: null };
        return true;
    }

    async function handleSubmit(e: SubmitEvent) {
        e.preventDefault();

        // Validate all fields
        const isOwnerNameValid = validateOwnerName(formData.ownerName);
        const isEmailValid = validateEmail(formData.email);
        const isPasswordValid = validatePassword(formData.password);
        const isConfirmPasswordValid = validateConfirmPassword(
            formData.confirmPassword,
        );
        const isSalonNameValid = validateSalonName(formData.salonName);
        const isProvinceValid = validateProvince(formData.province);
        const isAddressValid = validateAddress(formData.address);
        const isPhoneValid = validatePhone(formData.phone);

        if (
            !isOwnerNameValid ||
            !isEmailValid ||
            !isPasswordValid ||
            !isConfirmPasswordValid ||
            !isSalonNameValid ||
            !isProvinceValid ||
            !isAddressValid ||
            !isPhoneValid
        ) {
            return;
        }

        isLoading = true;
        error = null;

        try {
            // 1. Sign Up User
            const signUpRes = await signUp.email({
                email: formData.email,
                password: formData.password,
                name: formData.ownerName,
            });

            if (signUpRes.error) {
                error = signUpRes.error.message || "Đăng ký thất bại";
                isLoading = false;
                return;
            }

            // 2. Create Organization
            const slug = formData.salonName
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            const orgRes = await organization.create({
                name: formData.salonName,
                slug,
            });

            if (orgRes.error) {
                // Note: User is created but org failed.
                // Ideally backend handles transaction or we explicitly handle this state.
                // For now, show error.
                error =
                    orgRes.error.message ||
                    "Không thể tạo Salon. Vui lòng thử lại.";
                isLoading = false;
                return;
            }

            // Success
            goto("/");
        } catch (err: any) {
            console.error(err);
            error = err.message || "Đã có lỗi xảy ra. Vui lòng thử lại sau.";
            isLoading = false;
        }
    }
</script>

<svelte:head>
    <title>Đăng ký Salon | SupaSalon</title>
</svelte:head>

<div
    class="flex items-center justify-center min-h-screen bg-[#FAFAFA] relative overflow-hidden py-8"
>
    <!-- Subtle Background Blob - Very Soft Lavender -->
    <div
        class="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none"
    ></div>
    <div
        class="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl pointer-events-none"
    ></div>

    <Card
        class="w-full max-w-lg shadow-2xl border-0 relative z-10 bg-white rounded-2xl"
    >
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
                            name="ownerName"
                            placeholder="Nguyễn Văn A"
                            autocomplete="name"
                            disabled={isLoading}
                            bind:value={formData.ownerName}
                            onblur={() => validateOwnerName(formData.ownerName)}
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
                            name="email"
                            type="email"
                            placeholder="email@example.com"
                            autocomplete="email"
                            disabled={isLoading}
                            bind:value={formData.email}
                            onblur={() => validateEmail(formData.email)}
                        />
                        {#if errors.email}
                            <p class="text-sm text-destructive">
                                {errors.email}
                            </p>
                        {/if}
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-2">
                            <Label for="password">Mật khẩu</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                placeholder="••••••••"
                                autocomplete="new-password"
                                disabled={isLoading}
                                bind:value={formData.password}
                                onblur={() =>
                                    validatePassword(formData.password)}
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
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                autocomplete="new-password"
                                disabled={isLoading}
                                bind:value={formData.confirmPassword}
                                onblur={() =>
                                    validateConfirmPassword(
                                        formData.confirmPassword,
                                    )}
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
                            name="salonName"
                            placeholder="VD: Beauty Spa & Nail"
                            disabled={isLoading}
                            bind:value={formData.salonName}
                            onblur={() => validateSalonName(formData.salonName)}
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
                            <Combobox
                                placeholder="Chọn tỉnh/thành"
                                searchPlaceholder="Tìm tỉnh/thành phố..."
                                items={VIETNAM_PROVINCES.map((prov) => ({
                                    value: prov,
                                    label: prov,
                                }))}
                                bind:value={formData.province}
                            />
                            {#if errors.province}
                                <p class="text-sm text-destructive">
                                    {errors.province}
                                </p>
                            {/if}
                        </div>
                        <div class="space-y-2">
                            <Label for="ownerPhone">Số điện thoại</Label>
                            <Input
                                id="ownerPhone"
                                name="ownerPhone"
                                type="tel"
                                placeholder="0901234567"
                                disabled={isLoading}
                                bind:value={formData.phone}
                                onblur={() => validatePhone(formData.phone)}
                            />
                            {#if errors.ownerPhone}
                                <p class="text-sm text-destructive">
                                    {errors.ownerPhone}
                                </p>
                            {/if}
                        </div>
                    </div>
                    <div class="space-y-2">
                        <Label for="address">Địa chỉ</Label>
                        <Input
                            id="address"
                            name="address"
                            placeholder="Số nhà, đường, phường/xã, quận/huyện"
                            disabled={isLoading}
                            bind:value={formData.address}
                            onblur={() => validateAddress(formData.address)}
                        />
                        {#if errors.address}
                            <p class="text-sm text-destructive">
                                {errors.address}
                            </p>
                        {/if}
                    </div>
                </div>

                <Button
                    type="submit"
                    class="w-full"
                    size="lg"
                    disabled={isLoading}
                >
                    {#if isLoading}
                        <Loader class="mr-2 h-4 w-4 animate-spin" />
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
                <a
                    href="/signin"
                    class="text-primary font-medium hover:underline"
                >
                    Đăng nhập
                </a>
            </div>
        </CardFooter>
    </Card>
</div>
