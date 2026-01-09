import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { ServiceCategory, ServiceCategoryInsert, ServiceCategoryUpdate } from '@/lib/types/service-category'
import { toast } from 'sonner'

// TODO: Replace with new backend API calls

// Query keys
export const serviceCategoryKeys = {
  all: ['service-categories'] as const,
  list: () => [...serviceCategoryKeys.all, 'list'] as const,
  detail: (id: string) => [...serviceCategoryKeys.all, id] as const,
}

// Fetch all service categories
export function useServiceCategories() {
  return useQuery({
    queryKey: serviceCategoryKeys.list(),
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useServiceCategories: Not implemented - awaiting new backend')
      return [] as ServiceCategory[]
    },
    staleTime: 1000 * 60 * 5,
  })
}

// Fetch single service category
export function useServiceCategory(id: string) {
  return useQuery({
    queryKey: serviceCategoryKeys.detail(id),
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useServiceCategory: Not implemented - awaiting new backend')
      return null as ServiceCategory | null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Create service category
export function useCreateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: ServiceCategoryInsert) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang thêm danh mục...', { id: 'create-category' })
    },
    onSuccess: (data: ServiceCategory) => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success(`Đã thêm danh mục "${data.name}"`, { id: 'create-category' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-category' })
    },
  })
}

// Update service category
export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceCategoryUpdate & { id: string }) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang cập nhật...', { id: 'update-category' })
    },
    onSuccess: (data: ServiceCategory) => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success(`Đã cập nhật danh mục "${data.name}"`, { id: 'update-category' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'update-category' })
    },
  })
}

// Delete service category
export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang xóa...', { id: 'delete-category' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success('Đã xóa danh mục', { id: 'delete-category' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'delete-category' })
    },
  })
}
