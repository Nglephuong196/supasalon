<script lang="ts">
	import type { HTMLSelectAttributes } from "svelte/elements";
	import { cn } from "$lib/utils";
	import ChevronDown from "lucide-svelte/icons/chevron-down";
	import type { Snippet } from "svelte";

	interface Props extends HTMLSelectAttributes {
		value?: string;
		placeholder?: string;
		children?: Snippet;
	}

	let { class: className, value = $bindable(""), placeholder, children, ...restProps }: Props = $props();
</script>

<div class="relative">
	<select
		class={cn(
			"flex h-10 w-full appearance-none items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
			!value && "text-muted-foreground",
			className
		)}
		bind:value
		{...restProps}
	>
		{#if placeholder}
			<option value="" disabled selected>{placeholder}</option>
		{/if}
		{#if children}
			{@render children()}
		{/if}
	</select>
	<ChevronDown class="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none" />
</div>
