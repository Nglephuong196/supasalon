<script lang="ts">
    import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
    import { cn } from "$lib/utils";

    let { class: className, ...restProps }: AlertDialogPrimitive.TitleProps =
        $props();
</script>

<AlertDialogPrimitive.Title
    class={cn("text-lg font-semibold", className)}
    {...restProps}
/>
