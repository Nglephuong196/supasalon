<script lang="ts">
import { page } from "$app/stores";
import { Button } from "$lib/components/ui/button";
import {
  ACTIONS,
  type Action,
  type Permissions,
  RESOURCES,
  type Resource,
  checkPermission,
} from "$lib/permissions";
import { cn } from "$lib/utils";
import {
  CalendarDays,
  Command,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  PanelLeft,
  PanelLeftClose,
  Receipt,
  Scissors,
  Settings,
  UserCog,
  Users,
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
    return checkPermission(role, permissions, item.permission.resource, item.permission.action);
  });
}

// Reactive filtered nav items
let filteredMainNav = $derived(filterNavItems(mainNav));
let filteredManagementNav = $derived(filterNavItems(managementNav));
let filteredFinanceNav = $derived(filterNavItems(financeNav));
</script>

<div
  class={cn(
    "relative flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-all duration-300",
    collapsed ? "w-16" : "w-64",
    className,
  )}
>
  <div
    class="pointer-events-none absolute inset-x-3 top-2 h-px bg-gradient-to-r from-transparent via-primary/45 to-transparent"
  ></div>
  <div
    class="pointer-events-none absolute -right-12 top-12 h-28 w-28 rounded-full bg-primary/15 blur-2xl"
  ></div>
  <div
    class="pointer-events-none absolute -left-12 bottom-20 h-28 w-28 rounded-full bg-indigo-300/20 blur-2xl"
  ></div>

  <!-- Header -->
  <div
    class={cn(
      "flex h-14 items-center border-b border-sidebar-border/50 px-4",
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
          <span class="text-sm font-bold tracking-tight text-foreground leading-none"
            >{organization?.name || "SupaSalon"}</span
          >
          <span class="text-[10px] text-muted-foreground font-medium mt-0.5">Quản lý</span>
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
  <div class="flex-1 space-y-4 overflow-y-auto px-3 py-3 md:py-4">
    <!-- Section: Main -->
    {#if filteredMainNav.length > 0}
      <div class="space-y-1">
        {#if !collapsed}
          <div class="mb-1 flex items-center gap-2 px-2">
            <span class="h-1.5 w-1.5 rounded-full bg-primary/70"></span>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Menu chính
            </h4>
          </div>
        {/if}
        <nav class="space-y-0.5">
          {#each filteredMainNav as item}
            <a
              href={item.href}
              class={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-base font-medium transition-colors duration-150",
                $page.url.pathname === item.href
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
                collapsed ? "justify-center px-2" : "",
              )}
              title={collapsed ? item.title : undefined}
            >
              <span
                class={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
                  $page.url.pathname === item.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                )}
              >
                <item.icon class="h-4 w-4" />
              </span>
              {#if !collapsed}
                <span class="truncate">{item.title}</span>
                <span
                  class={cn(
                    "ml-auto h-1.5 w-1.5 rounded-full transition-colors",
                    $page.url.pathname === item.href ? "bg-primary" : "bg-transparent",
                  )}
                ></span>
              {/if}
            </a>
          {/each}
        </nav>
      </div>
    {/if}

    <!-- Section: Management -->
    {#if filteredManagementNav.length > 0}
      <div class="space-y-1 border-t border-sidebar-border/50 pt-3">
        {#if !collapsed}
          <div class="mb-1 flex items-center gap-2 px-2">
            <span class="h-1.5 w-1.5 rounded-full bg-indigo-500/80"></span>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Quản lý
            </h4>
          </div>
        {/if}
        <nav class="space-y-0.5">
          {#each filteredManagementNav as item}
            <a
              href={item.href}
              class={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-base font-medium transition-colors duration-150",
                $page.url.pathname === item.href
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
                collapsed ? "justify-center px-2" : "",
              )}
              title={collapsed ? item.title : undefined}
            >
              <span
                class={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
                  $page.url.pathname === item.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                )}
              >
                <item.icon class="h-4 w-4" />
              </span>
              {#if !collapsed}
                <span class="truncate">{item.title}</span>
                <span
                  class={cn(
                    "ml-auto h-1.5 w-1.5 rounded-full transition-colors",
                    $page.url.pathname === item.href ? "bg-primary" : "bg-transparent",
                  )}
                ></span>
              {/if}
            </a>
          {/each}
        </nav>
      </div>
    {/if}

    <!-- Section: System -->
    {#if filteredFinanceNav.length > 0}
      <div class="space-y-1 border-t border-sidebar-border/50 pt-3">
        {#if !collapsed}
          <div class="mb-1 flex items-center gap-2 px-2">
            <span class="h-1.5 w-1.5 rounded-full bg-fuchsia-500/80"></span>
            <h4 class="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
              Hệ thống
            </h4>
          </div>
        {/if}
        <nav class="space-y-0.5">
          {#each filteredFinanceNav as item}
            <a
              href={item.href}
              class={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-base font-medium transition-colors duration-150",
                $page.url.pathname === item.href
                  ? "bg-gradient-to-r from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
                collapsed ? "justify-center px-2" : "",
              )}
              title={collapsed ? item.title : undefined}
            >
              <span
                class={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
                  $page.url.pathname === item.href
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                )}
              >
                <item.icon class="h-4 w-4" />
              </span>
              {#if !collapsed}
                <span class="truncate">{item.title}</span>
                <span
                  class={cn(
                    "ml-auto h-1.5 w-1.5 rounded-full transition-colors",
                    $page.url.pathname === item.href ? "bg-primary" : "bg-transparent",
                  )}
                ></span>
              {/if}
            </a>
          {/each}
        </nav>
      </div>
    {/if}
  </div>

  <!-- User section -->
  <div class="border-t border-sidebar-border/50 bg-gray-50/50 p-3">
    <div
      class={cn(
        "group flex cursor-pointer items-center gap-3 rounded-xl border border-transparent bg-white/70 p-2 shadow-[0_10px_24px_-20px_rgba(44,20,92,0.8)] transition-all hover:border-sidebar-border hover:bg-white hover:shadow-sm",
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
          <span class="text-[10px] text-muted-foreground truncate">{user?.email || ""}</span>
        </div>
        <LogOut
          class="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
        />
      {/if}
    </div>
  </div>
</div>
