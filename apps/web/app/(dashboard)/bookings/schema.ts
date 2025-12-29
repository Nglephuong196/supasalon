import { z } from "zod"

export const bookingSchema = z.object({
  id: z.string().optional(),
  customerName: z.string().min(2, { message: "Tên khách hàng không được để trống." }),
  service: z.string().min(2, { message: "Dịch vụ không được để trống." }),
  staffName: z.string().min(2, { message: "Nhân viên không được để trống." }),
  date: z.date(),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Giờ phải đúng định dạng HH:MM" }),
  status: z.enum(["Confirmed", "Pending", "Completed", "Cancelled"]),
})

export type Booking = z.infer<typeof bookingSchema>
