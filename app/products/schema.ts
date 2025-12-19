import { z } from "zod"

export const productSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, { message: "Tên sản phẩm không được để trống." }),
  price: z.coerce.number().min(0, { message: "Giá không hợp lệ." }),
  stock: z.coerce.number().min(0, { message: "Số lượng không hợp lệ." }),
  categoryId: z.string().min(1, { message: "Vui lòng chọn danh mục." }),
})

export type Product = z.infer<typeof productSchema>

export interface ProductCategory {
  id: string
  name: string
}
