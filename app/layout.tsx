import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { MainLayout } from "@/components/layout/main-layout";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam-pro",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Salon Pro | Quản lý salon chuyên nghiệp",
  description: "Giải pháp quản lý salon làm đẹp, lịch hẹn và khách hàng toàn diện.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${beVietnamPro.variable} font-sans antialiased`}
      >
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
