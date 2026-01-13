<script lang="ts">
    import { cn } from "$lib/utils";
    import type { HTMLAttributes } from "svelte/elements";

    let {
        class: className,
        children,
        ...restProps
    }: HTMLAttributes<HTMLElement> = $props();
</script>

<caption
    class={cn("mt-4 text-sm text-muted-foreground", className)}
    {...restProps}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@render children?.()}
</caption>
