<script lang="ts">
    import { Bell, Search, LogOut, Menu } from "@lucide/svelte";
    import { Input } from "$lib/components/ui/input";
    import { Button } from "$lib/components/ui/button";
    import { useSession, signOut } from "$lib/auth-client";
    import { goto } from "$app/navigation";

    interface Props {
        onMobileMenuOpen: () => void;
    }

    let { onMobileMenuOpen }: Props = $props();

    const session = useSession();
    let isLoggingOut = $state(false);

    async function handleLogout() {
        isLoggingOut = true;
        await signOut();
        goto("/signin");
    }

    function getInitials(name: string | null | undefined): string {
        if (!name)
            return $session.data?.user?.email?.charAt(0).toUpperCase() || "U";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
</script>

<header
    class="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-background px-6"
>
    <!-- Mobile Menu Trigger -->
    <Button
        variant="ghost"
        size="icon"
        class="md:hidden -ml-2 h-8 w-8 text-muted-foreground"
        onclick={onMobileMenuOpen}
    >
        <Menu class="h-4 w-4" />
    </Button>

    <!-- Search -->
    <div class="flex-1 flex justify-start">
        <div class="relative w-full max-w-sm hidden md:block group">
            <Search
                class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-foreground transition-colors"
            />
            <Input
                type="search"
                placeholder="Tìm kiếm..."
                class="pl-9 h-9 w-64 bg-secondary/40 border-transparent focus:bg-background focus:border-border transition-all text-sm shadow-none rounded-md"
            />
        </div>
    </div>

    <!-- Right Actions -->
    <div class="flex items-center gap-2">
        <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
            <Bell class="h-4 w-4" />
        </Button>

        <div class="h-4 w-px bg-border mx-1"></div>

        <div class="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 rounded-full border border-border bg-secondary text-secondary-foreground hover:text-foreground"
                onclick={() => goto("/profile")}
                title="Hồ sơ cá nhân"
            >
                <span class="sr-only">Hồ sơ cá nhân</span>
                {#if $session.data?.user?.image}
                    <img
                        src={$session.data.user.image}
                        alt="Avatar"
                        class="h-full w-full rounded-full object-cover"
                    />
                {:else}
                    <span class="text-[10px] font-semibold">
                        {getInitials($session.data?.user?.name)}
                    </span>
                {/if}
            </Button>
            <Button
                variant="ghost"
                size="icon"
                class="h-8 w-8 text-muted-foreground hover:text-foreground"
                onclick={handleLogout}
                disabled={isLoggingOut}
                title="Đăng xuất"
            >
                <LogOut class="h-4 w-4" />
            </Button>
        </div>
    </div>
</header>
