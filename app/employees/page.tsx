"use client"

import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { EmployeeForm } from "./employee-form"
import { Employee } from "./schema"

// Mock data
const initialData: Employee[] = [
  { id: "1", name: "Lê Văn C", role: "Stylist chính", phone: "0909998887", status: "Active" },
  { id: "2", name: "Nguyễn Thị D", role: "Thợ phụ", phone: "0918887776", status: "Active" },
]

export default function EmployeesPage() {
  return (
    <ResourcePage<Employee>
      title="Nhân viên"
      initialData={initialData}
      searchKey="name"
      addButtonLabel="Thêm nhân viên"
      getColumns={getColumns}
      FormComponent={EmployeeForm}
      dialogTitle={(isEditing) => isEditing ? "Sửa nhân viên" : "Thêm nhân viên mới"}
      dialogDescription="Nhập thông tin nhân viên vào form bên dưới."
    />
  )
}
