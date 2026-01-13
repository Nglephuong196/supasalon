<script lang="ts">
    import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let {
        class: className,
        ...restProps
    }: AlertDialogPrimitive.DescriptionProps = $props();
</script>

<AlertDialogPrimitive.Description
    class={cn("text-sm text-muted-foreground", className)}
    {...restProps}
/>
