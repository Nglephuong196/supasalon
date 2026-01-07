<script lang="ts">
	import type { LucideIcon } from 'lucide-svelte';

	interface Props {
		title: string;
		value: string;
		description?: string;
		icon?: string;
		trend?: 'up' | 'down';
		trendValue?: string;
		iconBgColor?: string;
		iconColor?: string;
	}

	let { 
		title, 
		value, 
		description, 
		icon = 'dollar-sign',
		trend,
		trendValue,
		iconBgColor = 'bg-purple-100',
		iconColor = 'text-purple-600'
	}: Props = $props();
</script>

<div class="card p-6">
	<div class="flex items-center justify-between">
		<div class="space-y-1">
			<p class="text-sm font-medium text-muted-foreground">{title}</p>
			<p class="text-2xl font-bold">{value}</p>
			{#if description && trend && trendValue}
				<div class="flex items-center gap-1 text-xs">
					{#if trend === 'up'}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>
						</svg>
						<span class="text-green-600">{trendValue}</span>
					{:else}
						<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
							<path d="M12 5v14"/><path d="m5 12 7 7 7-7"/>
						</svg>
						<span class="text-red-600">{trendValue}</span>
					{/if}
					<span class="text-muted-foreground">{description}</span>
				</div>
			{/if}
		</div>
		<div class="h-12 w-12 rounded-lg {iconBgColor} flex items-center justify-center">
			{#if icon === 'dollar-sign'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 {iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
				</svg>
			{:else if icon === 'calendar-days'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 {iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
				</svg>
			{:else if icon === 'users'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 {iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
				</svg>
			{:else if icon === 'trending-up'}
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 {iconColor}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
				</svg>
			{/if}
		</div>
	</div>
</div>
