import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { bookings, type NewBooking } from "../db/schema";

export class BookingsService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(bookings);
  }

  async findById(id: number) {
    return this.db.select().from(bookings).where(eq(bookings.id, id)).get();
  }

  async findBySalonId(salonId: number) {
    return this.db.select().from(bookings).where(eq(bookings.salonId, salonId));
  }

  async findByCustomerId(customerId: number) {
    return this.db.select().from(bookings).where(eq(bookings.customerId, customerId));
  }

  async create(data: NewBooking) {
    const result = await this.db.insert(bookings).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewBooking>) {
    const result = await this.db.update(bookings).set(data).where(eq(bookings.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(bookings).where(eq(bookings.id, id)).returning();
    return result[0];
  }
}
