import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { invoices, type NewInvoice } from "../db/schema";

export class InvoicesService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(invoices);
  }

  async findById(id: number) {
    return this.db.select().from(invoices).where(eq(invoices.id, id)).get();
  }

  async findByBookingId(bookingId: number) {
    return this.db.select().from(invoices).where(eq(invoices.bookingId, bookingId)).get();
  }

  async create(data: NewInvoice) {
    const result = await this.db.insert(invoices).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewInvoice>) {
    const result = await this.db.update(invoices).set(data).where(eq(invoices.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result[0];
  }
}
