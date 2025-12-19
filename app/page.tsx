"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { BookingList } from "@/components/dashboard/booking-list";
import { CalendarDays, Users, Receipt, DollarSign } from "lucide-react";

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold tracking-tight">Tổng quan</h1>
              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Cập nhật lần cuối: Hôm nay, 14:00</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Tổng doanh thu"
                value="12.500.000đ"
                description="so với tháng trước"
                icon={DollarSign}
                trend="up"
                trendValue="+20.1%"
              />
              <StatsCard
                title="Lịch hẹn mới"
                value="45"
                description="so với hôm qua"
                icon={CalendarDays}
                trend="up"
                trendValue="+5"
              />
              <StatsCard
                title="Khách hàng mới"
                value="12"
                description="trong tuần này"
                icon={Users}
                trend="down"
                trendValue="-2"
              />
              <StatsCard
                title="Hóa đơn chưa thanh toán"
                value="3"
                description="cần xử lý ngay"
                icon={Receipt}
                trend="neutral"
              />
            </div>

            <div className="grid gap-6 md:grid-cols-1">
              <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Lịch hẹn gần đây</h2>
                <BookingList />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
