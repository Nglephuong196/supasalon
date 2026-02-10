<script lang="ts">
import { type WithoutChild, type WithoutChildrenOrChild, cn } from "$lib/utils.js";
import { AlertDialog as AlertDialogPrimitive } from "bits-ui";
import type { ComponentProps } from "svelte";
import AlertDialogOverlay from "./alert-dialog-overlay.svelte";
import AlertDialogPortal from "./alert-dialog-portal.svelte";

let {
  ref = $bindable(null),
  class: className,
  portalProps,
  ...restProps
}: WithoutChild<AlertDialogPrimitive.ContentProps> & {
  portalProps?: WithoutChildrenOrChild<ComponentProps<typeof AlertDialogPortal>>;
} = $props();
</script>

<AlertDialogPortal {...portalProps}>
  <AlertDialogOverlay />
  <AlertDialogPrimitive.Content
    bind:ref
    data-slot="alert-dialog-content"
    class={cn(
      "modal-shell bg-background/98 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border/80 p-6 shadow-[0_30px_90px_-28px_hsl(var(--foreground)/0.42)] duration-200 sm:max-w-lg",
      className,
    )}
    {...restProps}
  />
</AlertDialogPortal>
