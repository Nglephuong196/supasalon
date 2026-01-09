"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { employeeSchema, EmployeeFormValues } from "./schema"
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
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, Upload } from "lucide-react"
import type { EmployeeGroup } from "@/lib/types/employee"

interface EmployeeFormProps {
  defaultValues?: EmployeeFormValues
  onSubmit: (data: EmployeeFormValues) => void
  groups: EmployeeGroup[]
}

export function EmployeeForm({ defaultValues, onSubmit, groups }: EmployeeFormProps) {
  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: defaultValues ? {
      ...defaultValues,
      status: defaultValues.status || "active",
    } : {
      name: "",
      email: "",
      group_id: "",
      status: "active",
      avatar_url: null,
      allow_booking: true,
      allow_overlap: false,
      birthday: null,
      phone: null,
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Cài đặt thông tin</TabsTrigger>
            <TabsTrigger value="permissions">Phân Quyền</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Tên nhân viên
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Nhập tên nhân viên" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Email đăng nhập
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Nhập email để nhân viên đăng nhập"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Nhân viên sẽ dùng email này để đăng nhập vào hệ thống
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password - only show when creating new employee */}
            {!defaultValues?.id && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center">
                      <span className="text-red-500 mr-1">*</span>
                      Mật khẩu
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Nhập mật khẩu cho nhân viên"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Ít nhất 6 ký tự. Nhân viên có thể đổi mật khẩu sau.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Group */}
            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Nhóm
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn nhóm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {groups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center">
                    <span className="text-red-500 mr-1">*</span>
                    Trạng thái
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Đang hoạt động</SelectItem>
                      <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Avatar */}
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ảnh đại diện</FormLabel>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={field.value || undefined} />
                      <AvatarFallback>
                        <User className="h-8 w-8 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <Button type="button" variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Tải ảnh lên
                      </Button>
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                          className="text-muted-foreground"
                        >
                          Xóa ảnh
                        </Button>
                      )}
                    </div>
                  </div>
                </FormItem>
              )}
            />

            {/* Allow Booking */}
            <FormField
              control={form.control}
              name="allow_booking"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Cho phép đặt lịch</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Allow Overlap */}
            <FormField
              control={form.control}
              name="allow_overlap"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Đặt trùng lịch hẹn trên 1 khung giờ</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Birthday */}
            <FormField
              control={form.control}
              name="birthday"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ngày sinh</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      placeholder="Nhập ngày sinh"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nhập số điện thoại"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4 mt-4">
            <div className="text-muted-foreground text-sm">
              Phân quyền sẽ được thiết lập sau khi tạo nhân viên.
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit">Lưu</Button>
        </div>
      </form>
    </Form>
  )
}
