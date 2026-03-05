import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BellRing,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Gift,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Package,
  Scissors,
  Settings,
  ShieldCheck,
  UserCircle2,
  UserCog,
  Users,
  Wallet,
} from "lucide-react";
import { useState } from "react";

type DashboardShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavParent = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
};

const overviewItem: NavItem = {
  title: "Tổng quan",
  url: "/",
  icon: LayoutDashboard,
};

const navParents: NavParent[] = [
  {
    title: "Khách & Dịch vụ",
    icon: Scissors,
    items: [
      { title: "Lịch hẹn", url: "/bookings", icon: CalendarDays },
      { title: "Dịch vụ", url: "/services", icon: Scissors },
      { title: "Sản phẩm", url: "/products", icon: Package },
      { title: "Khách hàng", url: "/customers", icon: Users },
      { title: "Nhân viên", url: "/employees", icon: UserCog },
    ],
  },
  {
    title: "Vận hành",
    icon: CreditCard,
    items: [
      { title: "Hóa đơn", url: "/invoices", icon: CreditCard },
      { title: "Quỹ tiền mặt", url: "/cash-management", icon: Wallet },
      { title: "Phê duyệt", url: "/approvals", icon: ShieldCheck },
      { title: "Nhắc lịch", url: "/booking-reminders", icon: BellRing },
      { title: "Gói trả trước", url: "/prepaid", icon: Gift },
    ],
  },
  {
    title: "Thiết lập",
    icon: Settings,
    items: [
      { title: "Chi nhánh", url: "/branches", icon: Building2 },
      { title: "Bảng lương", url: "/payroll", icon: HandCoins },
      { title: "Cài đặt", url: "/settings", icon: Settings },
      { title: "Hoa hồng", url: "/commission-settings", icon: Settings },
    ],
  },
];

function SidebarNav({ pathname }: { pathname: string }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [openParents, setOpenParents] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const parent of navParents) {
      initial[parent.title] = parent.items.some((item) => item.url === pathname);
    }
    return initial;
  });

  function toggleParent(parent: NavParent) {
    setOpenParents((previous) => ({
      ...previous,
      [parent.title]: !previous[parent.title],
    }));
  }

  return (
    <>
      <SidebarGroup>
        <SidebarGroupLabel>Menu chính</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === overviewItem.url} tooltip={overviewItem.title}>
              <Link to={overviewItem.url}>
                <overviewItem.icon />
                <span>{overviewItem.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      <SidebarSeparator />

      <SidebarGroup>
        <SidebarGroupLabel>Danh mục</SidebarGroupLabel>
        <SidebarMenu>
          {navParents.map((parent) => {
            const ParentIcon = parent.icon;
            const hasActiveChild = parent.items.some((item) => item.url === pathname);
            const isOpen = collapsed ? false : openParents[parent.title];

            return (
              <SidebarMenuItem key={parent.title}>
                <SidebarMenuButton
                  isActive={hasActiveChild}
                  tooltip={parent.title}
                  onClick={() => toggleParent(parent)}
                >
                  <ParentIcon />
                  <span>{parent.title}</span>
                  <ChevronRight
                    className={cn(
                      "ml-auto transition-transform duration-200",
                      isOpen ? "rotate-90" : "rotate-0",
                    )}
                  />
                </SidebarMenuButton>
                {isOpen ? (
                  <SidebarMenuSub>
                    {parent.items.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <SidebarMenuSubItem key={item.url}>
                          <SidebarMenuSubButton asChild isActive={pathname === item.url}>
                            <Link to={item.url}>
                              <ItemIcon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
    </>
  );
}

function SidebarBrandHeader() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <div className={cn("flex h-full items-center", collapsed ? "justify-center" : "justify-start")}>
      <div className="flex items-center gap-2.5 rounded-md px-0" aria-label="SupaSalon">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-purple-200">
          <LayoutDashboard className="h-4.5 w-4.5" />
        </div>
        <div className="flex flex-col group-data-[collapsible=icon]:hidden">
          <span className="text-sm leading-none font-bold tracking-tight text-foreground">SupaSalon</span>
          <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">Quản lý</span>
        </div>
      </div>
    </div>
  );
}

function HeaderSidebarToggle() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="hidden h-9 items-center gap-2 rounded-lg border-primary/30 bg-white/85 px-3 text-primary shadow-[0_8px_22px_-16px_rgba(76,29,149,0.55)] hover:border-primary/50 hover:bg-primary/10 hover:text-primary md:inline-flex"
      onClick={toggleSidebar}
      aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
      aria-expanded={!collapsed}
      title={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
    >
      <span className="text-xs font-semibold tracking-wide">Menu</span>
      {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
    </Button>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const mobileItems = [
    overviewItem,
    navParents[0].items[0],
    navParents[1].items[0],
    navParents[2].items[1],
    navParents[1].items[1],
  ];
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      await navigate({ to: "/signin" });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="dashboard-shell flex h-svh min-h-svh overflow-hidden bg-gray-50">
        <div className="dashboard-ambient">
          <div className="ambient-orb ambient-orb--one" />
          <div className="ambient-orb ambient-orb--two" />
          <div className="ambient-grid" />
        </div>

        <Sidebar collapsible="icon" className="border-r border-[hsl(260_18%_90%)]">
          <SidebarHeader className="h-14 border-b border-[hsl(260_18%_90%/.5)] px-4 py-0">
            <SidebarBrandHeader />
          </SidebarHeader>

          <SidebarContent className="overflow-y-auto overflow-x-hidden px-2 py-3 group-data-[collapsible=icon]:px-0">
            <SidebarNav pathname={pathname} />
          </SidebarContent>

          <SidebarFooter className="p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Hồ sơ"
                  onClick={() => void navigate({ to: "/profile" })}
                >
                  <UserCircle2 />
                  <span>Hồ sơ</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip="Đăng xuất"
                  onClick={() => void handleSignOut()}
                  disabled={isSigningOut}
                >
                  <LogOut />
                  <span>Đăng xuất</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <header className="glass-topbar sticky top-0 z-30 flex h-14 items-center gap-4 px-4 shadow-[0_8px_24px_-18px_rgba(97,39,212,0.55)] md:px-6">
            <SidebarTrigger className="-ml-2 md:hidden" />
            <HeaderSidebarToggle />

            <div className="flex-1">
              <div className="relative hidden w-full max-w-sm md:block">
                <Input
                  className="h-9 w-72 rounded-lg border-border/70 bg-white/70 pl-9 text-sm shadow-[0_8px_18px_-18px_rgba(37,22,76,0.9)]"
                  placeholder="Tìm kiếm..."
                />
                <svg
                  className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => void navigate({ to: "/profile" })}
                title="Hồ sơ"
              >
                <UserCircle2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          <main className="dashboard-main flex-1 overflow-y-auto p-3 pb-20 md:p-5 md:pb-6">
            <div className="dashboard-page-frame">
              <div className="dashboard-page-content p-4 md:p-6">{children}</div>
            </div>
          </main>
        </SidebarInset>

        <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-white/95 p-2 backdrop-blur md:hidden">
          <div className="grid grid-cols-5 gap-1">
            {mobileItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.url;
              return (
                <Link
                  key={item.url}
                  to={item.url}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </SidebarProvider>
  );
}
