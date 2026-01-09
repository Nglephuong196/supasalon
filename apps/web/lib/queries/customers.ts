import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Customer, CustomerInsert, CustomerUpdate } from '@/lib/types/customer'
import { toast } from 'sonner'

// TODO: Replace with new backend API calls

// Query keys
export const customerKeys = {
  all: ['customers'] as const,
  list: (page: number, pageSize: number, search?: string) => [...customerKeys.all, 'list', { page, pageSize, search }] as const,
  count: (search?: string) => [...customerKeys.all, 'count', { search }] as const,
  detail: (id: number) => [...customerKeys.all, id] as const,
}

// Paginated response type
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Fetch paginated customers
export function useCustomersPaginated(page: number = 1, pageSize: number = 10, search?: string) {
  return useQuery({
    queryKey: customerKeys.list(page, pageSize, search),
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      // TODO: Implement with new backend
      console.warn('useCustomersPaginated: Not implemented - awaiting new backend')
      return { data: [], total: 0, page, pageSize, totalPages: 0 }
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch all customers
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.all,
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useCustomers: Not implemented - awaiting new backend')
      return [] as Customer[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch single customer
export function useCustomer(id: number) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      // TODO: Implement with new backend
      console.warn('useCustomer: Not implemented - awaiting new backend')
      return null as Customer | null
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Create customer
export function useCreateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang thêm khách hàng...', { id: 'create-customer' })
    },
    onSuccess: (data: Customer) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      toast.success(`Đã thêm khách hàng "${data.name}"`, { id: 'create-customer' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-customer' })
    },
  })
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: number }) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang cập nhật...', { id: 'update-customer' })
    },
    onSuccess: (data: Customer) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      toast.success(`Đã cập nhật khách hàng "${data.name}"`, { id: 'update-customer' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'update-customer' })
    },
  })
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      // TODO: Implement with new backend
      throw new Error('Not implemented - awaiting new backend')
    },
    onMutate: async () => {
      toast.loading('Đang xóa...', { id: 'delete-customer' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      toast.success('Đã xóa khách hàng', { id: 'delete-customer' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'delete-customer' })
    },
  })
}
