<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';

	let email = $state('');
	let password = $state('');
	let error = $state<string | null>(null);
	let isLoading = $state(false);

	// Get message from URL params
	const message = $derived($page.url.searchParams.get('message'));

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		error = null;

		const { error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		console.log(error);

		if (authError) {
			error = authError.message === 'Invalid login credentials' 
				? 'Email hoặc mật khẩu không đúng' 
				: authError.message;
			isLoading = false;
			return;
		}

		goto('/');
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-muted p-4">
	<div class="w-full max-w-md">
		<div class="card shadow-2xl">
			<div class="card-header text-center">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
						<polyline points="10 17 15 12 10 7"/>
						<line x1="15" y1="12" x2="3" y2="12"/>
					</svg>
				</div>
				<h1 class="card-title">Đăng nhập</h1>
				<p class="card-description">
					Nhập email và mật khẩu để đăng nhập vào hệ thống
				</p>
			</div>
			<div class="card-content">
				{#if message}
					<div class="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
						{message}
					</div>
				{/if}
				{#if error}
					<div class="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
						{error}
					</div>
				{/if}
				<form onsubmit={handleSubmit} class="space-y-4">
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
					<div class="space-y-2">
						<label for="password" class="label">Mật khẩu</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							placeholder="••••••••"
							autocomplete="current-password"
							disabled={isLoading}
							required
							class="input"
						/>
					</div>
					<button type="submit" class="btn btn-primary btn-lg w-full" disabled={isLoading}>
						{#if isLoading}
							<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none">
								<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
								<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
							</svg>
							Đang đăng nhập...
						{:else}
							Đăng nhập
						{/if}
					</button>
				</form>
			</div>
			<div class="card-footer flex-col space-y-4">
				<div class="text-center text-sm text-muted-foreground">
					Chưa có tài khoản?
					<a href="/signup" class="text-primary font-medium hover:underline">
						Đăng ký ngay
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
