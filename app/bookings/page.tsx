"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { getColumns } from "./columns"
import { BookingForm } from "./booking-form"
import { Booking } from "./schema"

// Mock data
const initialData: Booking[] = [
    { id: "1", customerName: "Nguyễn Văn A", service: "Cắt tóc", staffName: "Trần B", date: new Date(), time: "09:00", status: "Confirmed" },
    { id: "2", customerName: "Trần Thị C", service: "Gội đầu", staffName: "Lê D", date: new Date(), time: "10:30", status: "Pending" },
]

export default function BookingsPage() {
  const [data, setData] = useState<Booking[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)

  const handleCreate = (newBooking: Booking) => {
    setData([...data, { ...newBooking, id: Math.random().toString() }])
    setIsOpen(false)
  }

  const handleUpdate = (updatedBooking: Booking) => {
    setData(data.map((b) => (b.id === updatedBooking.id ? updatedBooking : b)))
    setIsOpen(false)
    setEditingBooking(null)
  }

  const handleDelete = (bookingToDelete: Booking) => {
    if (confirm("Bạn có chắc chắn muốn xóa lịch hẹn này?")) {
        setData(data.filter((b) => b.id !== bookingToDelete.id))
    }
  }

  const openEdit = (booking: Booking) => {
      setEditingBooking(booking)
      setIsOpen(true)
  }

  const columns = getColumns({ onEdit: openEdit, onDelete: handleDelete })

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-black">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold tracking-tight">Lịch hẹn</h1>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) setEditingBooking(null)
            }}>
              <SheetTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Đặt lịch mới</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{editingBooking ? "Sửa lịch hẹn" : "Đặt lịch mới"}</SheetTitle>
                  <SheetDescription>
                    Nhập thông tin lịch hẹn vào form bên dưới.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <BookingForm 
                    defaultValues={editingBooking || undefined}
                    onSubmit={editingBooking ? handleUpdate : handleCreate} 
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <DataTable columns={columns} data={data} searchKey="customerName" />
        </main>
      </div>
    </div>
  )
}
