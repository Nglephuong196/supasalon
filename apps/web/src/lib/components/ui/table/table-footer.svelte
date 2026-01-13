<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLTableSectionElement> = $props();
</script>

<tfoot
    class={cn(
        "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
        className,
    )}
    {...restProps}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</tfoot>
