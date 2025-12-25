"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const revenueData = [
  { date: "1/10", revenue: 2400000 },
  { date: "5/10", revenue: 1398000 },
  { date: "10/10", revenue: 3800000 },
  { date: "15/10", revenue: 3908000 },
  { date: "20/10", revenue: 4800000 },
  { date: "25/10", revenue: 3800000 },
  { date: "Hôm nay", revenue: 4300000 },
];

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  return `${(value / 1000).toFixed(0)}K`;
};

export function RevenueChart() {
  return (
    <Card className="border border-gray-100 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Tổng quan doanh thu</CardTitle>
          <p className="text-sm text-muted-foreground">Doanh thu hàng ngày trong 30 ngày qua</p>
        </div>
        <Button variant="outline" size="sm" className="text-sm">
          30 ngày qua
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={revenueData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#6B7280" }}
                tickFormatter={formatCurrency}
                dx={-10}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value) => [
                  new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(value as number),
                  "Doanh thu",
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7C3AED"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                dot={{ fill: "#7C3AED", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#7C3AED" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
