import { z } from "zod"

export const employeeSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Tên nhân viên không được để trống"),
  email: z.string().email("Email không hợp lệ").min(1, "Email không được để trống"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự").optional(),
  group_id: z.string().min(1, "Vui lòng chọn nhóm"),
  status: z.enum(["active", "inactive"]),
  avatar_url: z.string().nullable().optional(),
  allow_booking: z.boolean(),
  allow_overlap: z.boolean(),
  birthday: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
