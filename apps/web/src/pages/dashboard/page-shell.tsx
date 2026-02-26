import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PageShellProps = {
  title: string;
  description: string;
};

export function DashboardPageShell({ title, description }: PageShellProps) {
  return (
    <Card className="border border-border/70 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Trang này đã được tạo route trong React app. Bước tiếp theo là port logic và component
          parity từ Svelte.
        </p>
      </CardContent>
    </Card>
  );
}
