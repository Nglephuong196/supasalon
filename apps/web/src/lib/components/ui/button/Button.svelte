<script lang="ts">
	import { Button as ButtonPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant,
	} from "./button-variants.js";
	import type { WithElementRef } from "bits-ui";
	import type {
		HTMLButtonAttributes,
		HTMLAnchorAttributes,
	} from "svelte/elements";
	import type { Snippet } from "svelte";

	type Props = WithElementRef<HTMLButtonAttributes> &
		Partial<Pick<HTMLAnchorAttributes, "href" | "target" | "rel">> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
			builders?: unknown[];
			children?: Snippet;
		};

	let {
		variant = "default",
		size = "default",
		class: className,
		children,
		ref = $bindable(null),
		href,
		target,
		rel,
		...restProps
	}: Props = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		{href}
		{target}
		{rel}
		class={cn(buttonVariants({ variant, size }), className)}
		{...restProps as Record<string, unknown>}
	>
		{#if children}
			{@render children()}
		{/if}
	</a>
{:else}
	<ButtonPrimitive.Root
		bind:ref
		class={cn(buttonVariants({ variant, size }), className)}
		{...restProps}
	>
		{#if children}
			{@render children()}
		{/if}
	</ButtonPrimitive.Root>
{/if}
