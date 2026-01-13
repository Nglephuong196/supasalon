import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { serviceCategories, type NewServiceCategory } from "../db/schema";

export class ServiceCategoriesService {
  constructor(private db: Database) { }

  async findAll(organizationId: string) {
    return this.db.select().from(serviceCategories).where(eq(serviceCategories.organizationId, organizationId));
  }

  async findById(id: number, organizationId: string) {
    return this.db.select().from(serviceCategories).where(and(eq(serviceCategories.id, id), eq(serviceCategories.organizationId, organizationId))).get();
  }

  async create(data: NewServiceCategory) {
    const result = await this.db.insert(serviceCategories).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewServiceCategory>) {
    const result = await this.db.update(serviceCategories).set(data).where(and(eq(serviceCategories.id, id), eq(serviceCategories.organizationId, organizationId))).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const result = await this.db.delete(serviceCategories).where(and(eq(serviceCategories.id, id), eq(serviceCategories.organizationId, organizationId))).returning();
    return result[0];
  }
}
