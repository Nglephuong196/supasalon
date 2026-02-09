import { Link } from "@tanstack/react-router";
import { Home, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <CardContent className="p-0">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-red-100 to-rose-100">
            <ShieldAlert className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>
          <p className="mb-8 max-w-md text-gray-500">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng
            đây là lỗi.
          </p>
          <div className="mx-auto max-w-xs">
            <Link to="/" className="block">
              <Button className="w-full">
                <Home className="mr-2 h-4 w-4" />
                Về trang chủ
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
