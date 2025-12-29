import { z } from "zod"

export const customerSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự." }),
  phone: z.string().min(10, { message: "Số điện thoại phải có ít nhất 10 số." }),
  gender: z.string().min(1, { message: "Vui lòng chọn giới tính." }),
  birthday: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>
