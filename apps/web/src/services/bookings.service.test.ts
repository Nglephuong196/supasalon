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

import { bookingsService } from "./bookings.service";

describe("bookingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("list builds expected query string", async () => {
    apiClientMock.get.mockResolvedValueOnce({ data: [], total: 0, page: 1, limit: 20, totalPages: 1 });

    await bookingsService.list({
      from: "2026-01-01",
      to: "2026-01-31",
      branchId: 2,
      status: "confirmed",
      search: "lee",
      page: 2,
      limit: 50,
    });

    expect(apiClientMock.get).toHaveBeenCalledTimes(1);
    expect(apiClientMock.get).toHaveBeenCalledWith(
      "/bookings?from=2026-01-01&to=2026-01-31&branchId=2&status=confirmed&search=lee&page=2&limit=50",
    );
  });

  it("updateStatus delegates to PATCH /bookings/{id}/status", async () => {
    apiClientMock.patch.mockResolvedValueOnce({});

    await bookingsService.updateStatus(10, "no_show", "client absent");

    expect(apiClientMock.patch).toHaveBeenCalledWith("/bookings/10/status", {
      status: "no_show",
      noShowReason: "client absent",
    });
  });
});
