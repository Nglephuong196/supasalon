import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { serviceCategories, type NewServiceCategory } from "../db/schema";

export class ServiceCategoriesService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(serviceCategories);
  }

  async findById(id: number) {
    return this.db.select().from(serviceCategories).where(eq(serviceCategories.id, id)).get();
  }

  async findBySalonId(salonId: number) {
    return this.db.select().from(serviceCategories).where(eq(serviceCategories.salonId, salonId));
  }

  async create(data: NewServiceCategory) {
    const result = await this.db.insert(serviceCategories).values(data).returning();
    return result[0];
  }

  async update(id: number, data: Partial<NewServiceCategory>) {
    const result = await this.db.update(serviceCategories).set(data).where(eq(serviceCategories.id, id)).returning();
    return result[0];
  }

  async delete(id: number) {
    const result = await this.db.delete(serviceCategories).where(eq(serviceCategories.id, id)).returning();
    return result[0];
  }
}
