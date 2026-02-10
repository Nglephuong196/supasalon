<script lang="ts">
import { type WithoutChildrenOrChild, cn } from "$lib/utils.js";
import XIcon from "@lucide/svelte/icons/x";
import { Dialog as DialogPrimitive } from "bits-ui";
import type { Snippet } from "svelte";
import type { ComponentProps } from "svelte";
import DialogPortal from "./dialog-portal.svelte";
import * as Dialog from "./index.js";

let {
  ref = $bindable(null),
  class: className,
  portalProps,
  children,
  showCloseButton = true,
  ...restProps
}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & {
  portalProps?: WithoutChildrenOrChild<ComponentProps<typeof DialogPortal>>;
  children: Snippet;
  showCloseButton?: boolean;
} = $props();
</script>

<DialogPortal {...portalProps}>
  <Dialog.Overlay />
  <DialogPrimitive.Content
    bind:ref
    data-slot="dialog-content"
    class={cn(
      "modal-shell bg-background/98 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] max-h-[calc(100vh-2rem)] -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-2xl border border-border/80 p-6 shadow-[0_30px_90px_-28px_hsl(var(--foreground)/0.42)] duration-200 sm:max-w-lg",
      className,
    )}
    {...restProps}
  >
    {@render children?.()}
    {#if showCloseButton}
      <DialogPrimitive.Close
        class="ring-offset-background focus:ring-ring absolute end-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
      >
        <XIcon />
        <span class="sr-only">Close</span>
      </DialogPrimitive.Close>
    {/if}
  </DialogPrimitive.Content>
</DialogPortal>
