import { and, desc, eq, gte, inArray, like, lte, or, sql } from "drizzle-orm";
import type { Database } from "../db";
import {
  bookingPolicies,
  branches,
  type NewBooking,
  bookings,
  customers,
  serviceCategories,
  services,
} from "../db/schema";

export interface BookingFilters {
  branchId?: number;
  from?: Date;
  to?: Date;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BookingsService {
  constructor(private db: Database) {}

  private isActiveStatus(status?: string | null) {
    return status === "pending" || status === "confirmed" || status === "checkin";
  }

  private toDate(value: unknown): Date {
    return value instanceof Date ? value : new Date(String(value));
  }

  private async getPolicy(organizationId: string) {
    const policy = await this.db.query.bookingPolicies.findFirst({
      where: eq(bookingPolicies.organizationId, organizationId),
    });

    return (
      policy ?? {
        id: 0,
        organizationId,
        preventStaffOverlap: true,
        bufferMinutes: 0,
        requireDeposit: false,
        defaultDepositAmount: 0,
        cancellationWindowHours: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    );
  }

  private async resolveBranchId(organizationId: string, branchId?: number | null) {
    if (branchId) {
      const found = await this.db.query.branches.findFirst({
        where: and(eq(branches.organizationId, organizationId), eq(branches.id, branchId)),
      });
      if (!found) {
        throw new Error("Chi nhánh không hợp lệ");
      }
      return found.id;
    }

    const defaultBranch = await this.db.query.branches.findFirst({
      where: and(eq(branches.organizationId, organizationId), eq(branches.isDefault, true)),
    });
    return defaultBranch?.id ?? null;
  }

  private getAssignedStaffIds(guests: unknown): string[] {
    if (!Array.isArray(guests)) return [];
    const ids = new Set<string>();
    for (const guest of guests as any[]) {
      for (const service of guest?.services ?? []) {
        if (typeof service?.memberId === "string" && service.memberId.trim()) {
          ids.add(service.memberId.trim());
        }
      }
    }
    return Array.from(ids);
  }

  private getBookingDurationMinutes(guests: unknown, serviceDurationMap: Map<number, number>) {
    if (!Array.isArray(guests) || guests.length === 0) return 30;
    let maxDuration = 0;
    for (const guest of guests as any[]) {
      const guestDuration = (guest?.services ?? []).reduce((sum: number, service: any) => {
        const serviceId = Number(service?.serviceId);
        return sum + (serviceDurationMap.get(serviceId) ?? 0);
      }, 0);
      maxDuration = Math.max(maxDuration, guestDuration);
    }
    return maxDuration > 0 ? maxDuration : 30;
  }

  private async getServiceDurationMap(organizationId: string) {
    const rows = await this.db
      .select({ id: services.id, duration: services.duration })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(serviceCategories.organizationId, organizationId));

    return new Map(rows.map((row) => [row.id, Number(row.duration) || 0]));
  }

  async ensureNoStaffConflicts(params: {
    organizationId: string;
    date: unknown;
    guests: unknown;
    excludeBookingId?: number;
  }) {
    const policy = await this.getPolicy(params.organizationId);
    if (!policy.preventStaffOverlap) return;

    const assignedStaffIds = this.getAssignedStaffIds(params.guests);
    if (assignedStaffIds.length === 0) return;

    const serviceDurationMap = await this.getServiceDurationMap(params.organizationId);
    const requestedStart = this.toDate(params.date);
    if (Number.isNaN(requestedStart.getTime())) {
      throw new Error("Ngày giờ lịch hẹn không hợp lệ");
    }

    const requestedDuration = this.getBookingDurationMinutes(params.guests, serviceDurationMap);
    const requestedEnd = new Date(requestedStart.getTime() + requestedDuration * 60_000);
    const bufferMs = Math.max(0, Number(policy.bufferMinutes ?? 0)) * 60_000;
    const requestedWindowStart = requestedStart.getTime() - bufferMs;
    const requestedWindowEnd = requestedEnd.getTime() + bufferMs;

    const windowFrom = new Date(requestedStart.getTime() - 24 * 60 * 60 * 1000);
    const windowTo = new Date(requestedEnd.getTime() + 24 * 60 * 60 * 1000);

    const candidateBookings = await this.db.query.bookings.findMany({
      where: and(
        eq(bookings.organizationId, params.organizationId),
        gte(bookings.date, windowFrom),
        lte(bookings.date, windowTo),
        inArray(bookings.status, ["pending", "confirmed", "checkin"]),
      ),
      with: {
        customer: true,
      },
    });

    for (const candidate of candidateBookings) {
      if (params.excludeBookingId && candidate.id === params.excludeBookingId) {
        continue;
      }

      const candidateStaffIds = this.getAssignedStaffIds(candidate.guests as unknown);
      const hasSharedStaff = candidateStaffIds.some((id) => assignedStaffIds.includes(id));
      if (!hasSharedStaff) continue;

      const candidateStart = this.toDate(candidate.date);
      const candidateDuration = this.getBookingDurationMinutes(
        candidate.guests as unknown,
        serviceDurationMap,
      );
      const candidateEnd = new Date(candidateStart.getTime() + candidateDuration * 60_000);
      const candidateWindowStart = candidateStart.getTime() - bufferMs;
      const candidateWindowEnd = candidateEnd.getTime() + bufferMs;

      const overlaps =
        requestedWindowStart < candidateWindowEnd && requestedWindowEnd > candidateWindowStart;

      if (overlaps) {
        throw new Error(
          `Nhân viên đã có lịch trùng khung giờ (booking #${candidate.id})`,
        );
      }
    }
  }

  async findAll(organizationId: string, filters?: BookingFilters): Promise<PaginatedResult<any>> {
    const { branchId, from, to, status, search, page = 1, limit = 20 } = filters || {};

    // Build base query conditions
    const conditions: any[] = [eq(bookings.organizationId, organizationId)];
    if (branchId) {
      conditions.push(eq(bookings.branchId, branchId));
    }

    // Date range filter
    if (from) {
      conditions.push(gte(bookings.date, from));
    }
    if (to) {
      // 'to' is already set to end of day by the controller, use directly
      conditions.push(lte(bookings.date, to));
    }

    // Status filter
    if (status && status !== "all") {
      conditions.push(eq(bookings.status, status as any));
    }

    // Get total count first (without pagination)
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(...conditions))
      .then((rows) => rows[0]);

    const total = countResult?.count || 0;

    // Get paginated data with relations
    let data = await this.db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        branch: true,
        // bookingServices removed. Guests column is now used.
      },
      orderBy: [desc(bookings.date)],
      limit: limit,
      offset: (page - 1) * limit,
    });

    // Filter by search if provided (customer name or phone)
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(
        (b: any) =>
          b.customer?.name?.toLowerCase().includes(searchLower) ||
          b.customer?.phone?.includes(search),
      );
    }

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllSimple(organizationId: string, branchId?: number) {
    const conditions = [eq(bookings.organizationId, organizationId)];
    if (branchId) {
      conditions.push(eq(bookings.branchId, branchId));
    }
    return this.db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        branch: true,
        // bookingServices removed
      },
      orderBy: (bookings, { desc }) => [desc(bookings.date)],
    });
  }

  async findById(id: number, organizationId: string) {
    return this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId)))
      .then((rows) => rows[0]);
  }

  async findByOrganizationId(organizationId: string) {
    return this.findAllSimple(organizationId);
  }

  async findByCustomerId(customerId: number, organizationId: string) {
    return this.db
      .select()
      .from(bookings)
      .where(and(eq(bookings.customerId, customerId), eq(bookings.organizationId, organizationId)));
  }

  async create(data: any) {
    // Input normalization
    // Data now strictly follows createBookingSchema with guests array
    const guests = data.guests || [];

    const status = data.status ?? "pending";
    const policy = await this.getPolicy(data.organizationId);

    let depositAmount = Number(data.depositAmount ?? 0);
    if (policy.requireDeposit && depositAmount <= 0) {
      depositAmount = Number(policy.defaultDepositAmount ?? 0);
    }
    const depositPaid = Number(data.depositPaid ?? 0);
    if (depositAmount < 0 || depositPaid < 0) {
      throw new Error("Thông tin đặt cọc không hợp lệ");
    }
    if (depositPaid > depositAmount) {
      throw new Error("Số tiền đã cọc không thể lớn hơn số tiền cần cọc");
    }

    if (this.isActiveStatus(status)) {
      await this.ensureNoStaffConflicts({
        organizationId: data.organizationId,
        date: data.date,
        guests,
      });
    }

    // Insert Booking with guests JSON
    const resolvedBranchId = await this.resolveBranchId(data.organizationId, data.branchId);

    const bookingData: NewBooking = {
      organizationId: data.organizationId,
      customerId: data.customerId,
      branchId: resolvedBranchId,
      date: data.date,
      status,
      depositAmount,
      depositPaid,
      noShowReason: status === "no_show" ? (data.noShowReason ?? null) : null,
      noShowAt: status === "no_show" ? new Date() : null,
      guestCount: data.guestCount,
      notes: data.notes,
      guests: guests, // Direct JSON insert
    };

    const [booking] = await this.db.insert(bookings).values(bookingData).returning();

    // Legacy bookingServices insertion REMOVED.
    // We rely entirely on the 'guests' JSON column.

    // Return the full booking with customer relation
    return this.db.query.bookings.findFirst({
      where: eq(bookings.id, booking.id),
      with: {
        customer: true,
        branch: true,
      },
    });
  }

  async update(id: number, organizationId: string, data: Partial<NewBooking>) {
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const payload: Partial<NewBooking> = { ...data };
    if (typeof payload.branchId === "number" && payload.branchId > 0) {
      payload.branchId = await this.resolveBranchId(organizationId, payload.branchId);
    }

    const hasDepositAmount = typeof payload.depositAmount !== "undefined";
    const hasDepositPaid = typeof payload.depositPaid !== "undefined";
    const depositAmount = Number(hasDepositAmount ? payload.depositAmount : 0);
    const depositPaid = Number(hasDepositPaid ? payload.depositPaid : 0);

    if (hasDepositAmount && depositAmount < 0) {
      throw new Error("Số tiền cọc phải lớn hơn hoặc bằng 0");
    }
    if (hasDepositPaid && depositPaid < 0) {
      throw new Error("Số tiền đã cọc phải lớn hơn hoặc bằng 0");
    }

    if (hasDepositAmount && hasDepositPaid && depositPaid > depositAmount) {
      throw new Error("Số tiền đã cọc không thể lớn hơn số tiền cần cọc");
    }

    if (hasDepositAmount || hasDepositPaid) {
      const finalDepositAmount = hasDepositAmount ? depositAmount : Number(existing.depositAmount ?? 0);
      const finalDepositPaid = hasDepositPaid ? depositPaid : Number(existing.depositPaid ?? 0);
      if (finalDepositPaid > finalDepositAmount) {
        throw new Error("Số tiền đã cọc không thể lớn hơn số tiền cần cọc");
      }
    }

    // Auto-mark no-show timestamp and clear no-show info when status changes away.
    if (payload.status === "no_show") {
      payload.noShowAt = payload.noShowAt ?? new Date();
      if (!payload.noShowReason) {
        payload.noShowReason = "Khách không đến";
      }
    } else if (payload.status) {
      payload.noShowAt = null;
      payload.noShowReason = null;
    }

    const nextStatus = String(payload.status ?? existing.status);
    const nextDate = payload.date ?? existing.date;
    const nextGuests = payload.guests ?? existing.guests;
    if (this.isActiveStatus(nextStatus)) {
      await this.ensureNoStaffConflicts({
        organizationId,
        date: nextDate,
        guests: nextGuests,
        excludeBookingId: id,
      });
    }

    const result = await this.db
      .update(bookings)
      .set(payload)
      .where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const result = await this.db
      .delete(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  // Get statistics for the dashboard
  async getStats(organizationId: string, from?: Date, to?: Date, branchId?: number) {
    const conditions: any[] = [eq(bookings.organizationId, organizationId)];
    if (branchId) conditions.push(eq(bookings.branchId, branchId));

    if (from) conditions.push(gte(bookings.date, from));
    if (to) {
      // 'to' is already set to end of day by the controller
      conditions.push(lte(bookings.date, to));
    }

    const allBookings = await this.db
      .select({ status: bookings.status })
      .from(bookings)
      .where(and(...conditions));

    const total = allBookings.length;
    const pending = allBookings.filter((b) => b.status === "pending").length;
    const confirmed = allBookings.filter((b) => b.status === "confirmed").length;
    const completed = allBookings.filter((b) => b.status === "completed").length;
    const cancelled = allBookings.filter((b) => b.status === "cancelled").length;
    const noShow = allBookings.filter((b) => b.status === "no_show").length;
    const lost = cancelled + noShow;

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      noShow,
      cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      noShowRate: total > 0 ? Math.round((noShow / total) * 100) : 0,
      lostRate: total > 0 ? Math.round((lost / total) * 100) : 0,
    };
  }
}
