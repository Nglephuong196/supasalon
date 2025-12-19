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
import { Booking } from "./schema"

import { ResourceActions } from "@/components/resource/resource-page"

export const getColumns = ({ onEdit, onDelete }: ResourceActions<Booking>): ColumnDef<Booking>[] => [
  {
    accessorKey: "date",
    header: "Ngày",
    cell: ({ row }) => format(row.getValue("date"), "dd/MM/yyyy"),
  },
  {
    accessorKey: "time",
    header: "Giờ",
  },
  {
    accessorKey: "customerName",
    header: "Khách hàng",
  },
  {
    accessorKey: "service",
    header: "Dịch vụ",
  },
  {
    accessorKey: "staffName",
    header: "Nhân viên",
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
        const status = row.original.status
        return (
            <Badge 
                variant={status === "Confirmed" ? "default" : status === "Completed" ? "secondary" : status === "Pending" ? "outline" : "destructive"}
                className={
                    status === "Confirmed" ? "bg-blue-500 hover:bg-blue-600" :
                    status === "Completed" ? "bg-green-500 hover:bg-green-600 text-white" :
                    status === "Pending" ? "bg-yellow-500 hover:bg-yellow-600 text-white border-0" :
                    ""
                }
            >
                {status === "Confirmed" ? "Đã xác nhận" :
                 status === "Completed" ? "Hoàn thành" :
                 status === "Pending" ? "Chờ duyệt" : "Đã hủy"}
            </Badge>
        )
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const booking = row.original

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
            <DropdownMenuItem onClick={() => onEdit(booking)}>
                <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(booking)} className="text-red-600">
                <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
