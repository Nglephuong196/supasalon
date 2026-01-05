"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Stylist {
  id: string;
  name: string;
  avatar?: string;
  earnings: number;
}

const topStylists: Stylist[] = [
  { id: "1", name: "Linh N.", earnings: 42000000 },
  { id: "2", name: "David K.", earnings: 38500000 },
  { id: "3", name: "Minh T.", earnings: 31000000 },
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
};

export function TopStylists() {
  const maxEarnings = Math.max(...topStylists.map((s) => s.earnings));

  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">
          Nhân viên xuất sắc (Tháng 12)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {topStylists.map((stylist, index) => {
          const percentage = (stylist.earnings / maxEarnings) * 100;
          const colors = [
            "bg-green-500",
            "bg-blue-500",
            "bg-purple-500",
          ];

          return (
            <div key={stylist.id} className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={stylist.avatar} />
                <AvatarFallback className="bg-gray-100 text-gray-600 text-sm font-medium">
                  {stylist.name.split(" ").map((n) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-900">
                    {stylist.name}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(stylist.earnings)}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors[index]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
