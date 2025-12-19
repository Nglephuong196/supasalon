"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Receipt,
  UserCog,
  Settings,
  Scissors,
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
    title: "Khách hàng",
    href: "/clients",
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white dark:bg-zinc-950">
      <div className="flex h-16 items-center border-b px-6">
        <Scissors className="mr-2 h-6 w-6 text-primary" />
        <span className="text-lg font-bold">Salon Pro</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.title}
          </Link>
        ))}
      </nav>
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-zinc-200"></div>
            <div className="flex flex-col">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-xs text-zinc-500">admin@salon.com</span>
            </div>
        </div>
      </div>
    </div>
  );
}
