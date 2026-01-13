<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<tbody class={cn("[&_tr:last-child]:border-0", className)} {...restProps}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</tbody>
