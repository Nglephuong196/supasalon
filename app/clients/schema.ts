import { z } from "zod"

export const clientSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ." }),
  email: z.string().email({ message: "Email không hợp lệ." }).optional().or(z.literal('')),
  notes: z.string().optional(),
})

export type Client = z.infer<typeof clientSchema>
