<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabaseClient';
	import type { User } from '@supabase/supabase-js';

	interface Props {
		user?: User | null;
	}

	let { user }: Props = $props();
	let isDropdownOpen = $state(false);

	async function handleLogout() {
		await supabase.auth.signOut();
		goto('/login');
	}
</script>

<header class="flex h-16 items-center justify-between border-b border-border bg-card px-6">
	<!-- Left side - can add breadcrumbs or search here -->
	<div class="flex items-center gap-4">
		<!-- Mobile menu toggle - hidden on desktop -->
	</div>

	<!-- Right side - User menu -->
	<div class="relative">
		<button
			onclick={() => isDropdownOpen = !isDropdownOpen}
			class="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
		>
			<div class="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
				<span class="text-sm font-medium text-primary">
					{user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
				</span>
			</div>
			<div class="hidden sm:flex flex-col items-start">
				<span class="text-sm font-medium">
					{user?.user_metadata?.full_name || 'User'}
				</span>
				<span class="text-xs text-muted-foreground">
					{user?.email || ''}
				</span>
			</div>
			<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="m6 9 6 6 6-6"/>
			</svg>
		</button>

		{#if isDropdownOpen}
			<!-- Backdrop -->
			<button
				class="fixed inset-0 z-40"
				onclick={() => isDropdownOpen = false}
			></button>
			<!-- Dropdown -->
			<div class="absolute right-0 top-full mt-2 w-56 rounded-md border bg-card shadow-lg z-50">
				<div class="p-2">
					<div class="px-3 py-2 text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</div>
					<div class="px-3 pb-2 text-xs text-muted-foreground">{user?.email}</div>
					<hr class="my-2" />
					<button
						onclick={handleLogout}
						class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
					>
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
							<polyline points="16 17 21 12 16 7"/>
							<line x1="21" x2="9" y1="12" y2="12"/>
						</svg>
						Đăng xuất
					</button>
				</div>
			</div>
		{/if}
	</div>
</header>
