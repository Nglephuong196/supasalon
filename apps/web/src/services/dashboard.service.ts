import { apiClient } from "@/lib/api";

export type RangeKey = "today" | "week" | "month" | "year";

export type DashboardData = {
  range: RangeKey;
  chart: {
    labels: string[];
    data: number[];
    unit: string;
    title: string;
    context: string;
    compare: string;
  };
  stats: {
    revenue: number;
    appointments: number;
    newCustomers: number;
    avgInvoice: number;
    trend: {
      revenue: number;
      appointments: number;
      newCustomers: number;
      avgInvoice: number;
    };
  };
  schedule: Array<{
    id: number | string;
    time: string;
    customer: string;
    service: string;
    staff: string;
    status: string;
  }>;
  topStylists: Array<{
    id: string;
    name: string;
    revenue: number;
    revenuePercent: number;
    appointments: number;
    avatar: string;
  }>;
  lowStock: Array<{
    id: number | string;
    name: string;
    stock: number;
    minStock: number;
    status: "critical" | "warning" | string;
  }>;
};

export const dashboardService = {
  getOverview(range: RangeKey) {
    return apiClient.get<DashboardData>(`/dashboard?range=${range}`);
  },
};
