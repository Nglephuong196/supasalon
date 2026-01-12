import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { salons, type NewSalon } from "../db/schema";

export class SalonsService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(salons);
  }

  async findById(id: number) {
    return this.db.select().from(salons).where(eq(salons.id, id)).get();
  }

  async findByOwnerId(ownerId: string) {
    return this.db.select().from(salons).where(eq(salons.ownerId, ownerId));
  }

  async create(data: NewSalon) {
    const result = await this.db.insert(salons).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewSalon>) {
    const result = await this.db.update(salons).set(data).where(eq(salons.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(salons).where(eq(salons.id, id)).returning();
    return result[0];
  }
}
