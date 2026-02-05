<script lang="ts">
    import Sidebar from "$lib/components/layout/Sidebar.svelte";
    import Header from "$lib/components/layout/Header.svelte";
    import { Toaster } from "$lib/components/ui/sonner";

    import { fade, fly } from "svelte/transition";
    import { cubicOut } from "svelte/easing";
    import { afterNavigate, onNavigate } from "$app/navigation";
    import { page } from "$app/stores";

    let { children, data } = $props();

    let isSidebarCollapsed = $state(false);
    let isMobileMenuOpen = $state(false);

    afterNavigate(() => {
        isMobileMenuOpen = false;
    });

    onNavigate((navigation) => {
        if (typeof document === "undefined") return;
        if (!("startViewTransition" in document)) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        return new Promise((resolve) => {
            // @ts-expect-error View Transition API
            document.startViewTransition(async () => {
                resolve();
                await navigation.complete;
            });
        });
    });
</script>

<div class="flex h-screen overflow-hidden bg-gray-50">
    <!-- Desktop Sidebar -->
    <div class="hidden md:flex">
        <Sidebar
            collapsed={isSidebarCollapsed}
            onToggle={() => (isSidebarCollapsed = !isSidebarCollapsed)}
            organization={data.organization}
            user={data.user}
            role={data.memberRole}
            permissions={data.memberPermissions}
        />
    </div>

    <!-- Mobile Sidebar Overlay -->
    {#if isMobileMenuOpen}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            transition:fade={{ duration: 200 }}
            onclick={() => (isMobileMenuOpen = false)}
        >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="h-full w-full bg-white shadow-2xl"
                transition:fly={{
                    x: "-100%",
                    duration: 300,
                    opacity: 1,
                    easing: cubicOut,
                }}
                onclick={(e) => e.stopPropagation()}
            >
                <Sidebar
                    class="w-full border-none"
                    onToggle={() => (isMobileMenuOpen = false)}
                    organization={data.organization}
                    user={data.user}
                    role={data.memberRole}
                    permissions={data.memberPermissions}
                />
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
    <Toaster position="top-center" richColors />
</div>
