import { z } from "zod"

export const invoiceSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, { message: "Khách hàng không được để trống." }),
  customerName: z.string().optional(), // For display
  amount: z.number().min(0, { message: "Số tiền không hợp lệ." }),
  status: z.enum(["Paid", "Unpaid", "Cancelled"]),
  date: z.date(),
})

export type Invoice = z.infer<typeof invoiceSchema>
