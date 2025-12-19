"use client"

import { ColumnDef } from "@tanstack/react-table"
import { format } from "date-fns"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Invoice } from "./schema"

interface InvoiceColumnsProps {
    onEdit: (invoice: Invoice) => void
    onDelete: (invoice: Invoice) => void
}

export const getColumns = ({ onEdit, onDelete }: InvoiceColumnsProps): ColumnDef<Invoice>[] => [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => format(row.getValue("date"), "dd/MM/yyyy"),
  },
  {
    accessorKey: "customerName",
    header: "Khách hàng",
    cell: ({ row }) => row.original.customerName || row.original.customerId,
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      const formatted = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
      return <div className="font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
        const status = row.original.status
        return (
            <Badge variant={status === "Paid" ? "default" : status === "Unpaid" ? "outline" : "destructive"}>
                {status === "Paid" ? "Đã thanh toán" : status === "Unpaid" ? "Chưa thanh toán" : "Đã hủy"}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const invoice = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(invoice)}>
                <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(invoice)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
