"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import { DateRange } from "react-day-picker"
import { isWithinInterval, startOfDay, endOfDay, addDays, subDays } from "date-fns"

import { DataTable } from "@/components/ui/data-table"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"

export interface ResourceActions<T> {
  onEdit: (item: T) => void
  onDelete: (item: T) => void
}

interface ResourcePageProps<T> {
  title: string
  initialData: T[]
  searchKey: string
  addButtonLabel: string
  getColumns: (actions: ResourceActions<T>) => ColumnDef<T>[]
  FormComponent: React.ComponentType<{
    defaultValues?: T
    onSubmit: (data: T) => void
  }>
  dialogTitle?: (isEditing: boolean) => string
  dialogDescription?: string
  dateFilterField?: keyof T
  statsCards?: React.ReactNode
}

export function ResourcePage<T extends { id?: string }>({
  title,
  initialData,
  searchKey,
  addButtonLabel,
  getColumns,
  FormComponent,
  dialogTitle,
  dialogDescription = "Nhập thông tin vào form bên dưới.",
  dateFilterField,
  statsCards,
}: ResourcePageProps<T>) {
  const [data, setData] = useState<T[]>(initialData)
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<T | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (dateFilterField) {
      return { from: new Date(), to: new Date() }
    }
    return undefined
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [quickFilter, setQuickFilter] = useState("today")

  // Update dateRange when quickFilter changes
  const handleQuickFilterChange = (value: string) => {
    setQuickFilter(value)
    const today = new Date()
    
    switch (value) {
      case "today":
        setDateRange({ from: today, to: today })
        break
      case "tomorrow":
        const tomorrow = addDays(today, 1)
        setDateRange({ from: tomorrow, to: tomorrow })
        break
      case "yesterday":
        const yesterday = subDays(today, 1)
        setDateRange({ from: yesterday, to: yesterday })
        break
      case "all":
        setDateRange(undefined)
        break
      default:
        break
    }
  }

  // Auto-update quick filter select if dateRange changes manually (optional polish)
  useEffect(() => {
    // If user manually picks a range that matches a preset, we could update select
    // For now, let's just set it to 'custom' or empty if it doesn't match, 
    // but the prompt didn't strictly ask for bi-directional sync complexity. 
    // We'll keep it simple: Changing DatePicker doesn't reset Select to "Custom" visual 
    // but the functionality works.
  }, [dateRange])


  const handleCreate = (newItem: T) => {
    // Generate a random ID if not provided (mock behavior)
    // In a real app, the backend would assign the ID
    const itemWithId = { ...newItem, id: Math.random().toString() }
    setData([...data, itemWithId])
    setIsOpen(false)
  }

  const handleUpdate = (updatedItem: T) => {
    setData(data.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setIsOpen(false)
    setEditingItem(null)
  }

  const handleDelete = (itemToDelete: T) => {
    if (confirm("Bạn có chắc chắn muốn xóa mục này?")) {
      setData(data.filter((item) => item.id !== itemToDelete.id))
    }
  }

  const handleEdit = (item: T) => {
    setEditingItem(item)
    setIsOpen(true)
  }

  const columns = getColumns({ onEdit: handleEdit, onDelete: handleDelete })

  // Filter Data
  const filteredData = data.filter((item) => {
    // 1. Date Filter
    if (dateFilterField && dateRange && dateRange.from) {
      const itemDate = item[dateFilterField] as unknown as Date
      if (itemDate instanceof Date) {
        const start = startOfDay(dateRange.from)
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from)
        if (!isWithinInterval(itemDate, { start, end })) return false
      }
    }

    // 2. Search Filter
    if (searchQuery && searchKey) {
      const value = item[searchKey as keyof T]
      const stringValue = String(value).toLowerCase()
      if (!stringValue.includes(searchQuery.toLowerCase())) return false
    }

    return true
  })

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Page Title */}
      <div className="px-6 pt-6 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>

      {/* Stats Cards (optional) */}
      {statsCards && (
        <div className="px-6 pb-4">
          {statsCards}
        </div>
      )}

      {/* Filters & Add Button Row */}
      <div className="flex flex-col items-start justify-between gap-4 px-6 pb-6 sm:flex-row sm:items-center border-b border-gray-100 dark:border-zinc-800">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative w-full sm:w-[250px] lg:w-[300px]">
                <Input
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 rounded-lg bg-gray-50/50 pl-9 dark:bg-zinc-900/50"
                />
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-search absolute top-2.5 left-2.5 h-5 w-5 text-muted-foreground"
                >
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.3-4.3"></path>
                </svg>
            </div>

            {/* Date Filter & Quick Filter (condensed if possible or kept as is) */}
            {dateFilterField && (
                <>
                  <Select value={quickFilter} onValueChange={handleQuickFilterChange}>
                    <SelectTrigger className="h-10 w-full rounded-lg bg-gray-50/50 sm:w-[140px] dark:bg-zinc-900/50">
                      <SelectValue placeholder="All Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="tomorrow">Ngày mai</SelectItem>
                      <SelectItem value="yesterday">Hôm qua</SelectItem>
                      <SelectItem value="all">Tất cả thời gian</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="hidden sm:block">
                     <DatePickerWithRange date={dateRange} setDate={setDateRange} className="w-[240px]" />
                  </div>
                </>
            )}
        </div>

        {/* Add Button */}
        <Dialog
        open={isOpen}
        onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) setEditingItem(null)
        }}
        >
        <DialogTrigger asChild>
            <Button className="h-10 rounded-lg px-4" size="default">
            <Plus className="mr-2 h-4 w-4" /> {addButtonLabel}
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
            <DialogTitle>
                {dialogTitle
                ? dialogTitle(!!editingItem)
                : editingItem
                ? `Cập nhật ${title}`
                : `Tạo ${title}`}
            </DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
            <FormComponent
                defaultValues={editingItem || undefined}
                onSubmit={editingItem ? handleUpdate : handleCreate}
            />
            </div>
        </DialogContent>
        </Dialog>
      </div>
      
      {/* Table Content */}
      <div className="px-6 pb-6">
         <DataTable columns={columns} data={filteredData} />
      </div>
    </div>
  )
}
