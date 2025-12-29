import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Đăng nhập | Salon Pro",
  description: "Đăng nhập vào hệ thống quản lý salon",
};

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
