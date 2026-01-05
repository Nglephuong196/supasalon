"use client"

import { useState } from "react"
import { Plus, MoreHorizontal, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface Category {
  id: string
  name: string
}

interface CategorySidebarProps {
  title: string
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (name: string) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function CategorySidebar({
  title,
  categories,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: CategorySidebarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [nameInput, setNameInput] = useState("")

  const openAdd = () => {
    setEditingCategory(null)
    setNameInput("")
    setIsDialogOpen(true)
  }

  const openEdit = (category: Category, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent selecting the category when clicking edit
    setEditingCategory(category)
    setNameInput(category.name)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm("Bạn có chắc muốn xóa danh mục này?")) {
      onDelete(id)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return

    if (editingCategory) {
      onEdit(editingCategory.id, nameInput)
    } else {
      onAdd(nameInput)
    }
    setIsDialogOpen(false)
  }

  return (
    <div className="w-64 border-r h-full hidden md:flex flex-col bg-background">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-lg">{title}</h2>
        <Button variant="ghost" size="icon" onClick={openAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <Button
          variant={selectedId === null ? "secondary" : "ghost"}
          className="w-full justify-start font-normal"
          onClick={() => onSelect(null)}
        >
          Tất cả
        </Button>
        {categories.map((category) => (
          <div
            key={category.id}
            className={cn(
              "flex items-center group w-full rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
              selectedId === category.id && "bg-secondary text-secondary-foreground"
            )}
            onClick={() => onSelect(category.id)}
          >
            <span className="flex-1 truncate">{category.name}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => openEdit(category, e)}>
                  <Pencil className="mr-2 h-4 w-4" /> Sửa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => handleDelete(category.id, e)} className="text-red-600">
                  <Trash className="mr-2 h-4 w-4" /> Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Sửa danh mục" : "Thêm danh mục"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? "Cập nhật tên danh mục." : "Tạo danh mục mới để phân loại."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Tên
                </Label>
                <Input
                  id="name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="col-span-3"
                  autoFocus
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Lưu thay đổi</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
