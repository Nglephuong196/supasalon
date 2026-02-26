import { apiClient } from "@/lib/api";
import type { BranchItem } from "./branches.service";
import type { EmployeeMember } from "./employees.service";

export type PayrollPaymentMethod = "cash" | "transfer" | "card";
export type PayrollSalaryType = "monthly" | "daily" | "hourly";

export type PayrollConfig = {
  id: number;
  organizationId: string;
  branchId?: number | null;
  staffId: string;
  salaryType: PayrollSalaryType;
  baseSalary: number;
  defaultAllowance: number;
  defaultDeduction: number;
  defaultAdvance: number;
  paymentMethod: PayrollPaymentMethod;
  effectiveFrom: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: BranchItem | null;
  staff?: EmployeeMember;
};

export type PayrollPreviewItem = {
  staffId: string;
  staffName: string;
  branchId?: number | null;
  configId?: number | null;
  salaryType: PayrollSalaryType;
  paymentMethod: PayrollPaymentMethod;
  baseSalary: number;
  commissionAmount: number;
  bonusAmount: number;
  allowanceAmount: number;
  deductionAmount: number;
  advanceAmount: number;
  netAmount: number;
};

export type PayrollCycle = {
  id: number;
  organizationId: string;
  branchId?: number | null;
  name: string;
  fromDate: string;
  toDate: string;
  status: "draft" | "finalized" | "paid";
  notes?: string | null;
  createdByUserId?: string | null;
  finalizedByUserId?: string | null;
  paidByUserId?: string | null;
  finalizedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
  branch?: BranchItem | null;
  items?: PayrollItem[];
};

export type PayrollItem = {
  id: number;
  organizationId: string;
  cycleId: number;
  staffId: string;
  branchId?: number | null;
  baseSalary: number;
  commissionAmount: number;
  bonusAmount: number;
  allowanceAmount: number;
  deductionAmount: number;
  advanceAmount: number;
  netAmount: number;
  paymentMethod: PayrollPaymentMethod;
  status: "draft" | "paid";
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  staff?: EmployeeMember;
  branch?: BranchItem | null;
};

export const payrollService = {
  listConfigs(filters?: { branchId?: number; staffId?: string }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.set("branchId", String(filters.branchId));
    if (filters?.staffId) params.set("staffId", filters.staffId);
    const query = params.toString();
    return apiClient.get<PayrollConfig[]>(query ? `/payroll/configs?${query}` : "/payroll/configs");
  },
  saveConfig(payload: {
    id?: number;
    staffId: string;
    branchId?: number;
    salaryType?: PayrollSalaryType;
    baseSalary?: number;
    defaultAllowance?: number;
    defaultDeduction?: number;
    defaultAdvance?: number;
    paymentMethod?: PayrollPaymentMethod;
    effectiveFrom?: string;
    isActive?: boolean;
    notes?: string;
  }) {
    return apiClient.post<PayrollConfig>("/payroll/configs", payload);
  },
  listCycles(filters?: {
    branchId?: number;
    status?: "draft" | "finalized" | "paid";
    from?: string;
    to?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.branchId) params.set("branchId", String(filters.branchId));
    if (filters?.status) params.set("status", filters.status);
    if (filters?.from) params.set("from", filters.from);
    if (filters?.to) params.set("to", filters.to);
    const query = params.toString();
    return apiClient.get<PayrollCycle[]>(query ? `/payroll/cycles?${query}` : "/payroll/cycles");
  },
  previewCycle(payload: { from: string; to: string; branchId?: number }) {
    return apiClient.post<PayrollPreviewItem[]>("/payroll/cycles/preview", payload);
  },
  createCycle(payload: {
    from: string;
    to: string;
    branchId?: number;
    name?: string;
    notes?: string;
  }) {
    return apiClient.post<PayrollCycle>("/payroll/cycles", payload);
  },
  getCycle(id: number) {
    return apiClient.get<PayrollCycle>(`/payroll/cycles/${id}`);
  },
  listItems(cycleId: number) {
    return apiClient.get<PayrollItem[]>(`/payroll/cycles/${cycleId}/items`);
  },
  updateItem(
    id: number,
    payload: {
      bonusAmount?: number;
      allowanceAmount?: number;
      deductionAmount?: number;
      advanceAmount?: number;
      notes?: string;
      paymentMethod?: PayrollPaymentMethod;
    },
  ) {
    return apiClient.patch<PayrollItem>(`/payroll/items/${id}`, payload);
  },
  finalizeCycle(id: number) {
    return apiClient.patch<PayrollCycle>(`/payroll/cycles/${id}/finalize`);
  },
  payCycle(id: number, payload?: { paidAt?: string }) {
    return apiClient.patch<PayrollCycle>(`/payroll/cycles/${id}/pay`, payload ?? {});
  },
};
