"use client"

import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { BookingForm } from "./booking-form"
import { Booking } from "./schema"

// Mock data
const initialData: Booking[] = [
    { id: "1", customerName: "Nguyễn Văn A", service: "Cắt tóc", staffName: "Trần B", date: new Date(), time: "09:00", status: "Confirmed" },
    { id: "2", customerName: "Trần Thị C", service: "Gội đầu", staffName: "Lê D", date: new Date(), time: "10:30", status: "Pending" },
]

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
    />
  )
}
