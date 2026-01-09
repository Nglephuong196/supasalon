"use client"

import { useState } from "react"
import { CategorySidebar, Category } from "@/components/resource/category-sidebar"
import { MobileCategorySelector } from "@/components/resource/mobile-category-selector"
import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { ServiceForm } from "./service-form"
import { ServiceFormValues } from "./schema"
import { 
  useServices, 
  useCreateService, 
  useUpdateService, 
  useDeleteService 
} from "@/lib/queries/services"
import { 
  useServiceCategories,
  useCreateServiceCategory,
  useUpdateServiceCategory,
  useDeleteServiceCategory
} from "@/lib/queries/service-categories"
import type { Service } from "@/lib/types/service"
import type { ServiceCategory } from "@/lib/types/service-category"

interface ServicesPageClientProps {
  initialServices: Service[]
  initialCategories: ServiceCategory[]
}

export function ServicesPageClient({ initialServices, initialCategories }: ServicesPageClientProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  
  // TanStack Query hooks - use initial data from server
  const { data: categories = initialCategories, isLoading: categoriesLoading } = useServiceCategories()
  const { data: services = initialServices, isLoading: servicesLoading } = useServices(selectedCategoryId || undefined)
  
  // Mutations
  const createService = useCreateService()
  const updateService = useUpdateService()
  const deleteService = useDeleteService()
  
  const createCategory = useCreateServiceCategory()
  const updateCategory = useUpdateServiceCategory()
  const deleteCategory = useDeleteServiceCategory()

  // Category Handlers
  const handleAddCategory = async (name: string) => {
    await createCategory.mutateAsync({ name })
  }

  const handleEditCategory = async (id: string, name: string) => {
    await updateCategory.mutateAsync({ id, name })
  }

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory.mutateAsync(id)
    if (selectedCategoryId === id) {
      setSelectedCategoryId(null)
    }
  }

  // Service Handlers
  const handleCreateService = async (data: ServiceFormValues) => {
    await createService.mutateAsync({
      name: data.name,
      price: data.price,
      duration: data.duration || null,
      category_id: data.category_id || null,
      description: data.description || null,
      image_url: data.image_url || null,
      is_active: data.is_active ?? true,
      allow_booking: data.allow_booking ?? false,
      show_on_app: data.show_on_app ?? false,
      extra_price_config: data.extra_price_config || [],
      attached_products_config: data.attached_products_config || [],
    })
    return true
  }

  const handleUpdateService = async (data: ServiceFormValues & { id?: string }) => {
    if (!data.id) return false
    await updateService.mutateAsync({
      id: data.id,
      name: data.name,
      price: data.price,
      duration: data.duration || null,
      category_id: data.category_id || null,
      description: data.description || null,
      image_url: data.image_url || null,
      is_active: data.is_active ?? true,
      allow_booking: data.allow_booking ?? false,
      show_on_app: data.show_on_app ?? false,
      extra_price_config: data.extra_price_config || [],
      attached_products_config: data.attached_products_config || [],
    })
    return true
  }

  const handleDeleteService = async (service: ServiceFormValues) => {
    if (!service.id) return
    await deleteService.mutateAsync(service.id)
  }

  // Map to ServiceFormValues for table
  const formattedServices: ServiceFormValues[] = services.map(s => ({
    id: s.id,
    name: s.name,
    price: s.price,
    duration: s.duration,
    category_id: s.category_id,
    is_active: s.is_active,
    allow_booking: s.allow_booking,
    show_on_app: s.show_on_app,
    description: s.description,
    image_url: s.image_url,
    extra_price_config: s.extra_price_config,
    attached_products_config: s.attached_products_config,
  }))

  // Map ServiceCategory to Category interface for sidebar
  const sidebarCategories: Category[] = categories.map(c => ({
    id: c.id,
    name: c.name
  }))

  const isLoading = categoriesLoading || servicesLoading

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Desktop Sidebar */}
      <CategorySidebar
        title="Danh mục dịch vụ"
        categories={sidebarCategories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onAdd={handleAddCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Mobile Category Selector */}
        <div className="p-4 md:hidden">
          <MobileCategorySelector
            title="Danh mục dịch vụ"
            categories={sidebarCategories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
        
        <ResourcePage<ServiceFormValues>
          key={selectedCategoryId || "all"} 
          title={selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || "Dịch vụ" : "Tất cả dịch vụ"}
          initialData={formattedServices}
          searchKey="name"
          addButtonLabel="Thêm dịch vụ"
          getColumns={getColumns}
          FormComponent={(props) => <ServiceForm {...props} categories={sidebarCategories} />}
          onAdd={handleCreateService}
          onEdit={handleUpdateService}
          onDelete={handleDeleteService}
          dialogTitle={(isEditing) => isEditing ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
          dialogDescription="Nhập thông tin dịch vụ vào form bên dưới."
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
