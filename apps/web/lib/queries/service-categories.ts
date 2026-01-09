import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { ServiceCategory, ServiceCategoryInsert, ServiceCategoryUpdate } from '@/lib/types/service-category'
import { toast } from 'sonner'

const supabase = createClient()

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
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as ServiceCategory[]
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Fetch single service category
export function useServiceCategory(id: string) {
  return useQuery({
    queryKey: serviceCategoryKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_categories')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ServiceCategory
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

// Create service category with optimistic updates
export function useCreateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (category: ServiceCategoryInsert) => {
      const { data, error } = await supabase
        .from('service_categories')
        .insert(category)
        .select()
        .single()

      if (error) throw error
      return data as ServiceCategory
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: serviceCategoryKeys.all })
      toast.loading('Đang thêm danh mục...', { id: 'create-category' })
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ServiceCategory[]>(serviceCategoryKeys.list(), (old) => 
        old ? [...old, data].sort((a, b) => a.name.localeCompare(b.name)) : [data]
      )
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success(`Đã thêm danh mục "${data.name}"`, { id: 'create-category' })
    },
    onError: (error: Error) => {
      toast.error(`Lỗi: ${error.message}`, { id: 'create-category' })
    },
  })
}

// Update service category with optimistic updates
export function useUpdateServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: ServiceCategoryUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('service_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ServiceCategory
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: serviceCategoryKeys.detail(variables.id) })
      
      const previousCategory = queryClient.getQueryData<ServiceCategory>(
        serviceCategoryKeys.detail(variables.id)
      )
      
      if (previousCategory) {
        queryClient.setQueryData<ServiceCategory>(serviceCategoryKeys.detail(variables.id), {
          ...previousCategory,
          ...variables,
        })
      }
      
      toast.loading('Đang cập nhật...', { id: 'update-category' })
      return { previousCategory }
    },
    onSuccess: (data) => {
      queryClient.setQueryData<ServiceCategory>(serviceCategoryKeys.detail(data.id), data)
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success(`Đã cập nhật danh mục "${data.name}"`, { id: 'update-category' })
    },
    onError: (error: Error, variables, context) => {
      if (context?.previousCategory) {
        queryClient.setQueryData<ServiceCategory>(
          serviceCategoryKeys.detail(variables.id),
          context.previousCategory
        )
      }
      toast.error(`Lỗi: ${error.message}`, { id: 'update-category' })
    },
  })
}

// Delete service category
export function useDeleteServiceCategory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('service_categories')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: serviceCategoryKeys.all })
      
      const previousCategories = queryClient.getQueryData<ServiceCategory[]>(serviceCategoryKeys.list())
      
      queryClient.setQueryData<ServiceCategory[]>(serviceCategoryKeys.list(), (old) => 
        old?.filter(c => c.id !== id) ?? []
      )
      
      toast.loading('Đang xóa...', { id: 'delete-category' })
      return { previousCategories }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: serviceCategoryKeys.all })
      toast.success('Đã xóa danh mục', { id: 'delete-category' })
    },
    onError: (error: Error, _id, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData<ServiceCategory[]>(serviceCategoryKeys.list(), context.previousCategories)
      }
      toast.error(`Lỗi: ${error.message}`, { id: 'delete-category' })
    },
  })
}
