import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { customers, type NewCustomer } from "../db/schema";

export class CustomersService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(customers);
  }

  async findById(id: number) {
    return this.db.select().from(customers).where(eq(customers.id, id)).get();
  }

  async findBySalonId(salonId: number) {
    return this.db.select().from(customers).where(eq(customers.salonId, salonId));
  }

  async create(data: NewCustomer) {
    const result = await this.db.insert(customers).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewCustomer>) {
    const result = await this.db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(customers).where(eq(customers.id, id)).returning();
    return result[0];
  }
}
