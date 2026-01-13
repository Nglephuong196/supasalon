<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let {
        class: className,
        children: childrenProp,
        ...restProps
    }: DropdownMenuPrimitive.CheckboxItemProps = $props();
</script>

<DropdownMenuPrimitive.CheckboxItem
    class={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
    )}
    {...restProps}
>
    {#snippet children(params)}
        {@render childrenProp?.(params)}
    {/snippet}
</DropdownMenuPrimitive.CheckboxItem>
