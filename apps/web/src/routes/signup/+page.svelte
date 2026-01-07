<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import { VIETNAM_PROVINCES, VIETNAM_PHONE_REGEX } from '@repo/constants';

	let ownerName = $state('');
	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let salonName = $state('');
	let province = $state('');
	let address = $state('');
	let phone = $state('');

	let error = $state<string | null>(null);
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		
		// Validation
		if (password !== confirmPassword) {
			error = 'Mật khẩu không khớp';
			return;
		}

		if (password.length < 6) {
			error = 'Mật khẩu phải có ít nhất 6 ký tự';
			return;
		}

		if (!VIETNAM_PHONE_REGEX.test(phone)) {
			error = 'Số điện thoại không hợp lệ (VD: 0901234567)';
			return;
		}

		isLoading = true;
		error = null;

		const { error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: {
					full_name: ownerName,
					salon_name: salonName,
					salon_province: province,
					salon_address: address,
					salon_phone: phone
				}
			}
		});

		if (authError) {
			error = authError.message === 'User already registered' 
				? 'Email này đã được đăng ký' 
				: authError.message;
			isLoading = false;
			return;
		}

		goto('/login?message=Đăng ký thành công! Vui lòng đăng nhập.');
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-muted p-4">
	<div class="w-full max-w-md">
		<div class="card shadow-2xl">
			<div class="card-header text-center">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
						<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
						<path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
						<path d="M2 7h20"/>
						<path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/>
					</svg>
				</div>
				<h1 class="card-title">Đăng ký Salon</h1>
				<p class="card-description">
					Tạo tài khoản và đăng ký salon của bạn
				</p>
			</div>
			<div class="card-content">
				{#if error}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
						{error}
					</div>
				{/if}
				<form onsubmit={handleSubmit} class="space-y-4">
					<!-- Account Section -->
					<div class="space-y-3">
						<div class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
							Thông tin tài khoản
						</div>
						<div class="space-y-2">
							<label for="ownerName" class="label">Họ và tên</label>
							<input
								type="text"
								id="ownerName"
								bind:value={ownerName}
								placeholder="Nguyễn Văn A"
								autocomplete="name"
								disabled={isLoading}
								required
								class="input"
							/>
						</div>
						<div class="space-y-2">
							<label for="email" class="label">Email</label>
							<input
								type="email"
								id="email"
								bind:value={email}
								placeholder="email@example.com"
								autocomplete="email"
								disabled={isLoading}
								required
								class="input"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-2">
								<label for="password" class="label">Mật khẩu</label>
								<input
									type="password"
									id="password"
									bind:value={password}
									placeholder="••••••••"
									autocomplete="new-password"
									disabled={isLoading}
									required
									class="input"
								/>
							</div>
							<div class="space-y-2">
								<label for="confirmPassword" class="label">Xác nhận</label>
								<input
									type="password"
									id="confirmPassword"
									bind:value={confirmPassword}
									placeholder="••••••••"
									autocomplete="new-password"
									disabled={isLoading}
									required
									class="input"
								/>
							</div>
						</div>
					</div>

					<!-- Salon Section -->
					<div class="space-y-3 pt-2 border-t">
						<div class="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
							Thông tin Salon
						</div>
						<div class="space-y-2">
							<label for="salonName" class="label">Tên Salon</label>
							<input
								type="text"
								id="salonName"
								bind:value={salonName}
								placeholder="VD: Beauty Spa & Nail"
								disabled={isLoading}
								required
								class="input"
							/>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div class="space-y-2">
								<label for="province" class="label">Tỉnh/Thành phố</label>
								<select
									id="province"
									bind:value={province}
									disabled={isLoading}
									required
									class="input"
								>
									<option value="">Chọn tỉnh/thành</option>
									{#each VIETNAM_PROVINCES as prov}
										<option value={prov}>{prov}</option>
									{/each}
								</select>
							</div>
							<div class="space-y-2">
								<label for="phone" class="label">Số điện thoại</label>
								<input
									type="tel"
									id="phone"
									bind:value={phone}
									placeholder="0901234567"
									disabled={isLoading}
									required
									class="input"
								/>
							</div>
						</div>
						<div class="space-y-2">
							<label for="address" class="label">Địa chỉ</label>
							<input
								type="text"
								id="address"
								bind:value={address}
								placeholder="Số nhà, đường, phường/xã, quận/huyện"
								disabled={isLoading}
								required
								class="input"
							/>
						</div>
					</div>

					<button type="submit" class="btn btn-primary btn-lg w-full" disabled={isLoading}>
						{#if isLoading}
							<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Đang tạo tài khoản...
						{:else}
							Đăng ký
						{/if}
					</button>
				</form>
			</div>
			<div class="card-footer flex-col space-y-4">
				<div class="text-center text-sm text-muted-foreground">
					Đã có tài khoản?
					<a href="/login" class="text-primary font-medium hover:underline">
						Đăng nhập
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
