<script lang="ts">
import { Button } from "$lib/components/ui/button";
import { AlertTriangle, RefreshCw } from "@lucide/svelte";

interface Props {
  /** The error to display */
  error?: Error | null;
  /** Optional title for the error card */
  title?: string;
  /** Optional callback when retry button is clicked */
  onRetry?: () => void;
}

let { error = null, title = "Something went wrong", onRetry }: Props = $props();
</script>

{#if error}
  <div class="flex flex-col items-center justify-center p-8 text-center">
    <div class="rounded-full bg-red-100 p-4 mb-4">
      <AlertTriangle class="h-8 w-8 text-red-600" />
    </div>
    <h3 class="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p class="text-sm text-gray-500 mb-4 max-w-md">
      {error.message || "An unexpected error occurred. Please try again."}
    </p>
    {#if onRetry}
      <Button variant="outline" onclick={onRetry} class="gap-2">
        <RefreshCw class="h-4 w-4" />
        Try Again
      </Button>
    {/if}
  </div>
{/if}
