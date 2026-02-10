import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Scissors,
  Settings,
  UserCircle2,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

type DashboardShellProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const mainNav: NavItem[] = [
  { label: "Tổng quan", to: "/", icon: LayoutDashboard },
  { label: "Lịch hẹn", to: "/bookings", icon: CalendarDays },
];

const managementNav: NavItem[] = [
  { label: "Dịch vụ", to: "/services", icon: Scissors },
  { label: "Sản phẩm", to: "/products", icon: Package },
  { label: "Khách hàng", to: "/customers", icon: Users },
  { label: "Nhân viên", to: "/employees", icon: UserCog },
];

const systemNav: NavItem[] = [
  { label: "Hóa đơn", to: "/invoices", icon: CreditCard },
  { label: "Cài đặt", to: "/settings", icon: Settings },
  { label: "Hoa hồng", to: "/commission-settings", icon: Settings },
];

function NavSection({
  title,
  dotClass,
  items,
  pathname,
  onItemClick,
}: {
  title: string;
  dotClass: string;
  items: NavItem[];
  pathname: string;
  onItemClick?: () => void;
}) {
  return (
    <div className="space-y-1 border-t border-[hsl(260_18%_90%/.5)] pt-3 first:border-0 first:pt-0">
      <div className="mb-1 flex items-center gap-2 px-2">
        <span className={cn("h-1.5 w-1.5 rounded-full", dotClass)} />
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
          {title}
        </h4>
      </div>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onItemClick}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-lg px-3 py-2 text-base font-medium transition-colors duration-150",
                active
                  ? "bg-linear-to-r from-primary/15 to-primary/5 text-primary shadow-sm ring-1 ring-primary/20"
                  : "text-muted-foreground hover:bg-white hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-all",
                  active
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground group-hover:bg-muted group-hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.label}</span>
              <span
                className={cn(
                  "ml-auto h-1.5 w-1.5 rounded-full transition-colors",
                  active ? "bg-primary" : "bg-transparent",
                )}
              />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function DashboardShell({ children }: DashboardShellProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const mobileItems = [mainNav[0], mainNav[1], managementNav[2], managementNav[3], systemNav[1]];
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
      await navigate({ to: "/signin" });
    } finally {
      setIsSigningOut(false);
    }
  }

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="dashboard-shell flex h-svh min-h-svh overflow-hidden bg-gray-50">
      <div className="dashboard-ambient">
        <div className="ambient-orb ambient-orb--one" />
        <div className="ambient-orb ambient-orb--two" />
        <div className="ambient-grid" />
      </div>

      <aside className="hidden h-full w-64 flex-col overflow-hidden border-r border-[hsl(260_18%_90%)] bg-white md:flex">
        <div className="relative flex h-14 items-center justify-between border-b border-[hsl(260_18%_90%/.5)] px-4">
          <div className="flex items-center gap-2.5 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-purple-200">
              <LayoutDashboard className="h-4.5 w-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm leading-none font-bold tracking-tight text-foreground">
                SupaSalon
              </span>
              <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">Quản lý</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          <NavSection
            title="Menu chính"
            dotClass="bg-primary/70"
            items={mainNav}
            pathname={pathname}
            onItemClick={closeMobileMenu}
          />
          <NavSection
            title="Quản lý"
            dotClass="bg-indigo-500/80"
            items={managementNav}
            pathname={pathname}
            onItemClick={closeMobileMenu}
          />
          <NavSection
            title="Hệ thống"
            dotClass="bg-fuchsia-500/80"
            items={systemNav}
            pathname={pathname}
            onItemClick={closeMobileMenu}
          />
        </div>
      </aside>

      {isMobileMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/35"
            aria-label="Đóng menu"
            onClick={closeMobileMenu}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[84vw] max-w-xs flex-col border-r border-[hsl(260_18%_90%)] bg-white shadow-2xl">
            <div className="relative flex h-14 items-center justify-between border-b border-[hsl(260_18%_90%/.5)] px-4">
              <div className="flex items-center gap-2.5 px-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-br from-primary to-violet-600 text-primary-foreground shadow-sm shadow-purple-200">
                  <LayoutDashboard className="h-4.5 w-4.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm leading-none font-bold tracking-tight text-foreground">
                    SupaSalon
                  </span>
                  <span className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                    Quản lý
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeMobileMenu}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
              <NavSection
                title="Menu chính"
                dotClass="bg-primary/70"
                items={mainNav}
                pathname={pathname}
              />
              <NavSection
                title="Quản lý"
                dotClass="bg-indigo-500/80"
                items={managementNav}
                pathname={pathname}
              />
              <NavSection
                title="Hệ thống"
                dotClass="bg-fuchsia-500/80"
                items={systemNav}
                pathname={pathname}
              />
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="glass-topbar sticky top-0 z-30 flex h-14 items-center gap-4 px-4 shadow-[0_8px_24px_-18px_rgba(97,39,212,0.55)] md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden -ml-2 h-8 w-8 text-muted-foreground"
            onClick={() => setIsMobileMenuOpen(true)}
            aria-label="Mở menu"
          >
            <Menu className="h-4 w-4" />
          </Button>

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
      </div>

      <nav className="fixed right-0 bottom-0 left-0 z-40 border-t border-border bg-white/95 p-2 backdrop-blur md:hidden">
        <div className="grid grid-cols-5 gap-1">
          {mobileItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMobileMenu}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-[11px] font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
