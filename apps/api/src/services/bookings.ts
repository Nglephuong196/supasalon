import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { bookings, type NewBooking } from "../db/schema";

export class BookingsService {
  constructor(private db: Database) { }

  async findAll(organizationId: string) {
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
    return this.findAll(organizationId);
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
}
