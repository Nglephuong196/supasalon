import { beforeEach, describe, expect, it, vi } from "vitest";

const apiClientMock = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
};

vi.mock("@/lib/api", () => ({
  apiClient: apiClientMock,
}));

import { customersService } from "./customers.service";

describe("customersService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listPaginated builds expected query with search and vip", async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 10, totalPages: 1 });

    await customersService.listPaginated({
      page: 1,
      limit: 10,
      search: "anna",
      vipOnly: true,
    });

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/customers?paginated=1&page=1&limit=10&search=anna&vip=1",
    );
  });

  it("create delegates to POST /customers", async () => {
    const payload = {
      name: "Anna",
      phone: "0123",
      email: null,
      notes: "",
      gender: "female" as const,
      location: null,
    };
    apiClientMock.post.mockResolvedValueOnce({});

    await customersService.create(payload);

    expect(apiClientMock.post).toHaveBeenCalledWith("/customers", payload);
  });
});
