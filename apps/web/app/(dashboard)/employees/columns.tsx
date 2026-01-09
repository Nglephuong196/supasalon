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
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "lucide-react"
import type { Employee, EmployeeGroup } from "@/lib/types/employee"
import { ResourceActions } from "@/components/resource/resource-page"

interface GetColumnsProps extends ResourceActions<Employee> {
  groups: EmployeeGroup[]
}

export const getColumns = ({ onEdit, onDelete, groups }: GetColumnsProps): ColumnDef<Employee>[] => [
  {
    accessorKey: "name",
    header: "Nhân viên",
    cell: ({ row }) => {
      const employee = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src={employee.avatar_url || undefined} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{employee.name}</div>
            {employee.phone && (
              <div className="text-sm text-muted-foreground">{employee.phone}</div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "group_id",
    header: "Nhóm",
    cell: ({ row }) => {
      const groupId = row.original.group_id
      const group = groups.find(g => g.id === groupId)
      return group?.name || "-"
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge variant={status === "active" ? "default" : "secondary"}>
          {status === "active" ? "Đang hoạt động" : "Ngừng hoạt động"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "allow_booking",
    header: "Đặt lịch",
    cell: ({ row }) => (
      <span className={row.original.allow_booking ? "text-green-600" : "text-muted-foreground"}>
        {row.original.allow_booking ? "Có" : "Không"}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const employee = row.original
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
            <DropdownMenuItem onClick={() => onEdit(employee)}>
              <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(employee)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
