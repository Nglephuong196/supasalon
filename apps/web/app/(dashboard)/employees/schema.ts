import { z } from "zod"

export const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
  role: z.string().min(2, { message: "Vị trí không được để trống." }),
  phone: z.string().min(10, { message: "Số điện thoại không hợp lệ." }),
  status: z.enum(["Active", "Inactive"]),
})

export type Employee = z.infer<typeof employeeSchema>
