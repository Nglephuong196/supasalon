"use client"

import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { InvoiceForm } from "./invoice-form"
import { Invoice } from "./schema"

// Mock data
const initialData: Invoice[] = [
  { id: "1", customerId: "1", customerName: "Nguyễn Văn A", amount: 150000, status: "Paid", date: new Date() },
  { id: "2", customerId: "2", customerName: "Trần Thị B", amount: 500000, status: "Unpaid", date: new Date() },
]

export default function InvoicesPage() {
  return (
    <ResourcePage<Invoice>
      title="Hóa đơn"
      initialData={initialData}
      searchKey="customerName"
      addButtonLabel="Tạo hóa đơn"
      getColumns={getColumns}
      FormComponent={InvoiceForm}
      dialogTitle={(isEditing) => isEditing ? "Sửa hóa đơn" : "Tạo hóa đơn mới"}
      dialogDescription="Nhập thông tin hóa đơn vào form bên dưới."
      dateFilterField="date"
    />
  )
}
