<script lang="ts">
    import { page } from "$app/stores";
    import { cn } from "$lib/utils";
    import { Button } from "$lib/components/ui/button";
    import {
        checkPermission,
        RESOURCES,
        ACTIONS,
        type Permissions,
        type Resource,
        type Action,
    } from "$lib/permissions";
    import {
        LayoutDashboard,
        CalendarDays,
        Users,
        Receipt,
        UserCog,
        Settings,
        Scissors,
        PanelLeftClose,
        PanelLeft,
        Package,
        Command,
        LifeBuoy,
        LogOut,
    } from "@lucide/svelte";

    interface NavItem {
        title: string;
        href: string;
        icon: any;
        permission?: { resource: Resource; action: Action };
    }

    interface Props {
        class?: string;
        collapsed?: boolean;
        onToggle?: () => void;
        organization?: {
            id: string;
            name: string;
            slug?: string | null;
            logo?: string | null;
        } | null;
        user?: {
            id: string;
            name: string;
            email: string;
            image?: string | null;
        } | null;
        role?: string | null;
        permissions?: Permissions | null;
    }

    let {
        class: className = "",
        collapsed = false,
        onToggle,
        organization = null,
        user = null,
        role = null,
        permissions = null,
    }: Props = $props();

    const mainNav: NavItem[] = [
        { title: "Tổng quan", href: "/", icon: LayoutDashboard },
        {
            title: "Lịch hẹn",
            href: "/bookings",
            icon: CalendarDays,
            permission: { resource: RESOURCES.BOOKING, action: ACTIONS.READ },
        },
    ];

    const managementNav: NavItem[] = [
        {
            title: "Dịch vụ",
            href: "/services",
            icon: Scissors,
            permission: { resource: RESOURCES.SERVICE, action: ACTIONS.READ },
        },
        {
            title: "Sản phẩm",
            href: "/products",
            icon: Package,
            permission: { resource: RESOURCES.PRODUCT, action: ACTIONS.READ },
        },
        {
            title: "Khách hàng",
            href: "/customers",
            icon: Users,
            permission: { resource: RESOURCES.CUSTOMER, action: ACTIONS.READ },
        },
        {
            title: "Nhân viên",
            href: "/employees",
            icon: UserCog,
            permission: { resource: RESOURCES.EMPLOYEE, action: ACTIONS.READ },
        },
    ];

    const financeNav: NavItem[] = [
        {
            title: "Hóa đơn",
            href: "/invoices",
            icon: Receipt,
            permission: { resource: RESOURCES.INVOICE, action: ACTIONS.READ },
        },
        { title: "Cài đặt", href: "/settings", icon: Settings },
    ];

    // Filter nav items based on permissions
    function filterNavItems(items: NavItem[]): NavItem[] {
        return items.filter((item) => {
            if (!item.permission) return true;
            return checkPermission(
                role,
                permissions,
                item.permission.resource,
                item.permission.action,
            );
        });
    }

    // Reactive filtered nav items
    let filteredMainNav = $derived(filterNavItems(mainNav));
    let filteredManagementNav = $derived(filterNavItems(managementNav));
    let filteredFinanceNav = $derived(filterNavItems(financeNav));
</script>

<div
    class={cn(
        "flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
    )}
