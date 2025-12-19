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
import { ClientForm } from "./client-form"
import { Client } from "./schema"

// Mock data
const initialData: Client[] = [
  { id: "1", name: "Nguyễn Văn A", phone: "0901234567", email: "a@gmail.com" },
  { id: "2", name: "Trần Thị B", phone: "0912345678", email: "b@gmail.com" },
]

export default function ClientsPage() {
  const [data, setData] = useState<Client[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const handleCreate = (newClient: Client) => {
    setData([...data, { ...newClient, id: Math.random().toString() }])
    setIsOpen(false)
  }

  const handleUpdate = (updatedClient: Client) => {
    setData(data.map((c) => (c.id === updatedClient.id ? updatedClient : c)))
    setIsOpen(false)
    setEditingClient(null)
  }

  const handleDelete = (clientToDelete: Client) => {
    if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
        setData(data.filter((c) => c.id !== clientToDelete.id))
    }
  }

  const openEdit = (client: Client) => {
      setEditingClient(client)
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
            <h1 className="text-2xl font-bold tracking-tight">Khách hàng</h1>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) setEditingClient(null)
            }}>
              <SheetTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Thêm khách hàng</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{editingClient ? "Sửa khách hàng" : "Thêm khách hàng mới"}</SheetTitle>
                  <SheetDescription>
                    Nhập thông tin khách hàng vào form bên dưới.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <ClientForm 
                    defaultValues={editingClient || undefined}
                    onSubmit={editingClient ? handleUpdate : handleCreate} 
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <DataTable columns={columns} data={data} searchKey="name" />
        </main>
      </div>
    </div>
  )
}
