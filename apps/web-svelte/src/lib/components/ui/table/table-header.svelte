<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<thead class={cn("[&_tr]:border-b", className)} {...restProps}>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</thead>
