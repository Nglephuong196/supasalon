import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Service, ServiceInsert, ServiceUpdate } from '@/lib/types/service'
import { toast } from 'sonner'

const supabase = createClient()

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
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('services')
        .select('*', { count: 'exact' })
        .order('name', { ascending: true })
        .range(from, to)

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      if (search && search.trim()) {
        query = query.ilike('name', `%${search.trim()}%`)
      }

      const { data, error, count } = await query

      if (error) throw error

      const total = count || 0
      const totalPages = Math.ceil(total / pageSize)

      return {
        data: data as Service[],
        total,
        page,
        pageSize,
        totalPages,
      }
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch all services (optionally filtered by category)
export function useServices(categoryId?: string) {
  return useQuery({
    queryKey: serviceKeys.list(categoryId),
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true })

      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }

      const { data, error } = await query

      if (error) throw error
      return data as Service[]
    },
    staleTime: 1000 * 60 * 2,
  })
}

// Fetch single service
export function useService(id: string) {
  return useQuery({
    queryKey: serviceKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Service
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Create service with optimistic updates
export function useCreateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (service: ServiceInsert) => {
      const { data, error } = await supabase
        .from('services')
        .insert(service)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: serviceKeys.all })
      toast.loading('Đang thêm dịch vụ...', { id: 'create-service' })
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(`Đã thêm dịch vụ "${data.name}"`, { id: 'create-service' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-service' })
    },
  })
}

// Update service with optimistic updates
export function useUpdateService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: serviceKeys.detail(variables.id) })
      
      const previousService = queryClient.getQueryData<Service>(serviceKeys.detail(variables.id))
      
      if (previousService) {
        queryClient.setQueryData<Service>(serviceKeys.detail(variables.id), {
          ...previousService,
          ...variables,
        })
      }
      
      toast.loading('Đang cập nhật...', { id: 'update-service' })
      return { previousService }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Service>(serviceKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(`Đã cập nhật dịch vụ "${data.name}"`, { id: 'update-service' })
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousService) {
        queryClient.setQueryData<Service>(
          serviceKeys.detail(variables.id),
          context.previousService
        )
      }
      toast.error(`Lỗi: ${error.message}`, { id: 'update-service' })
    },
  })
}

// Delete service
export function useDeleteService() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: serviceKeys.all })
      
      toast.loading('Đang xóa...', { id: 'delete-service' })
      return { id }
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
      const { data, error } = await supabase
        .from('services')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Service
    },
    onSuccess: (data) => {
      queryClient.setQueryData<Service>(serviceKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: serviceKeys.all })
      toast.success(data.is_active ? 'Đã bật dịch vụ' : 'Đã tắt dịch vụ')
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`)
    },
  })
}
