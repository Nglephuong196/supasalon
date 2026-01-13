<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

    let { children, ...restProps }: DropdownMenuPrimitive.GroupProps = $props();
</script>

<DropdownMenuPrimitive.Group {...restProps}>
    {@render children?.()}
</DropdownMenuPrimitive.Group>
