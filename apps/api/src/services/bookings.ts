import { eq, and, gte, lte, like, or, desc, sql } from "drizzle-orm";
import type { Database } from "../db";
import { bookings, customers, type NewBooking } from "../db/schema";

export interface BookingFilters {
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
  constructor(private db: Database) { }

  async findAll(organizationId: string, filters?: BookingFilters): Promise<PaginatedResult<any>> {
    const { from, to, status, search, page = 1, limit = 20 } = filters || {};

    // Build base query conditions
    const conditions: any[] = [eq(bookings.organizationId, organizationId)];

    // Date range filter
    if (from) {
      conditions.push(gte(bookings.date, from));
    }
    if (to) {
      // Add 1 day to include the full "to" date
      const toEnd = new Date(to);
      toEnd.setDate(toEnd.getDate() + 1);
      conditions.push(lte(bookings.date, toEnd));
    }

    // Status filter
    if (status && status !== 'all') {
      conditions.push(eq(bookings.status, status as any));
    }

    // Get total count first (without pagination)
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(bookings)
      .where(and(...conditions))
      .get();

    const total = countResult?.count || 0;

    // Get paginated data with relations
    let data = await this.db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        service: {
          with: {
            category: true,
          }
        },
      },
      orderBy: [desc(bookings.date)],
      limit: limit,
      offset: (page - 1) * limit,
    });

    // Filter by search if provided (customer name or phone)
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter((b: any) =>
        b.customer?.name?.toLowerCase().includes(searchLower) ||
        b.customer?.phone?.includes(search)
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

  async findAllSimple(organizationId: string) {
    return this.db.query.bookings.findMany({
      where: eq(bookings.organizationId, organizationId),
      with: {
        customer: true,
        service: true,
      },
      orderBy: (bookings, { desc }) => [desc(bookings.date)],
    });
  }

  async findById(id: number, organizationId: string) {
    return this.db.select().from(bookings).where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId))).get();
  }

  async findByOrganizationId(organizationId: string) {
    return this.findAllSimple(organizationId);
  }

  async findByCustomerId(customerId: number, organizationId: string) {
    return this.db.select().from(bookings).where(and(eq(bookings.customerId, customerId), eq(bookings.organizationId, organizationId)));
  }

  async create(data: NewBooking) {
    const result = await this.db.insert(bookings).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewBooking>) {
    const result = await this.db.update(bookings).set(data).where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId))).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const result = await this.db.delete(bookings).where(and(eq(bookings.id, id), eq(bookings.organizationId, organizationId))).returning();
    return result[0];
  }

  // Get statistics for the dashboard
  async getStats(organizationId: string, from?: Date, to?: Date) {
    const conditions: any[] = [eq(bookings.organizationId, organizationId)];

    if (from) conditions.push(gte(bookings.date, from));
    if (to) {
      const toEnd = new Date(to);
      toEnd.setDate(toEnd.getDate() + 1);
      conditions.push(lte(bookings.date, toEnd));
    }

    const allBookings = await this.db
      .select({ status: bookings.status })
      .from(bookings)
      .where(and(...conditions));

    const total = allBookings.length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;

    return {
      total,
      pending,
      confirmed,
      completed,
      cancelled,
      cancelRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
    };
  }
}