>
    <!-- Header -->
    <div
        class={cn(
            "flex h-14 items-center px-4 border-b border-sidebar-border/50",
            collapsed ? "justify-center" : "justify-between",
        )}
    >
        {#if collapsed}
            <Button
                variant="ghost"
                size="icon"
                onclick={onToggle}
                class="h-9 w-9 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-primary"
            >
                <Command class="h-5 w-5" />
            </Button>
        {:else}
            <div class="flex items-center gap-2.5 px-2">
                <div
                    class="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-purple-200"
                >
                    <Command class="h-4.5 w-4.5" />
                </div>
                <div class="flex flex-col">
                    <span
                        class="text-sm font-bold tracking-tight text-foreground leading-none"
                        >{organization?.name || "SupaSalon"}</span
                    >
                    <span
                        class="text-[10px] text-muted-foreground font-medium mt-0.5"
                        >Quản lý</span
                    >
                </div>
            </div>
            {#if onToggle}
                <Button
                    variant="ghost"
                    size="icon"
                    onclick={onToggle}
                    class="h-7 w-7 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ml-auto -mr-1"
                >
                    <PanelLeftClose class="h-4 w-4" />
                </Button>
            {/if}
        {/if}
    </div>

    <!-- Navigation -->
    <div
        class="flex-1 overflow-y-auto px-3 py-2 space-y-2 md:py-4 md:space-y-6"
    >
        <!-- Section: Main -->
        {#if filteredMainNav.length > 0}
            <div class="space-y-1">
                {#if !collapsed}
                    <h4
                        class="px-2 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-2"
                    >
                        Menu chính
                    </h4>
                {/if}
                <nav class="space-y-0.5">
                    {#each filteredMainNav as item}
                        <a
                            href={item.href}
                            class={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 group",
                                $page.url.pathname === item.href
                                    ? "bg-sidebar-accent text-primary shadow-sm ring-1 ring-sidebar-border"
                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                                collapsed ? "justify-center px-2" : "",
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <item.icon
                                class={cn(
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                    $page.url.pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-foreground",
                                )}
                            />
                            {#if !collapsed}
                                <span class="truncate">{item.title}</span>
                            {/if}
                        </a>
                    {/each}
                </nav>
            </div>
        {/if}

        <!-- Section: Management -->
        {#if filteredManagementNav.length > 0}
            <div class="space-y-1">
                {#if !collapsed}
                    <h4
                        class="px-2 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-2"
                    >
                        Quản lý
                    </h4>
                {/if}
                <nav class="space-y-0.5">
                    {#each filteredManagementNav as item}
                        <a
                            href={item.href}
                            class={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 group",
                                $page.url.pathname === item.href
                                    ? "bg-sidebar-accent text-primary shadow-sm ring-1 ring-sidebar-border"
                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                                collapsed ? "justify-center px-2" : "",
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <item.icon
                                class={cn(
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                    $page.url.pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-foreground",
                                )}
                            />
                            {#if !collapsed}
                                <span class="truncate">{item.title}</span>
                            {/if}
                        </a>
                    {/each}
                </nav>
            </div>
        {/if}

        <!-- Section: System -->
        {#if filteredFinanceNav.length > 0}
            <div class="space-y-1">
                {#if !collapsed}
                    <h4
                        class="px-2 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider mb-2"
                    >
                        Hệ thống
                    </h4>
                {/if}
                <nav class="space-y-0.5">
                    {#each filteredFinanceNav as item}
                        <a
                            href={item.href}
                            class={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-all duration-200 group",
                                $page.url.pathname === item.href
                                    ? "bg-sidebar-accent text-primary shadow-sm ring-1 ring-sidebar-border"
                                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground",
                                collapsed ? "justify-center px-2" : "",
                            )}
                            title={collapsed ? item.title : undefined}
                        >
                            <item.icon
                                class={cn(
                                    "h-4.5 w-4.5 shrink-0 transition-colors",
                                    $page.url.pathname === item.href
                                        ? "text-primary"
                                        : "text-muted-foreground group-hover:text-foreground",
                                )}
                            />
                            {#if !collapsed}
                                <span class="truncate">{item.title}</span>
                            {/if}
                        </a>
                    {/each}
                </nav>
            </div>
        {/if}
    </div>

    <!-- User section -->
    <div class="p-3 border-t border-sidebar-border/50 bg-gray-50/50">
        <div
            class={cn(
                "flex items-center gap-3 p-2 rounded-xl hover:bg-white hover:shadow-sm transition-all cursor-pointer group border border-transparent hover:border-sidebar-border",
                collapsed ? "justify-center" : "",
            )}
        >
            <div
                class="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shrink-0 text-white font-semibold shadow-sm"
            >
                {user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase() || "U"}
            </div>

            {#if !collapsed}
                <div class="flex flex-col min-w-0 flex-1">
                    <span
                        class="text-xs font-bold truncate text-foreground group-hover:text-primary transition-colors"
                        >{user?.name || "User"}</span
                    >
                    <span class="text-[10px] text-muted-foreground truncate"
                        >{user?.email || ""}</span
                    >
                </div>
                <LogOut
                    class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
            {/if}
        </div>
    </div>
</div>
