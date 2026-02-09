import { apiClient } from "@/lib/api";
import { ACTIONS, RESOURCES, type Action, type Resource } from "@repo/constants";
import type { EmployeeMember } from "./employees.service";
import type { ProductItem, ProductCategory } from "./products.service";
import type { ServiceItem, ServiceCategory } from "./services.service";

export type MembershipTier = {
  id: number;
  name: string;
  minSpending: number;
  discountPercent: number;
  minSpendingToMaintain: number | null;
  sortOrder: number;
};

export type CommissionRule = {
  id: number;
  staffId: string;
  itemType: "service" | "product";
  itemId: number;
  commissionType: "percent" | "fixed";
  commissionValue: number;
};

export type PermissionMap = Record<string, string[]>;

export type SettingsBundle = {
  tiers: MembershipTier[];
  members: EmployeeMember[];
  services: ServiceItem[];
  products: ProductItem[];
  serviceCategories: ServiceCategory[];
  productCategories: ProductCategory[];
  commissionRules: CommissionRule[];
};

export const permissionGroups: Array<{ resource: Resource; label: string; actions: Action[] }> = [
  {
    resource: RESOURCES.CUSTOMER,
    label: "Khách hàng",
    actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  },
  {
    resource: RESOURCES.INVOICE,
    label: "Hóa đơn",
    actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  },
  {
    resource: RESOURCES.SERVICE,
    label: "Dịch vụ",
    actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  },
  {
    resource: RESOURCES.BOOKING,
    label: "Lịch hẹn",
    actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.UPDATE, ACTIONS.DELETE],
  },
  { resource: RESOURCES.EMPLOYEE, label: "Nhân viên", actions: [ACTIONS.READ, ACTIONS.UPDATE] },
  { resource: RESOURCES.REPORT, label: "Báo cáo", actions: [ACTIONS.READ] },
];

export const settingsService = {
  listBundle() {
    return Promise.all([
      apiClient.get<MembershipTier[]>("/membership-tiers"),
      apiClient.get<EmployeeMember[]>("/members"),
      apiClient.get<ServiceItem[]>("/services"),
      apiClient.get<ProductItem[]>("/products"),
      apiClient.get<ServiceCategory[]>("/service-categories"),
      apiClient.get<ProductCategory[]>("/product-categories"),
      apiClient.get<CommissionRule[]>("/staff-commission-rules"),
    ]).then(
      ([
        tiers,
        members,
        services,
        products,
        serviceCategories,
        productCategories,
        commissionRules,
      ]) =>
        ({
          tiers,
          members,
          services,
          products,
          serviceCategories,
          productCategories,
          commissionRules,
        }) satisfies SettingsBundle,
    );
  },
  createTier(payload: Omit<MembershipTier, "id">) {
    return apiClient.post<MembershipTier>("/membership-tiers", payload);
  },
  updateTier(id: number, payload: Partial<Omit<MembershipTier, "id">>) {
    return apiClient.put<MembershipTier>(`/membership-tiers/${id}`, payload);
  },
  deleteTier(id: number) {
    return apiClient.delete<{ message: string }>(`/membership-tiers/${id}`);
  },
  updateMemberPermissions(memberId: string, permissions: PermissionMap) {
    return apiClient.put(`/members/${memberId}/permissions`, { permissions });
  },
  upsertCommissionRule(payload: Omit<CommissionRule, "id">) {
    return apiClient.post<CommissionRule>("/staff-commission-rules/upsert", payload);
  },
  deleteCommissionRule(id: number) {
    return apiClient.delete<{ success: boolean }>(`/staff-commission-rules/${id}`);
  },
};
