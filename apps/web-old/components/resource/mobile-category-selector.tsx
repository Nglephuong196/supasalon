"use client"

import { useState } from "react"
import { Plus, ChevronDown, Pencil, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface Category {
  id: string
  name: string
}

interface MobileCategorySelectorProps {
  title: string
  categories: Category[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAdd: (name: string) => void
  onEdit: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export function MobileCategorySelector({
  title,
  categories,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: MobileCategorySelectorProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [nameInput, setNameInput] = useState("")

  const selectedCategory = categories.find((c) => c.id === selectedId)

  const openAdd = () => {
    setEditingCategory(null)
    setNameInput("")
    setIsDialogOpen(true)
  }

  const openEdit = (category: Category) => {
    setEditingCategory(category)
    setNameInput(category.name)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
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

  const handleSelect = (id: string | null) => {
    onSelect(id)
    setIsSheetOpen(false)
  }

  return (
    <div className="md:hidden">
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span>{selectedCategory?.name || "Tất cả danh mục"}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[70vh]">
          <SheetHeader className="pb-2">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>
          <div className="flex items-center justify-between py-2 border-b mb-2">
            <span className="text-sm text-muted-foreground">Chọn danh mục</span>
            <Button variant="outline" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Thêm mới
            </Button>
          </div>
          <div className="space-y-2 overflow-y-auto">
            <Button
              variant={selectedId === null ? "secondary" : "ghost"}
              className="w-full justify-start font-normal"
              onClick={() => handleSelect(null)}
            >
              Tất cả
            </Button>
            {categories.map((category) => (
              <div
                key={category.id}
                className={cn(
                  "flex items-center w-full rounded-md px-3 py-2 text-sm",
                  selectedId === category.id && "bg-secondary"
                )}
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => handleSelect(category.id)}
                >
                  {category.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => openEdit(category)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500"
                  onClick={() => handleDelete(category.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Sửa danh mục" : "Thêm danh mục"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Cập nhật tên danh mục."
                : "Tạo danh mục mới để phân loại."}
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
