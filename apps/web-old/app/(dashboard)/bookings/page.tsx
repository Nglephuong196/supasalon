"use client"

import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { BookingForm } from "./booking-form"
import { Booking } from "./schema"
import { Card, CardContent } from "@/components/ui/card"
import { CalendarCheck, UserCheck, UserX } from "lucide-react"
import { cn } from "@/lib/utils"

// Mock data
const initialData: Booking[] = [
    { id: "1", customerName: "Nguyễn Văn A", service: "Cắt tóc", staffName: "Trần B", date: new Date(), time: "09:00", status: "Confirmed" },
    { id: "2", customerName: "Trần Thị C", service: "Gội đầu", staffName: "Lê D", date: new Date(), time: "10:30", status: "Pending" },
    { id: "3", customerName: "Lê Văn E", service: "Nhuộm tóc", staffName: "Trần B", date: new Date(), time: "14:00", status: "Completed" },
    { id: "4", customerName: "Phạm Thị F", service: "Cắt tóc", staffName: "Nguyễn G", date: new Date(), time: "15:30", status: "Cancelled" },
]

interface StatCardProps {
  title: string
  value: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon: React.ElementType
  iconBgColor: string
  iconColor: string
}

function StatCard({ title, value, trend, trendValue, icon: Icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{value}</span>
              {trend && trendValue && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-gray-500"
                  )}
                >
                  {trend === "up" && "↑"}
                  {trend === "down" && "↓"}
                  {trendValue}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-2.5 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BookingStatsCards() {
  // Calculate stats from data
  const totalBookings = initialData.length
  const returnCustomers = 2 // Mock: In real app, calculate from customer history
  const cancellationRate = Math.round((initialData.filter(b => b.status === "Cancelled").length / totalBookings) * 100)

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      <StatCard
        title="Tổng lịch hẹn"
        value={totalBookings.toString()}
        trend="up"
        trendValue="+12%"
        icon={CalendarCheck}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        title="Khách quay lại"
        value={returnCustomers.toString()}
        trend="up"
        trendValue="+5%"
        icon={UserCheck}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
      <StatCard
        title="Tỷ lệ hủy"
        value={`${cancellationRate}%`}
        trend="down"
        trendValue="-2%"
        icon={UserX}
        iconBgColor="bg-orange-100"
        iconColor="text-orange-600"
      />
    </div>
  )
}

export default function BookingsPage() {
  return (
    <ResourcePage<Booking>
      title="Lịch hẹn"
      initialData={initialData}
      searchKey="customerName"
      addButtonLabel="Đặt lịch mới"
      getColumns={getColumns}
      FormComponent={BookingForm}
      dialogTitle={(isEditing) => isEditing ? "Sửa lịch hẹn" : "Đặt lịch mới"}
      dialogDescription="Nhập thông tin lịch hẹn vào form bên dưới."
      dateFilterField="date"
      statsCards={<BookingStatsCards />}
    />
  )
}
