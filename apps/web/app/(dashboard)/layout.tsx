import { MainLayout } from "@/components/layout/main-layout";
import { QueryProvider } from "@/lib/providers/query-provider";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <MainLayout>{children}</MainLayout>
    </QueryProvider>
  );
}
