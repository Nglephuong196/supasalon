"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Appointment {
  id: string;
  time: string;
  period: "AM" | "PM";
  clientName: string;
  service: string;
  staff: string;
  status: "confirmed" | "check-in" | "pending" | "available";
}

const todayAppointments: Appointment[] = [
  {
    id: "1",
    time: "10:00",
    period: "AM",
    clientName: "Nguyễn Thị Lan",
    service: "Cắt & Sấy tóc",
    staff: "Minh",
    status: "confirmed",
  },
  {
    id: "2",
    time: "11:30",
    period: "AM",
    clientName: "Trần Văn Hùng",
    service: "Nhuộm tóc",
    staff: "Linh",
    status: "check-in",
  },
  {
    id: "3",
    time: "01:00",
    period: "PM",
    clientName: "Phạm Thị Mai",
    service: "Cắt râu",
    staff: "David",
    status: "pending",
  },
  {
    id: "4",
    time: "02:15",
    period: "PM",
    clientName: "",
    service: "",
    staff: "",
    status: "available",
  },
];

const statusConfig = {
  confirmed: {
    label: "Đã xác nhận",
    className: "bg-green-100 text-green-700 hover:bg-green-100",
  },
  "check-in": {
    label: "Đã đến",
    className: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  },
  pending: {
    label: "Chờ duyệt",
    className: "bg-gray-100 text-gray-600 hover:bg-gray-100",
  },
  available: {
    label: "",
    className: "",
  },
};

export function TodaySchedule() {
  return (
    <Card className="border border-gray-100 shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Lịch hẹn hôm nay</CardTitle>
        <Link
          href="/bookings"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Xem tất cả
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {todayAppointments.map((appointment) => (
          <div
            key={appointment.id}
            className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
          >
            {/* Time */}
            <div className="text-center min-w-[50px]">
              <p className="text-sm font-semibold text-gray-900">{appointment.time}</p>
              <p className="text-xs text-muted-foreground">{appointment.period}</p>
            </div>

            {/* Divider line */}
            <div className="w-px h-12 bg-purple-300 self-center" />

            {/* Content */}
            <div className="flex-1 min-w-0">
              {appointment.status === "available" ? (
                <div className="py-2">
                  <p className="text-sm font-medium text-gray-600">Khung giờ trống</p>
                  <p className="text-xs text-muted-foreground">30 phút</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {appointment.clientName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {appointment.service} • {appointment.staff}
                  </p>
                </>
              )}
            </div>

            {/* Status Badge */}
            {appointment.status !== "available" && (
              <Badge
                variant="secondary"
                className={cn(
                  "text-xs font-medium shrink-0",
                  statusConfig[appointment.status].className
                )}
              >
                {statusConfig[appointment.status].label}
              </Badge>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
