"use client"

import { ResourcePage, ResourceActions } from "@/components/resource/resource-page"
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
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory,
} from "@/lib/queries/service-categories"
import type { ServiceCategory } from "@/lib/types/service-category"

const categorySchema = z.object({
  name: z.string().min(1, "Tên danh mục không được để trống"),
})

type CategoryFormValues = z.infer<typeof categorySchema>

interface ServiceCategoriesPageClientProps {
  initialData: ServiceCategory[]
}

// Columns
const getColumns = ({ onEdit, onDelete }: ResourceActions<ServiceCategory>): ColumnDef<ServiceCategory>[] => [
  {
    accessorKey: "name",
    header: "Tên danh mục",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original
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
            <DropdownMenuItem onClick={() => onEdit(category)}>
              <Pencil className="mr-2 h-4 w-4" /> Sửa
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(category)} className="text-red-600">
              <Trash className="mr-2 h-4 w-4" /> Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// Form Component
function CategoryForm({ defaultValues, onSubmit }: { defaultValues?: { name: string; id?: string }, onSubmit: (data: CategoryFormValues & { id?: string }) => void }) {
  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues || { name: "" },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => onSubmit({ ...data, id: defaultValues?.id }))} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên danh mục</FormLabel>
              <FormControl>
                <Input placeholder="Tên danh mục" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
             <Button type="submit">Lưu</Button>
        </div>
      </form>
    </Form>
  )
}

export function ServiceCategoriesPageClient({ initialData }: ServiceCategoriesPageClientProps) {
  // TanStack Query hooks - use initial data from server
  const { data: categories = initialData, isLoading } = useServiceCategories()
  const createCategory = useCreateServiceCategory()
  const updateCategory = useUpdateServiceCategory()
  const deleteCategory = useDeleteServiceCategory()

  const handleCreate = async (data: CategoryFormValues) => {
    await createCategory.mutateAsync({ name: data.name })
    return true
  }

  const handleUpdate = async (data: CategoryFormValues & { id?: string }) => {
    if (!data.id) return false
    await updateCategory.mutateAsync({ id: data.id, name: data.name })
    return true
  }

  const handleDelete = async (category: CategoryFormValues & { id?: string }) => {
    if (!category.id) return
    await deleteCategory.mutateAsync(category.id)
  }

  // Map to form-compatible type
  const formattedCategories = categories.map(c => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="p-6">
      <ResourcePage<CategoryFormValues & { id?: string }>
        title="Danh mục dịch vụ"
        initialData={formattedCategories}
        searchKey="name"
        addButtonLabel="Thêm danh mục"
        getColumns={getColumns as any}
        FormComponent={(props) => <CategoryForm {...props} />}
        onAdd={handleCreate}
        onEdit={handleUpdate}
        onDelete={handleDelete}
        dialogTitle={(isEditing) => isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
        dialogDescription="Nhập tên danh mục dịch vụ."
        isLoading={isLoading}
      />
    </div>
  )
}
