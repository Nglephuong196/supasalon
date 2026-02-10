import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { organization, signUp } from "@/lib/auth-client";
import { VIETNAM_PHONE_REGEX, VIETNAM_PROVINCES } from "@repo/constants/vietnam";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Store } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useState } from "react";

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:8787";
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type SlugStatus = "idle" | "checking" | "available" | "taken";

type FormData = {
  ownerName: string;
  email: string;
  password: string;
  confirmPassword: string;
  salonName: string;
  salonSlug: string;
  province: string;
  address: string;
  phone: string;
};

function normalizeSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    ownerName: "",
    email: "",
    password: "",
    confirmPassword: "",
    salonName: "",
    salonSlug: "",
    province: "",
    address: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugTouched, setSlugTouched] = useState(false);
  const [lastCheckedSlug, setLastCheckedSlug] = useState("");

  useEffect(() => {
    document.title = "Đăng ký Salon | SupaSalon";
  }, []);

  useEffect(() => {
    if (!slugTouched) {
      setFormData((prev) => ({
        ...prev,
        salonSlug: normalizeSlug(prev.salonName),
      }));
    }
  }, [formData.salonName, slugTouched]);

  function setField<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function setFieldError(field: string, message: string | null): boolean {
    setErrors((prev) => ({ ...prev, [field]: message }));
    return !message;
  }

  function validateOwnerName(value: string): boolean {
    if (!value || value.length < 2) {
      return setFieldError("ownerName", "Họ tên phải có ít nhất 2 ký tự");
    }
    return setFieldError("ownerName", null);
  }

  function validateEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!value) return setFieldError("email", "Vui lòng nhập email");
    if (!emailRegex.test(value)) return setFieldError("email", "Email không hợp lệ");
    return setFieldError("email", null);
  }

  function validatePassword(value: string): boolean {
    if (!value || value.length < 8) {
      return setFieldError("password", "Mật khẩu phải có ít nhất 8 ký tự");
    }
    return setFieldError("password", null);
  }

  function validateConfirmPassword(value: string): boolean {
    if (value !== formData.password) return setFieldError("confirmPassword", "Mật khẩu không khớp");
    return setFieldError("confirmPassword", null);
  }

  function validateSalonName(value: string): boolean {
    if (!value || value.length < 2) {
      return setFieldError("salonName", "Tên salon phải có ít nhất 2 ký tự");
    }
    return setFieldError("salonName", null);
  }

  function validateSalonSlug(value: string): boolean {
    const normalized = normalizeSlug(value);
    setField("salonSlug", normalized);
    if (!normalized) return setFieldError("salonSlug", "Vui lòng nhập slug cho salon");
    if (normalized.length < 3) return setFieldError("salonSlug", "Slug phải có ít nhất 3 ký tự");
    if (!SLUG_REGEX.test(normalized)) {
      return setFieldError(
        "salonSlug",
        "Slug chỉ gồm chữ thường, số và dấu gạch ngang (không ở đầu/cuối)",
      );
    }
    return setFieldError("salonSlug", null);
  }

  function validateProvince(value: string): boolean {
    if (!value) return setFieldError("province", "Vui lòng chọn tỉnh/thành phố");
    return setFieldError("province", null);
  }

  function validateAddress(value: string): boolean {
    if (!value || value.length < 5) return setFieldError("address", "Vui lòng nhập địa chỉ đầy đủ");
    return setFieldError("address", null);
  }

  function validatePhone(value: string): boolean {
    if (!value) return setFieldError("phone", "Vui lòng nhập số điện thoại");
    if (!VIETNAM_PHONE_REGEX.test(value)) {
      return setFieldError("phone", "Số điện thoại không hợp lệ (VD: 0901234567)");
    }
    return setFieldError("phone", null);
  }

  async function checkSalonSlugAvailability(slug: string): Promise<boolean> {
    if (!validateSalonSlug(slug)) {
      setSlugStatus("idle");
      return false;
    }
    if (lastCheckedSlug === slug && slugStatus === "available") return true;

    setSlugStatus("checking");
    try {
      const response = await fetch(`${AUTH_BASE_URL}/api/auth/organization/check-slug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug }),
      });

      if (response.ok) {
        setSlugStatus("available");
        setLastCheckedSlug(slug);
        setFieldError("salonSlug", null);
        return true;
      }

      if (response.status === 400) {
        setSlugStatus("taken");
        setFieldError("salonSlug", "Slug này đã tồn tại. Vui lòng chọn slug khác.");
        return false;
      }

      setSlugStatus("idle");
      setFieldError("salonSlug", "Không kiểm tra được slug. Vui lòng thử lại.");
      return false;
    } catch {
      setSlugStatus("idle");
      setFieldError("salonSlug", "Không kiểm tra được slug. Vui lòng thử lại.");
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isValid =
      validateOwnerName(formData.ownerName) &&
      validateEmail(formData.email) &&
      validatePassword(formData.password) &&
      validateConfirmPassword(formData.confirmPassword) &&
      validateSalonName(formData.salonName) &&
      validateSalonSlug(formData.salonSlug) &&
      validateProvince(formData.province) &&
      validateAddress(formData.address) &&
      validatePhone(formData.phone);

    if (!isValid) return;

    const isSlugAvailable = await checkSalonSlugAvailability(formData.salonSlug);
    if (!isSlugAvailable) return;

    setIsLoading(true);
    setError(null);

    try {
      const signUpResult = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.ownerName,
      });

      if (signUpResult.error) {
        setError(signUpResult.error.message || "Đăng ký thất bại");
        return;
      }

      const orgResult = await organization.create({
        name: formData.salonName,
        slug: formData.salonSlug,
      });

      if (orgResult.error) {
        setError(orgResult.error.message || "Không thể tạo Salon. Vui lòng thử lại.");
        return;
      }

      await navigate({ to: "/signin" });
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Đã có lỗi xảy ra.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  const provinceItems = useMemo(() => VIETNAM_PROVINCES, []);

  return (
    <Card className="relative z-10 w-full max-w-lg border-black/10 bg-white/90 shadow-[0_35px_65px_-45px_rgba(15,23,42,.85)] backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-r from-amber-500 to-cyan-600 text-white">
          <Store className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold">Đăng ký Salon</CardTitle>
        <CardDescription>Tạo tài khoản và đăng ký salon của bạn</CardDescription>
      </CardHeader>
      <CardContent>
        <div aria-live="polite">
          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Thông tin tài khoản
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Họ và tên</Label>
              <Input
                id="ownerName"
                autoComplete="name"
                disabled={isLoading}
                placeholder="Nguyễn Văn A"
                value={formData.ownerName}
                aria-invalid={Boolean(errors.ownerName)}
                onChange={(event) => setField("ownerName", event.target.value)}
                onBlur={() => validateOwnerName(formData.ownerName)}
              />
              {errors.ownerName ? (
                <p className="text-sm text-destructive">{errors.ownerName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                disabled={isLoading}
                placeholder="email@example.com"
                value={formData.email}
                aria-invalid={Boolean(errors.email)}
                onChange={(event) => setField("email", event.target.value)}
                onBlur={() => validateEmail(formData.email)}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email}</p> : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={formData.password}
                  aria-invalid={Boolean(errors.password)}
                  onChange={(event) => setField("password", event.target.value)}
                  onBlur={() => validatePassword(formData.password)}
                />
                {errors.password ? (
                  <p className="text-sm text-destructive">{errors.password}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  disabled={isLoading}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  onChange={(event) => setField("confirmPassword", event.target.value)}
                  onBlur={() => validateConfirmPassword(formData.confirmPassword)}
                />
                {errors.confirmPassword ? (
                  <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div className="pt-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Thông tin Salon
            </div>
            <div className="space-y-2">
              <Label htmlFor="salonName">Tên Salon</Label>
              <Input
                id="salonName"
                disabled={isLoading}
                placeholder="VD: Beauty Spa & Nail"
                value={formData.salonName}
                aria-invalid={Boolean(errors.salonName)}
                onChange={(event) => setField("salonName", event.target.value)}
                onBlur={() => validateSalonName(formData.salonName)}
              />
              {errors.salonName ? (
                <p className="text-sm text-destructive">{errors.salonName}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salonSlug">Slug Salon (URL đặt lịch công khai)</Label>
              <Input
                id="salonSlug"
                disabled={isLoading}
                placeholder="vd: beauty-spa-nail"
                value={formData.salonSlug}
                aria-invalid={Boolean(errors.salonSlug)}
                onChange={(event) => {
                  setSlugTouched(true);
                  const normalized = normalizeSlug(event.target.value);
                  setField("salonSlug", normalized);
                  setSlugStatus("idle");
                  setLastCheckedSlug("");
                }}
                onBlur={async () => {
                  const slug = normalizeSlug(formData.salonSlug);
                  setField("salonSlug", slug);
                  if (!slug) return;
                  await checkSalonSlugAvailability(slug);
                }}
              />
              <p className="text-xs text-muted-foreground">
                URL dự kiến:{" "}
                <span className="font-medium">/book/{formData.salonSlug || "slug-cua-ban"}</span>
              </p>
              {slugStatus === "checking" ? (
                <p className="text-sm text-muted-foreground">Đang kiểm tra slug...</p>
              ) : null}
              {slugStatus === "available" && !errors.salonSlug ? (
                <p className="text-sm text-emerald-600">Slug này có thể sử dụng.</p>
              ) : null}
              {errors.salonSlug ? (
                <p className="text-sm text-destructive">{errors.salonSlug}</p>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="province">Tỉnh/Thành phố</Label>
                <Input
                  id="province"
                  list="vietnam-provinces"
                  placeholder="Chọn tỉnh/thành"
                  value={formData.province}
                  disabled={isLoading}
                  aria-invalid={Boolean(errors.province)}
                  onChange={(event) => setField("province", event.target.value)}
                  onBlur={() => validateProvince(formData.province)}
                />
                <datalist id="vietnam-provinces">
                  {provinceItems.map((province) => (
                    <option key={province} value={province} />
                  ))}
                </datalist>
                {errors.province ? (
                  <p className="text-sm text-destructive">{errors.province}</p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  disabled={isLoading}
                  value={formData.phone}
                  aria-invalid={Boolean(errors.phone)}
                  onChange={(event) => setField("phone", event.target.value)}
                  onBlur={() => validatePhone(formData.phone)}
                />
                {errors.phone ? <p className="text-sm text-destructive">{errors.phone}</p> : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                disabled={isLoading}
                placeholder="Số nhà, đường, phường/xã, quận/huyện"
                value={formData.address}
                aria-invalid={Boolean(errors.address)}
                onChange={(event) => setField("address", event.target.value)}
                onBlur={() => validateAddress(formData.address)}
              />
              {errors.address ? <p className="text-sm text-destructive">{errors.address}</p> : null}
            </div>
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
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <div className="text-center text-sm text-muted-foreground">
          Đã có tài khoản?
          <Link to="/signin" className="ml-1 font-medium text-primary hover:underline">
            Đăng nhập
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
