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
import { EmployeeForm } from "./employee-form"
import { Employee } from "./schema"

// Mock data
const initialData: Employee[] = [
  { id: "1", name: "Lê Văn C", role: "Stylist chính", phone: "0909998887", status: "Active" },
  { id: "2", name: "Nguyễn Thị D", role: "Thợ phụ", phone: "0918887776", status: "Active" },
]

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)

  const handleCreate = (newEmployee: Employee) => {
    setData([...data, { ...newEmployee, id: Math.random().toString() }])
    setIsOpen(false)
  }

  const handleUpdate = (updatedEmployee: Employee) => {
    setData(data.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e)))
    setIsOpen(false)
    setEditingEmployee(null)
  }

  const handleDelete = (employeeToDelete: Employee) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhân viên này?")) {
        setData(data.filter((e) => e.id !== employeeToDelete.id))
    }
  }

  const openEdit = (employee: Employee) => {
      setEditingEmployee(employee)
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
            <h1 className="text-2xl font-bold tracking-tight">Nhân viên</h1>
            <Sheet open={isOpen} onOpenChange={(open) => {
                setIsOpen(open)
                if (!open) setEditingEmployee(null)
            }}>
              <SheetTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Thêm nhân viên</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>{editingEmployee ? "Sửa nhân viên" : "Thêm nhân viên mới"}</SheetTitle>
                  <SheetDescription>
                    Nhập thông tin nhân viên vào form bên dưới.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4">
                  <EmployeeForm 
                    defaultValues={editingEmployee || undefined}
                    onSubmit={editingEmployee ? handleUpdate : handleCreate} 
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
