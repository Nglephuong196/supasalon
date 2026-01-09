import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Service, ServiceInsert, ServiceUpdate } from '@/lib/types/service'
import { toast } from 'sonner'

// TODO: Replace with new backend API calls

// Query keys
export const serviceKeys = {
  all: ['services'] as const,
  list: (categoryId?: string) => [...serviceKeys.all, 'list', { categoryId }] as const,
  paginated: (page: number, pageSize: number, categoryId?: string, search?: string) => 
    [...serviceKeys.all, 'paginated', { page, pageSize, categoryId, search }] as const,
  detail: (id: string) => [...serviceKeys.all, id] as const,
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Fetch paginated services
export function useServicesPaginated(
  page: number = 1, 
  pageSize: number = 10, 
  categoryId?: string,
  search?: string
) {
  return useQuery({
    queryKey: serviceKeys.paginated(page, pageSize, categoryId, search),
    queryFn: async (): Promise<PaginatedResponse<Service>> => {
      // TODO: Implement with new backend
      console.warn('useServicesPaginated: Not implemented - awaiting new backend')
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch all services
export function useServices(categoryId?: string) {
  return useQuery({
    queryKey: serviceKeys.list(categoryId),
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useServices: Not implemented - awaiting new backend')
      return [] as Service[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch single service
export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useService: Not implemented - awaiting new backend')
      return null as Service | null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Create service
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (service: ServiceInsert) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang thêm dịch vụ...', { id: 'create-service' })
    },
    onSuccess: (data: Service) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(`Đã thêm dịch vụ "${data.name}"`, { id: 'create-service' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-service' })
    },
  })
}

// Update service
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceUpdate & { id: string }) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang cập nhật...', { id: 'update-service' })
    },
    onSuccess: (data: Service) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(`Đã cập nhật dịch vụ "${data.name}"`, { id: 'update-service' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'update-service' })
    },
  })
}

// Delete service
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang xóa...', { id: 'delete-service' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success('Đã xóa dịch vụ', { id: 'delete-service' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'delete-service' })
    },
  })
}

// Toggle service active status
export function useToggleServiceActive() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onSuccess: (data: Service) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(data.is_active ? 'Đã bật dịch vụ' : 'Đã tắt dịch vụ')
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}
