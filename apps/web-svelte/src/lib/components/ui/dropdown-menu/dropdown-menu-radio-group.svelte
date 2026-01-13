<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let {
        class: className,
        children,
        ...restProps
    }: DropdownMenuPrimitive.RadioGroupProps = $props();
</script>

<DropdownMenuPrimitive.RadioGroup class={cn(className)} {...restProps}>
    {@render children?.()}
</DropdownMenuPrimitive.RadioGroup>
