import { apiClient } from "@/lib/api";
import type { EmployeeMember } from "./employees.service";

export type BranchItem = {
  id: number;
  organizationId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  phone?: string | null;
  managerMemberId?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  manager?: EmployeeMember | null;
};

export type BranchPayload = {
  name: string;
  code?: string;
  address?: string;
  phone?: string;
  managerMemberId?: string;
  isActive?: boolean;
  isDefault?: boolean;
};

export type BranchMemberAssignment = {
  id: number;
  organizationId: string;
  branchId: number;
  memberId: string;
  isPrimary: boolean;
  createdAt: string;
  member?: EmployeeMember;
  branch?: BranchItem;
};

export const branchesService = {
  list() {
    return apiClient.get<BranchItem[]>("/branches");
  },
  get(id: number) {
    return apiClient.get<BranchItem>(`/branches/${id}`);
  },
  create(payload: BranchPayload) {
    return apiClient.post<BranchItem>("/branches", payload);
  },
  update(id: number, payload: Partial<BranchPayload>) {
    return apiClient.put<BranchItem>(`/branches/${id}`, payload);
  },
  remove(id: number) {
    return apiClient.delete<{ success: boolean }>(`/branches/${id}`);
  },
  listMembers(branchId: number) {
    return apiClient.get<BranchMemberAssignment[]>(`/branches/${branchId}/members`);
  },
  assignMember(branchId: number, memberId: string, payload?: { isPrimary?: boolean }) {
    return apiClient.put<BranchMemberAssignment>(`/branches/${branchId}/members/${memberId}`, payload ?? {});
  },
  unassignMember(branchId: number, memberId: string) {
    return apiClient.delete<{ success: boolean }>(`/branches/${branchId}/members/${memberId}`);
  },
  byMember(memberId: string) {
    return apiClient.get<BranchMemberAssignment[]>(`/branches/by-member/${memberId}`);
  },
};
