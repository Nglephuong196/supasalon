import { z } from "zod"
import type { Customer } from "@repo/database"

// Re-export the type from the shared package
export type { Customer }

// Simple Zod schema for form validation messages
export const customerSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự."),
  phone: z.string().min(10, "Số điện thoại phải có ít nhất 10 số."),
  gender: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
