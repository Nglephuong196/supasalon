"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";

const sidebarItems = [
  {
    title: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Lịch hẹn",
    href: "/bookings",
    icon: CalendarDays,
  },
  {
    title: "Dịch vụ",
    href: "/services",
    icon: Scissors,
  },
  {
    title: "Sản phẩm",
    href: "/products",
    icon: Package,
  },
  {
    title: "Khách hàng",
    href: "/customers",
    icon: Users,
  },
  {
    title: "Hóa đơn",
    href: "/invoices",
    icon: Receipt,
  },
  {
    title: "Nhân viên",
    href: "/employees",
    icon: UserCog,
  },
  {
    title: "Cài đặt",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ className, collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const [isHeaderHovered, setIsHeaderHovered] = useState(false);

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Header with Logo / Toggle */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-sidebar-border transition-all px-6",
          collapsed ? "justify-center" : "justify-between"
        )}
        onMouseEnter={() => setIsHeaderHovered(true)}
        onMouseLeave={() => setIsHeaderHovered(false)}
      >
        {collapsed ? (
          // Collapsed state: show logo, on hover show toggle icon
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-10 w-10 p-0"
            title="Mở rộng menu"
          >
            {isHeaderHovered ? (
              <PanelLeft className="h-6 w-6 text-primary" />
            ) : (
              <Image src="/logo.png" alt="Logo" width={40} height={40} />
            )}
          </Button>
        ) : (
          // Expanded state: always show logo AND toggle icon
          <>
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-8 w-8"
                title="Thu gọn menu"
              >
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              collapsed ? "justify-center px-2 py-2" : ""
            )}
            title={collapsed ? item.title : undefined}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="truncate text-base">{item.title}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-sidebar-border p-4", collapsed ? "flex justify-center p-2" : "")}>
        <div className={cn("flex items-center gap-3", collapsed ? "justify-center" : "")}>
          <div className="h-8 w-8 rounded-full bg-sidebar-accent/50 shrink-0"></div>
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-foreground truncate">Admin User</span>
              <span className="text-xs text-muted-foreground truncate">admin@salon.com</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
