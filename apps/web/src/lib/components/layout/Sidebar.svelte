<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		collapsed?: boolean;
		onToggle?: () => void;
	}

	let { collapsed = false, onToggle }: Props = $props();

	const sidebarItems = [
		{ title: 'Tổng quan', href: '/', icon: 'layout-dashboard' },
		{ title: 'Lịch hẹn', href: '/bookings', icon: 'calendar-days' },
		{ title: 'Dịch vụ', href: '/services', icon: 'scissors' },
		{ title: 'Sản phẩm', href: '/products', icon: 'package' },
		{ title: 'Khách hàng', href: '/customers', icon: 'users' },
		{ title: 'Hóa đơn', href: '/invoices', icon: 'receipt' },
		{ title: 'Nhân viên', href: '/employees', icon: 'user-cog' },
		{ title: 'Cài đặt', href: '/settings', icon: 'settings' }
	];

	const pathname = $derived($page.url.pathname);
</script>

<div
	class="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300 {collapsed ? 'w-16' : 'w-64'}"
>
	<!-- Header with Logo / Toggle -->
	<div class="flex h-16 items-center border-b border-sidebar-border px-6 {collapsed ? 'justify-center' : 'justify-between'}">
		{#if collapsed}
			<button
				onclick={onToggle}
				class="h-10 w-10 p-0 flex items-center justify-center rounded-md hover:bg-sidebar-accent"
				title="Mở rộng menu"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<rect width="18" height="18" x="3" y="3" rx="2"/>
					<path d="M9 3v18"/>
				</svg>
			</button>
		{:else}
			<div class="flex items-center gap-2">
				<div class="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
					<span class="text-white font-bold text-lg">S</span>
				</div>
				<span class="font-semibold text-foreground">Salon Pro</span>
			</div>
			{#if onToggle}
				<button
					onclick={onToggle}
					class="h-8 w-8 flex items-center justify-center rounded-md hover:bg-sidebar-accent"
					title="Thu gọn menu"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect width="18" height="18" x="3" y="3" rx="2"/>
						<path d="M9 3v18"/>
						<path d="m16 15-3-3 3-3"/>
					</svg>
				</button>
			{/if}
		{/if}
	</div>

	<!-- Navigation -->
	<nav class="flex-1 space-y-2 p-4">
		{#each sidebarItems as item}
			{@const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))}
			<a
				href={item.href}
				class="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors {isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'} {collapsed ? 'justify-center px-2 py-2' : ''}"
				title={collapsed ? item.title : undefined}
			>
				{#if item.icon === 'layout-dashboard'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
				{:else if item.icon === 'calendar-days'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
				{:else if item.icon === 'scissors'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>
				{:else if item.icon === 'package'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
				{:else if item.icon === 'users'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
				{:else if item.icon === 'receipt'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/></svg>
				{:else if item.icon === 'user-cog'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="m21.7 16.4-.9-.3"/><path d="m15.2 13.9-.9-.3"/><path d="m16.6 18.7.3-.9"/><path d="m19.1 12.2.3-.9"/><path d="m19.6 18.7-.4-1"/><path d="m16.8 12.3-.4-1"/><path d="m14.3 16.6 1-.4"/><path d="m20.7 13.8 1-.4"/></svg>
				{:else if item.icon === 'settings'}
					<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
				{/if}
				{#if !collapsed}
					<span class="truncate text-base">{item.title}</span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- User section -->
	<div class="border-t border-sidebar-border p-4 {collapsed ? 'flex justify-center p-2' : ''}">
		<div class="flex items-center gap-3 {collapsed ? 'justify-center' : ''}">
			<div class="h-8 w-8 rounded-full bg-sidebar-accent/50 shrink-0"></div>
			{#if !collapsed}
				<div class="flex flex-col overflow-hidden">
					<span class="text-sm font-medium text-foreground truncate">Admin User</span>
					<span class="text-xs text-muted-foreground truncate">admin@salon.com</span>
				</div>
			{/if}
		</div>
	</div>
</div>
