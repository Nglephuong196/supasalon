<script lang="ts">
    import type { Snippet } from "svelte";
    import ErrorDisplay from "./error-display.svelte";

    interface Props {
        /** The content to render when there's no error */
        children: Snippet;
        /** Fallback error display when error occurs */
        fallback?: Snippet<[Error]>;
    }

    let { children, fallback }: Props = $props();

    // In Svelte 5, we use error state that can be set by parent
    let error = $state<Error | null>(null);

    /**
     * Call this function to set an error state manually.
     * Typically passed to async operations or event handlers.
     */
    export function setError(e: Error | null) {
        error = e;
    }

    /**
     * Clear the error state.
     */
    export function clearError() {
        error = null;
    }
</script>

{#if error}
    {#if fallback}
        {@render fallback(error)}
    {:else}
        <ErrorDisplay {error} onRetry={clearError} />
    {/if}
{:else}
    {@render children()}
{/if}
