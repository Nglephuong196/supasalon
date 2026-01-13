import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { invoices, bookings, type NewInvoice } from "../db/schema";

export class InvoicesService {
  constructor(private db: Database) { }

  async findAll(organizationId: string) {
    // We need to filter by organizationId which is on the booking
    // Drizzle's query builder doesn't support deep filtering easily on the root findMany without where clause on the root table if relying on relation filtering
    // But we don't have organizationId on invoices table directly.
    // However, we can filter using the relation if we query bookings instead? No we want invoices.

    // We can use the existing select with join, but we want structured data.
    // Actually, `query.invoices.findMany` filtering by a relation field involves slightly more complex syntax or might not be fully supported for deep where depending on driver/version.
    // But wait, the schema says:
    // export const invoices = sqliteTable("invoices", { ... })
    // It does NOT have organizationId.

    // Let's stick to the join, but format the result to match what we want, or fetch more data.
    // Or, simpler: Query bookings that have invoices?

    // Let's try to keep using query builder if possible. 
    // `where: (invoices, { exists, select, eq }) => exists(select().from(bookings).where(and(eq(bookings.id, invoices.bookingId), eq(bookings.organizationId, organizationId))))`
    // This is getting complicated.

    // Let's use the DB query builder but fetch necessary fields via join and map them?
    // Or just use the manual join I had, but add selection for customer/service?

    return this.db.query.invoices.findMany({
      with: {
        booking: {
          with: {
            customer: true,
            service: true
          }
        }
      },
      where: (invoices, { exists, eq, and }) => exists(
        this.db.select().from(bookings).where(
          and(
            eq(bookings.id, invoices.bookingId),
            eq(bookings.organizationId, organizationId)
          )
        )
      )
    });
  }

  async findById(id: number, organizationId: string) {
    const result = await this.db
      .select({
        id: invoices.id,
        bookingId: invoices.bookingId,
        amount: invoices.amount,
        status: invoices.status,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .where(and(eq(invoices.id, id), eq(bookings.organizationId, organizationId)))
      .get();

    return result;
  }

  async findByBookingId(bookingId: number, organizationId: string) {
    const result = await this.db
      .select({
        id: invoices.id,
        bookingId: invoices.bookingId,
        amount: invoices.amount,
        status: invoices.status,
        paidAt: invoices.paidAt,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .innerJoin(bookings, eq(invoices.bookingId, bookings.id))
      .where(and(eq(invoices.bookingId, bookingId), eq(bookings.organizationId, organizationId)))
      .get();

    return result;
  }

  async create(data: NewInvoice, organizationId: string) {
    // Verify booking belongs to salon
    const booking = await this.db.select().from(bookings).where(and(eq(bookings.id, data.bookingId), eq(bookings.organizationId, organizationId))).get();

    if (!booking) {
      throw new Error("Booking not found or access denied");
    }

    const result = await this.db.insert(invoices).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewInvoice>) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result[0];
  }
}
