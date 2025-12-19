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
import { Product } from "./schema"
import { ResourceActions } from "@/components/resource/resource-page"

export const getColumns = ({ onEdit, onDelete }: ResourceActions<Product>): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Tên sản phẩm",
  },
  {
    accessorKey: "stock",
    header: "Tồn kho",
  },
  {
    accessorKey: "price",
    header: "Giá",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("price"))
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount)
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original

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
            <DropdownMenuItem onClick={() => onEdit(product)}>
              <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(product)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
