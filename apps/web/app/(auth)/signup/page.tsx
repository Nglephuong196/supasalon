"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { VIETNAM_PROVINCES, VIETNAM_PHONE_REGEX } from "@repo/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loader2, Store } from "lucide-react";

const signupSchema = z.object({
  // Account info
  ownerName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  // Salon info
  salonName: z.string().min(2, "Tên salon phải có ít nhất 2 ký tự"),
  province: z.enum([...VIETNAM_PROVINCES], {
    message: "Vui lòng chọn tỉnh/thành phố"
  }),
  address: z.string().min(5, "Vui lòng nhập địa chỉ đầy đủ"),
  phone: z.string().regex(VIETNAM_PHONE_REGEX, "Số điện thoại không hợp lệ (VD: 0901234567)"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      ownerName: "",
      email: "",
      password: "",
      confirmPassword: "",
      salonName: "",
      province: undefined,
      address: "",
      phone: "",
    },
  });

  async function onSubmit(values: SignupFormValues) {
    setIsLoading(true);
    setError(null);

    // TODO: Implement with new backend
    setError("Chức năng đăng ký đang được cập nhật. Vui lòng thử lại sau.");
    setIsLoading(false);
  }

  return (
    <Card className="shadow-2xl border-0">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Store className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold">Đăng ký Salon</CardTitle>
        <CardDescription>
          Tạo tài khoản và đăng ký salon của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            {error}
          </div>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Account Section */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Thông tin tài khoản
              </div>
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ và tên</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@example.com"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mật khẩu</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Xác nhận</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          autoComplete="new-password"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Salon Section */}
            <div className="space-y-3 pt-2 border-t">
              <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide pt-2">
                Thông tin Salon
              </div>
              <FormField
                control={form.control}
                name="salonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên Salon</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="VD: Beauty Spa & Nail"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tỉnh/Thành phố</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tỉnh/thành" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {VIETNAM_PROVINCES.map((province) => (
                            <SelectItem key={province} value={province}>
                              {province}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="0901234567"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Địa chỉ</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Số nhà, đường, phường/xã, quận/huyện"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang tạo tài khoản...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
