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
import { InvoiceForm } from "./invoice-form"
import { Invoice } from "./schema"

// Mock data
const initialData: Invoice[] = [
  { id: "1", customerId: "1", customerName: "Nguyễn Văn A", amount: 150000, status: "Paid", date: new Date() },
  { id: "2", customerId: "2", customerName: "Trần Thị B", amount: 500000, status: "Unpaid", date: new Date() },
]

export default function InvoicesPage() {
  const [data, setData] = useState<Invoice[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)

  const handleCreate = (newInvoice: Invoice) => {
    setData([...data, { ...newInvoice, id: Math.random().toString(), customerName: "Khách lẻ" }])
    setIsOpen(false)
  }

  const handleUpdate = (updatedInvoice: Invoice) => {
    setData(data.map((i) => (i.id === updatedInvoice.id ? updatedInvoice : i)))
    setIsOpen(false)
    setEditingInvoice(null)
  }

  const handleDelete = (invoiceToDelete: Invoice) => {
    if (confirm("Bạn có chắc chắn muốn xóa hóa đơn này?")) {
        setData(data.filter((i) => i.id !== invoiceToDelete.id))
    }
  }

  const openEdit = (invoice: Invoice) => {
      setEditingInvoice(invoice)
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
            <h1 className="text-2xl font-bold tracking-tight">Hóa đơn</h1>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) setEditingInvoice(null)
            }}>
              <SheetTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Tạo hóa đơn</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{editingInvoice ? "Sửa hóa đơn" : "Tạo hóa đơn mới"}</SheetTitle>
                  <SheetDescription>
                    Nhập thông tin hóa đơn vào form bên dưới.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <InvoiceForm 
                    defaultValues={editingInvoice || undefined}
                    onSubmit={editingInvoice ? handleUpdate : handleCreate} 
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
