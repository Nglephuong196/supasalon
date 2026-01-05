"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Droplet, Sparkles } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface LowStockItem {
  id: string;
  name: string;
  stock: number;
  unit: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}

const lowStockItems: LowStockItem[] = [
  {
    id: "1",
    name: "L'Oreal Shampoo Vol 2",
    stock: 2,
    unit: "chai",
    icon: Droplet,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    id: "2",
    name: "Keratin Treatment Kit",
    stock: 3,
    unit: "bộ",
    icon: Sparkles,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
];

export function LowStockAlerts() {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Cảnh báo hết hàng</CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lowStockItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className={`p-2.5 rounded-lg ${item.iconBg}`}>
                <Icon className={`h-5 w-5 ${item.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </p>
                <p className="text-xs text-red-500">
                  Còn {item.stock} {item.unit}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 text-sm font-medium"
              >
                Đặt hàng
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
