import { z } from "zod"
import type { Service, ServiceCategory } from "@repo/database"

// Re-export types from the shared package
export type { Service, ServiceCategory }

// Simple Zod schema for form validation messages
export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Tên dịch vụ không được để trống."),
  price: z.number().min(0, "Giá không hợp lệ."),
  duration: z.number().nullable().optional(),
  category_id: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  is_active: z.boolean().nullable().optional(),
  allow_booking: z.boolean().nullable().optional(),
  show_on_app: z.boolean().nullable().optional(),
  extra_price_config: z.any().nullable().optional(),
  attached_products_config: z.any().nullable().optional(),
})

export type ServiceFormValues = z.infer<typeof serviceSchema>

export interface ProductOption {
  id: string
  name: string
}
