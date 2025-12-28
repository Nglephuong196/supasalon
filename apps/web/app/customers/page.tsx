"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, UserCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCustomersPaginated, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/lib/queries/customers"
import { Customer } from "@/lib/types/customer"
import { CustomerFormValues } from "./schema"
import { getColumns } from "./columns"
import { CustomerForm } from "./customer-form"
import { useState } from "react"
import { Plus, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"

interface StatCardProps {
  title: string
  value: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  icon: React.ElementType
  iconBgColor: string
  iconColor: string
}

function StatCard({ title, value, trend, trendValue, icon: Icon, iconBgColor, iconColor }: StatCardProps) {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{value}</span>
              {trend && trendValue && (
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend === "up" && "text-green-500",
                    trend === "down" && "text-red-500",
                    trend === "neutral" && "text-gray-500"
                  )}
                >
                  {trend === "up" && "↑"}
                  {trend === "down" && "↓"}
                  {trendValue}
                </span>
              )}
            </div>
          </div>
          <div className={cn("p-2.5 rounded-lg", iconBgColor)}>
            <Icon className={cn("h-5 w-5", iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CustomerStatsCards({ totalCustomers }: { totalCustomers: number }) {
  const returnRate = 75 // Mock: percentage of customers who return

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
      <StatCard
        title="Tổng khách hàng"
        value={totalCustomers.toString()}
        trend="up"
        trendValue="+8%"
        icon={Users}
        iconBgColor="bg-purple-100"
        iconColor="text-purple-600"
      />
      <StatCard
        title="Tỷ lệ quay lại"
        value={`${returnRate}%`}
        trend="up"
        trendValue="+3%"
        icon={UserCheck}
        iconBgColor="bg-green-100"
        iconColor="text-green-600"
      />
    </div>
  )
}

const PAGE_SIZE = 10

export default function CustomersPage() {
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  
  const { data: paginatedData, isLoading, error } = useCustomersPaginated(page, PAGE_SIZE, debouncedSearch)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  // Debounce search
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    // Simple debounce using setTimeout
    setTimeout(() => {
      setDebouncedSearch(value)
      setPage(1) // Reset to first page on search
    }, 300)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setIsDialogOpen(true)
  }

  const handleDelete = async (customer: Customer) => {
    if (confirm(`Bạn có chắc muốn xóa khách hàng "${customer.name}"?`)) {
      deleteCustomer.mutate(customer.id)
    }
  }

  const handleSubmit = async (data: CustomerFormValues) => {
    if (editingCustomer) {
      await updateCustomer.mutateAsync({
        id: editingCustomer.id,
        name: data.name,
        phone: data.phone,
        gender: data.gender || null,
        birthday: data.birthday || null,
        location: data.location || null,
      })
    } else {
      await createCustomer.mutateAsync({
        name: data.name,
        phone: data.phone,
        gender: data.gender || null,
        birthday: data.birthday || null,
        location: data.location || null,
      })
    }
    setIsDialogOpen(false)
    setEditingCustomer(null)
  }

  const columns = getColumns({ onEdit: handleEdit, onDelete: handleDelete })

  const customers = paginatedData?.data || []
  const total = paginatedData?.total || 0
  const totalPages = paginatedData?.totalPages || 1

  const table = useReactTable({
    data: customers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">Lỗi khi tải dữ liệu: {error.message}</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Khách hàng</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm khách hàng..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingCustomer(null)
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Thêm khách hàng
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Sửa khách hàng" : "Thêm khách hàng mới"}
                </DialogTitle>
                <DialogDescription>
                  Nhập thông tin khách hàng vào form bên dưới.
                </DialogDescription>
              </DialogHeader>
              <CustomerForm
                key={editingCustomer?.id || 'new'}
                defaultValues={editingCustomer ? {
                  id: editingCustomer.id,
                  name: editingCustomer.name,
                  phone: editingCustomer.phone || "",
                  gender: editingCustomer.gender || "",
                  birthday: editingCustomer.birthday,
                  location: editingCustomer.location,
                } : undefined}
                onSubmit={handleSubmit}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <CustomerStatsCards totalCustomers={total} />

      {/* Data Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="text-muted-foreground">Đang tải...</div>
        </div>
      ) : (
        <div>
          <div className="bg-white dark:bg-zinc-950">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
              Hiển thị {customers.length} / {total} kết quả
            </div>
            <div className="flex items-center space-x-2">
              <div className="text-sm text-muted-foreground">
                Trang {page} / {totalPages}
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(1)}
                  disabled={page <= 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(totalPages)}
                  disabled={page >= totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
