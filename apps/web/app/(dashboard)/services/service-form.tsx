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
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { DialogFooter } from "@/components/ui/dialog"
import { serviceSchema, ServiceFormValues, ProductOption } from "./schema"
import { Category } from "@/components/resource/category-sidebar"

interface ServiceFormProps {
  defaultValues?: ServiceFormValues
  onSubmit: (data: ServiceFormValues) => void
  categories: Category[]
  products?: ProductOption[]
}

export function ServiceForm({ defaultValues, onSubmit, categories, products = [] }: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: defaultValues || {
      name: "",
      price: 0,
      duration: 30,
      category_id: categories.length > 0 ? categories[0].id : "",
      is_active: true,
      allow_booking: false,
      show_on_app: false,
      description: "",
      extra_price_config: null,
      attached_products_config: null,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Basic Info Section */}
        <div className="space-y-4">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Tên dịch vụ <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                    <Input placeholder="Tên dịch vụ" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            
             <FormField
                control={form.control}
                name="category_id"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Danh mục</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? undefined} value={field.value ?? undefined}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn danh mục" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Giá (VNĐ) <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                        <Input 
                        type="number" 
                        placeholder="0" 
                        value={field.value ?? 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Thời lượng (phút)</FormLabel>
                    <FormControl>
                        <Input 
                        type="number" 
                        placeholder="30" 
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Mô tả dịch vụ</FormLabel>
                    <FormControl>
                        <Textarea 
                          placeholder="Mô tả chi tiết về dịch vụ..." 
                          className="resize-none" 
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
        </div>

        {/* Settings Section */}
        <div className="space-y-4 border-t pt-4">
             <h3 className="font-medium">Cấu hình</h3>
             <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Kích hoạt</FormLabel>
                    <FormDescription>
                      Dịch vụ này có đang được sử dụng hay không
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allow_booking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Cho phép đặt lịch</FormLabel>
                    <FormDescription>
                      Khách hàng có thể đặt lịch trước cho dịch vụ này
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="show_on_app"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Hiển thị trên App</FormLabel>
                    <FormDescription>
                      Dịch vụ sẽ hiển thị trên ứng dụng khách hàng
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
        </div>

        <DialogFooter>
            <Button type="submit">Lưu dịch vụ</Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
