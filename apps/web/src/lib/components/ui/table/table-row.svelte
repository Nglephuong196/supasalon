<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLTableRowElement> = $props();
</script>

<tr
    class={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
    )}
    {...restProps}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</tr>
