"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Customer } from "@/lib/types/customer"
import { ResourceActions } from "@/components/resource/resource-page"

export const getColumns = ({ onEdit, onDelete }: ResourceActions<Customer>): ColumnDef<Customer>[] => [
  {
    accessorKey: "name",
    header: "Tên khách hàng",
  },
  {
    accessorKey: "phone",
    header: "Số điện thoại",
    cell: ({ row }) => {
      const phone = row.getValue("phone") as string | null
      return phone || <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "gender",
    header: "Giới tính",
    cell: ({ row }) => {
      const gender = row.getValue("gender") as string | null
      return gender || <span className="text-muted-foreground">—</span>
    },
  },
  {
    accessorKey: "birthday",
    header: "Ngày sinh",
    cell: ({ row }) => {
      const birthday = row.getValue("birthday") as string | null
      if (!birthday) return <span className="text-muted-foreground">—</span>
      return new Date(birthday).toLocaleDateString("vi-VN")
    },
  },
  {
    accessorKey: "location",
    header: "Địa chỉ",
    cell: ({ row }) => {
      const location = row.getValue("location") as string | null
      return location || <span className="text-muted-foreground">—</span>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Mở menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(customer)}>
              <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(customer)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
