<script lang="ts">
    import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
    import { buttonVariants } from "$lib/components/ui/button/index.js";
    import { cn } from "$lib/utils";

    let { class: className, ...restProps }: AlertDialogPrimitive.ActionProps =
        $props();
</script>

<AlertDialogPrimitive.Action
    class={cn(buttonVariants(), className)}
    {...restProps}
/>
