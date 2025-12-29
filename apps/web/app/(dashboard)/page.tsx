"use client";

import { useState, useEffect } from "react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TodaySchedule } from "@/components/dashboard/today-schedule";
import { TopStylists } from "@/components/dashboard/top-stylists";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";

export default function Home() {
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    const today = new Date();
    setFormattedDate(
      today.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
  }, []);

  return (
    <div className="flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Chào mừng trở lại, Salon Pro
          </h1>
          <p className="text-muted-foreground">
            Đây là những gì đang xảy ra tại salon của bạn hôm nay.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground capitalize">
            {formattedDate}
          </span>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Tạo lịch hẹn mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Tổng doanh thu"
          value="12.450.000đ"
          description="so với tháng trước"
          icon={DollarSign}
          trend="up"
          trendValue="+12%"
          iconBgColor="bg-purple-100"
          iconColor="text-purple-600"
        />
        <StatsCard
          title="Lịch hẹn hôm nay"
          value="45"
          description="so với hôm qua"
          icon={CalendarDays}
          trend="up"
          trendValue="+5%"
          iconBgColor="bg-blue-100"
          iconColor="text-blue-600"
        />
        <StatsCard
          title="Khách hàng mới"
          value="8"
          description="so với tuần trước"
          icon={Users}
          trend="up"
          trendValue="+2%"
          iconBgColor="bg-green-100"
          iconColor="text-green-600"
        />
        <StatsCard
          title="Giá trị trung bình"
          value="85.000đ"
          description="so với tháng trước"
          icon={TrendingUp}
          trend="up"
          trendValue="+1.5%"
          iconBgColor="bg-orange-100"
          iconColor="text-orange-600"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Revenue Chart - Takes 3 columns */}
        <div className="lg:col-span-3">
          <RevenueChart />
        </div>
        {/* Today's Schedule - Takes 2 columns */}
        <div className="lg:col-span-2">
          <TodaySchedule />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <TopStylists />
        <LowStockAlerts />
      </div>
    </div>
  );
}
