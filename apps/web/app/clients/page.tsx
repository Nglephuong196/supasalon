"use client"

import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { ClientForm } from "./client-form"
import { Client } from "./schema"

// Mock data
const initialData: Client[] = [
  { id: "1", name: "Nguyễn Văn A", phone: "0901234567", email: "a@gmail.com" },
  { id: "2", name: "Trần Thị B", phone: "0912345678", email: "b@gmail.com" },
]

export default function ClientsPage() {
  return (
    <ResourcePage<Client>
      title="Khách hàng"
      initialData={initialData}
      searchKey="name"
      addButtonLabel="Thêm khách hàng"
      getColumns={getColumns}
      FormComponent={ClientForm}
      dialogTitle={(isEditing) => isEditing ? "Sửa khách hàng" : "Thêm khách hàng mới"}
      dialogDescription="Nhập thông tin khách hàng vào form bên dưới."
    />
  )
}
