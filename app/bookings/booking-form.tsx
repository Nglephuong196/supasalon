"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { SheetFooter } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { bookingSchema, Booking } from "./schema"

interface BookingFormProps {
  defaultValues?: Booking
  onSubmit: (data: Booking) => void
}

export function BookingForm({ defaultValues, onSubmit }: BookingFormProps) {
  const form = useForm<Booking>({
    resolver: zodResolver(bookingSchema),
    defaultValues: defaultValues || {
      customerName: "",
      service: "",
      staffName: "",
      time: "09:00",
      status: "Pending" as const,
      date: new Date(),
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="customerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Khách hàng</FormLabel>
              <FormControl>
                <Input placeholder="Tên khách hàng" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="service"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dịch vụ</FormLabel>
              <FormControl>
                <Input placeholder="Cắt tóc, Gội đầu..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="staffName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nhân viên</FormLabel>
              <FormControl>
                <Input placeholder="Tên nhân viên" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem className="flex flex-col flex-1">
                <FormLabel>Ngày</FormLabel>
                <Popover>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button
                        variant={"outline"}
                        className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                        )}
                        >
                        {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                        ) : (
                            <span>Chọn ngày</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem className="flex-1">
                <FormLabel>Giờ</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trạng thái</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Pending">Chờ duyệt</SelectItem>
                  <SelectItem value="Confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="Completed">Hoàn thành</SelectItem>
                  <SelectItem value="Cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <SheetFooter>
            <Button type="submit">Lưu lịch hẹn</Button>
        </SheetFooter>
      </form>
    </Form>
  )
}
