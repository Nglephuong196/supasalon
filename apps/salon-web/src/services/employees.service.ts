import { apiClient } from "@/lib/api";

export type RawMember = {
  id: string;
  role: string;
  permissions?: Array<{ permissions: Record<string, string[]> }>;
  user?: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
};

export type EmployeeMember = RawMember;

export const employeesService = {
  list() {
    return apiClient.get<RawMember[]>("/members");
  },
  create(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return apiClient.post<unknown>("/members", payload);
  },
  updateRole(payload: { memberId: string; role: string }) {
    return apiClient.put<unknown>("/members/update-member-role", payload);
  },
  remove(payload: { memberIdOrEmail: string }) {
    return apiClient.delete<unknown>("/members/remove-member", {
      json: payload,
    });
  },
};
