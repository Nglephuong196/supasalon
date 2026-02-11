import { apiClient } from "@/lib/api";

export type ServiceCategory = {
  id: number;
  name: string;
};

export type ServiceItem = {
  id: number;
  name: string;
  categoryId: number;
  price: number;
  duration: number;
  description?: string | null;
};

export type ServiceCategoryPayload = {
  name: string;
};

export type ServicePayload = {
  name: string;
  categoryId: number;
  price: number;
  duration: number;
  description?: string;
};

export const servicesService = {
  listServices() {
    return apiClient.get<ServiceItem[]>("/services");
  },
  listCategories() {
    return apiClient.get<ServiceCategory[]>("/service-categories");
  },
  createCategory(payload: ServiceCategoryPayload) {
    return apiClient.post<ServiceCategory>("/service-categories", payload);
  },
  updateCategory(id: number, payload: ServiceCategoryPayload) {
    return apiClient.put<ServiceCategory>(`/service-categories/${id}`, payload);
  },
  deleteCategory(id: number) {
    return apiClient.delete<{ message: string }>(`/service-categories/${id}`);
  },
  createService(payload: ServicePayload) {
    return apiClient.post<ServiceItem>("/services", payload);
  },
  updateService(id: number, payload: Partial<ServicePayload>) {
    return apiClient.put<ServiceItem>(`/services/${id}`, payload);
  },
  deleteService(id: number) {
    return apiClient.delete<{ message: string }>(`/services/${id}`);
  },
};
