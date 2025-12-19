"use client"

import { useState } from "react"
import { CategorySidebar, Category } from "@/components/resource/category-sidebar"
import { ResourcePage } from "@/components/resource/resource-page"
import { getColumns } from "./columns"
import { ProductForm } from "./product-form"
import { Product } from "./schema"

// Mock Data
const initialCategories: Category[] = [
  { id: "cat1", name: "Dầu gội" },
  { id: "cat2", name: "Dưỡng tóc" },
  { id: "cat3", name: "Màu nhuộm" },
]

const initialProducts: Product[] = [
  { id: "1", name: "Dầu gội Biotin", price: 250000, stock: 10, categoryId: "cat1" },
  { id: "2", name: "Dầu dưỡng Tsubaki", price: 300000, stock: 5, categoryId: "cat2" },
]

export default function ProductsPage() {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>(initialProducts)

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

  const filteredProducts = selectedCategoryId 
    ? products.filter(p => p.categoryId === selectedCategoryId)
    : products

  return (
    <div className="flex h-full">
      <CategorySidebar
        title="Danh mục sản phẩm"
        categories={categories}
        selectedId={selectedCategoryId}
        onSelect={setSelectedCategoryId}
        onAdd={handleAddCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />
      <div className="flex-1 overflow-hidden">
        <ResourcePage<Product>
          key={selectedCategoryId || "all"} 
          title={selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name || "Sản phẩm" : "Tất cả sản phẩm"}
          initialData={filteredProducts}
          searchKey="name"
          addButtonLabel="Thêm sản phẩm"
          getColumns={getColumns}
          FormComponent={(props) => <ProductForm {...props} categories={categories} />}
          dialogTitle={(isEditing) => isEditing ? "Sửa sản phẩm" : "Thêm sản phẩm mới"}
          dialogDescription="Nhập thông tin sản phẩm vào form bên dưới."
        />
      </div>
    </div>
  )
}
