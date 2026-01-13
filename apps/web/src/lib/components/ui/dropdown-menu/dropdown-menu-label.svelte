<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let {
        class: className,
        children,
        ...restProps
    }: DropdownMenuPrimitive.LabelProps = $props();
</script>

<DropdownMenuPrimitive.Label
    class={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...restProps}
>
    {@render children?.()}
</DropdownMenuPrimitive.Label>
