<script lang="ts">
    import Sidebar from "$lib/components/layout/Sidebar.svelte";
    import Header from "$lib/components/layout/Header.svelte";
    import { Toaster } from "$lib/components/ui/sonner";

    let { children } = $props();

    let isSidebarCollapsed = $state(false);
    let isMobileMenuOpen = $state(false);
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Desktop Sidebar -->
    <div class="hidden md:flex">
        <Sidebar
            collapsed={isSidebarCollapsed}
            onToggle={() => (isSidebarCollapsed = !isSidebarCollapsed)}
        />
    </div>

    <!-- Mobile Sidebar Overlay -->
    {#if isMobileMenuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-300"
            onclick={() => (isMobileMenuOpen = false)}
        >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="h-full w-72 shadow-2xl transition-transform duration-300"
                onclick={(e) => e.stopPropagation()}
            >
                <Sidebar onToggle={() => (isMobileMenuOpen = false)} />
            </div>
        </div>
    {/if}

    <div
        class="flex flex-1 flex-col overflow-hidden transition-all duration-300"
    >
        <Header onMobileMenuOpen={() => (isMobileMenuOpen = true)} />
        <main class="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
            {@render children()}
        </main>
    </div>
    <Toaster />
</div>
