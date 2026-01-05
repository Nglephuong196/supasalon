import { z } from "zod"

export const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Tên dịch vụ không được để trống." }),
  price: z.number().min(0, { message: "Giá không hợp lệ." }),
  duration: z.number().min(0, { message: "Thời lượng không hợp lệ." }), // in minutes
  categoryId: z.string().min(1, { message: "Vui lòng chọn danh mục." }),
})

export type Service = z.infer<typeof serviceSchema>

export interface ServiceCategory {
  id: string
  name: string
}
