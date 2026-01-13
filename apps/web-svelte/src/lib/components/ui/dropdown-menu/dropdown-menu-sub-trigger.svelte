<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let {
        class: className,
        children,
        ...restProps
    }: DropdownMenuPrimitive.SubTriggerProps = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
    class={cn(
        "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
        className,
    )}
    {...restProps}
>
    {@render children?.()}
</DropdownMenuPrimitive.SubTrigger>
