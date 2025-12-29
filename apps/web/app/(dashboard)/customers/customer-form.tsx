"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import { DialogFooter } from "@/components/ui/dialog"
import { DatePicker } from "@/components/ui/date-picker"
import { customerSchema, CustomerFormValues } from "./schema"
import { cn } from "@/lib/utils"

interface CustomerFormProps {
  defaultValues?: CustomerFormValues
  onSubmit: (data: CustomerFormValues) => void
}

const genderOptions = [
  { value: "Nam", label: "Nam" },
  { value: "Nữ", label: "Nữ" },
  { value: "Khác", label: "Khác" },
]

export function CustomerForm({ defaultValues, onSubmit }: CustomerFormProps) {
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: defaultValues || {
      name: "",
      phone: "",
      gender: "",
      birthday: "",
      location: "",
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên khách hàng *</FormLabel>
              <FormControl>
                <Input placeholder="Nguyễn Văn A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại *</FormLabel>
              <FormControl>
                <Input placeholder="0901234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Giới tính *</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  {genderOptions.map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      variant={field.value === option.value ? "default" : "outline"}
                      className={cn(
                        "flex-1",
                        field.value === option.value && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => field.onChange(option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="birthday"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ngày sinh</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value ? new Date(field.value) : undefined}
                  onSelect={(date) => {
                    field.onChange(date ? date.toISOString().split('T')[0] : null)
                  }}
                  placeholder="Chọn ngày sinh"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Địa chỉ</FormLabel>
              <FormControl>
                <Input placeholder="Quận 1, TP.HCM" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit">Lưu thông tin</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
