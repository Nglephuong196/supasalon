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
import { signIn } from "@/lib/auth-client";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

function validateEmail(value: string): string | null {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!value) return "Vui lòng nhập email";
  if (!emailRegex.test(value)) return "Email không hợp lệ";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Vui lòng nhập mật khẩu";
  if (value.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự";
  return null;
}

export function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Đăng nhập | SupaSalon";
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    const nextPasswordError = validatePassword(password);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await signIn.email({
        email,
        password,
        fetchOptions: {
          onSuccess: async () => {
            await navigate({ to: "/" });
          },
        },
      });

      if (result.error) {
        setError(
          result.error.message || "Đăng nhập thất bại. Vui lòng kiểm tra thông tin đăng nhập.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md border-black/10 bg-white/85 shadow-[0_30px_60px_-40px_rgba(15,23,42,.8)] backdrop-blur-sm">
      <CardHeader className="space-y-2 pt-8 pb-7 text-center">
        <div className="mb-2 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-amber-500 to-cyan-600 text-white shadow-lg shadow-cyan-100">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Chào mừng trở lại
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Đăng nhập để quản lý salon của bạn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 px-8">
        <div aria-live="polite">
          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </div>
          ) : null}
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@salon.com"
              autoComplete="email"
              disabled={isLoading}
              value={email}
              aria-invalid={Boolean(emailError)}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailError(validateEmail(email))}
            />
            {emailError ? <p className="text-xs font-medium text-red-500">{emailError}</p> : null}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
              <span className="text-sm font-medium text-muted-foreground">Tối thiểu 6 ký tự</span>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              disabled={isLoading}
              value={password}
              aria-invalid={Boolean(passwordError)}
              onChange={(event) => setPassword(event.target.value)}
              onBlur={() => setPasswordError(validatePassword(password))}
            />
            {passwordError ? (
              <p className="text-xs font-medium text-red-500">{passwordError}</p>
            ) : null}
          </div>

          <Button type="submit" className="mt-2 h-11 w-full text-base" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pb-8">
        <div className="text-center text-sm text-muted-foreground">
          Chưa có tài khoản?
          <Link to="/signup" className="ml-1 font-semibold text-primary hover:opacity-80">
            Đăng ký ngay
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
