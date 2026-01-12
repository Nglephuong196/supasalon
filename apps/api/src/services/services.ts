import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { services, type NewService } from "../db/schema";

export class ServicesService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(services);
  }

  async findById(id: number) {
    return this.db.select().from(services).where(eq(services.id, id)).get();
  }

  async findByCategoryId(categoryId: number) {
    return this.db.select().from(services).where(eq(services.categoryId, categoryId));
  }

  async create(data: NewService) {
    const result = await this.db.insert(services).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewService>) {
    const result = await this.db.update(services).set(data).where(eq(services.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(services).where(eq(services.id, id)).returning();
    return result[0];
  }
}
