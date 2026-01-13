import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { services, serviceCategories, type NewService } from "../db/schema";

export class ServicesService {
  constructor(private db: Database) { }

  async findAll(organizationId: string) {
    return this.db.select({
      id: services.id,
      categoryId: services.categoryId,
      name: services.name,
      description: services.description,
      price: services.price,
      duration: services.duration,
      createdAt: services.createdAt,
    })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(eq(serviceCategories.organizationId, organizationId));
  }

  async findById(id: number, organizationId: string) {
    return this.db.select({
      id: services.id,
      categoryId: services.categoryId,
      name: services.name,
      description: services.description,
      price: services.price,
      duration: services.duration,
      createdAt: services.createdAt,
    })
      .from(services)
      .innerJoin(serviceCategories, eq(services.categoryId, serviceCategories.id))
      .where(and(eq(services.id, id), eq(serviceCategories.organizationId, organizationId)))
      .get();
  }

  async findByCategoryId(categoryId: number, organizationId: string) {
    // Also verify category belongs to salon
    const category = await this.db.select().from(serviceCategories).where(and(eq(serviceCategories.id, categoryId), eq(serviceCategories.organizationId, organizationId))).get();
    if (!category) return [];

    return this.db.select().from(services).where(eq(services.categoryId, categoryId));
  }

  async create(data: NewService, organizationId: string) {
    // Verify category belongs to salon
    const category = await this.db.select().from(serviceCategories).where(and(eq(serviceCategories.id, data.categoryId), eq(serviceCategories.organizationId, organizationId))).get();

    if (!category) {
      throw new Error("Invalid category for this organization");
    }

    const result = await this.db.insert(services).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewService>) {
    // Verify service belongs to salon
    const service = await this.findById(id, organizationId);
    if (!service) return undefined;

    // If changing category, verify new category belongs to salon
    if (data.categoryId) {
      const category = await this.db.select().from(serviceCategories).where(and(eq(serviceCategories.id, data.categoryId), eq(serviceCategories.organizationId, organizationId))).get();
      if (!category) {
        throw new Error("Invalid category for this organization");
      }
    }

    const result = await this.db.update(services).set(data).where(eq(services.id, id)).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const service = await this.findById(id, organizationId);
    if (!service) return undefined;

    const result = await this.db.delete(services).where(eq(services.id, id)).returning();
    return result[0];
  }
}
