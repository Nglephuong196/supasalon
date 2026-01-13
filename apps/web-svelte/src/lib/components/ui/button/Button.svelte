<script lang="ts">
	import { Button as ButtonPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant,
	} from "./button-variants.js";
	import type { WithElementRef } from "bits-ui";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import type { Snippet } from "svelte";

	type Props = WithElementRef<HTMLButtonAttributes> & {
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
		...restProps
	}: Props = $props();
</script>

<ButtonPrimitive.Root
	bind:ref
	class={cn(buttonVariants({ variant, size }), className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{/if}
</ButtonPrimitive.Root>
