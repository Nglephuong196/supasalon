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

export type EmployeeListParams = {
  page: number;
  limit: number;
  search?: string;
};

export type PaginatedEmployees = {
  data: RawMember[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export const employeesService = {
  list() {
    return apiClient.get<RawMember[]>("/members");
  },
  listPaginated(params: EmployeeListParams) {
    const query = new URLSearchParams();
    query.set("paginated", "1");
    query.set("page", String(params.page));
    query.set("limit", String(params.limit));
    if (params.search) query.set("search", params.search);
    return apiClient.get<PaginatedEmployees>(`/members?${query.toString()}`);
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
