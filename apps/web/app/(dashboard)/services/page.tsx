"use client"

import { useState } from "react"
import { CategorySidebar, Category } from "@/components/resource/category-sidebar"
import { MobileCategorySelector } from "@/components/resource/mobile-category-selector"
import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { ServiceForm } from "./service-form"
import { Service } from "./schema"

// Mock Data
const initialCategories: Category[] = [
  { id: "cat1", name: "Cắt tóc" },
  { id: "cat2", name: "Gội đầu" },
  { id: "cat3", name: "Nhuộm" },
]

const initialServices: Service[] = [
  { id: "1", name: "Cắt tóc nam", price: 100000, duration: 30, categoryId: "cat1" },
  { id: "2", name: "Cắt tóc nữ", price: 150000, duration: 45, categoryId: "cat1" },
  { id: "3", name: "Gội đầu thư giãn", price: 50000, duration: 30, categoryId: "cat2" },
]

export default function ServicesPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [services, setServices] = useState<Service[]>(initialServices)

  // Category Handlers
  const handleAddCategory = (name: string) => {
    setCategories([...categories, { id: Math.random().toString(), name }])
  }

  const handleEditCategory = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c))
  }

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id))
    if (selectedCategoryId === id) setSelectedCategoryId(null)
  }

  // Filter Handling:
  // Note: ResourcePage manages its own generic state, but we need to provide the *filtered* data initially.
  // Ideally, ResourcePage should react to props changes. Since we set it up with simple `useState(initialData)`, 
  // we might need to key it to force re-render when category changes, OR refactor ResourcePage to respect prop updates.
  // The simplest "React way" to reset child state is changing the 'key' prop.
  
  const filteredServices = selectedCategoryId 
    ? services.filter(s => s.categoryId === selectedCategoryId)
    : services

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Desktop Sidebar */}
      <CategorySidebar
        title="Danh mục dịch vụ"
        categories={categories}
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
            categories={categories}
            selectedId={selectedCategoryId}
            onSelect={setSelectedCategoryId}
            onAdd={handleAddCategory}
            onEdit={handleEditCategory}
            onDelete={handleDeleteCategory}
          />
        </div>
        
        {/* We use key to force a fresh instance of ResourcePage when category changes, 
            so it picks up the new 'initialData'. 
            ALSO, we need to pass a wrapped Form component that has access to 'categories' for the dropdown. */}
        <ResourcePage<Service>
          key={selectedCategoryId || "all"} 
          title={selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || "Dịch vụ" : "Tất cả dịch vụ"}
          initialData={filteredServices}
          searchKey="name"
          addButtonLabel="Thêm dịch vụ"
          getColumns={getColumns}
          FormComponent={(props) => <ServiceForm {...props} categories={categories} />}
          dialogTitle={(isEditing) => isEditing ? "Sửa dịch vụ" : "Thêm dịch vụ mới"}
          dialogDescription="Nhập thông tin dịch vụ vào form bên dưới."
        />
      </div>
    </div>
  )
}
