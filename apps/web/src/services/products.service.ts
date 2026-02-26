import { apiClient } from "@/lib/api";

export type ProductCategory = {
  id: number;
  name: string;
};

export type ProductItem = {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  stock: number;
  minStock: number;
  sku?: string | null;
  description?: string | null;
};

export type ProductCategoryPayload = {
  name: string;
};

export type ProductPayload = {
  name: string;
  categoryId: number;
  price: number;
  stock: number;
  minStock: number;
  sku?: string | null;
  description?: string;
};

export const productsService = {
  listProducts() {
    return apiClient.get<ProductItem[]>("/products");
  },
  listCategories() {
    return apiClient.get<ProductCategory[]>("/product-categories");
  },
  createCategory(payload: ProductCategoryPayload) {
    return apiClient.post<ProductCategory>("/product-categories", payload);
  },
  updateCategory(id: number, payload: ProductCategoryPayload) {
    return apiClient.put<ProductCategory>(`/product-categories/${id}`, payload);
  },
  deleteCategory(id: number) {
    return apiClient.delete<{ message: string }>(`/product-categories/${id}`);
  },
  createProduct(payload: ProductPayload) {
    return apiClient.post<ProductItem>("/products", payload);
  },
  updateProduct(id: number, payload: Partial<ProductPayload>) {
    return apiClient.put<ProductItem>(`/products/${id}`, payload);
  },
  deleteProduct(id: number) {
    return apiClient.delete<{ message: string }>(`/products/${id}`);
  },
};
