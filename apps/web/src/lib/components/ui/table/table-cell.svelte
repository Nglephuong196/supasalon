<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLTdAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLTdAttributes = $props();
</script>

<td
    class={cn(
        "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
        className,
    )}
    {...restProps}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</td>
