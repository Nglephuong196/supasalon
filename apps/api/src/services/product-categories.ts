import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { productCategories, type NewProductCategory } from "../db/schema";

export class ProductCategoriesService {
    constructor(private db: Database) { }

    async findAll(organizationId: string) {
        return this.db.select().from(productCategories).where(eq(productCategories.organizationId, organizationId));
    }

    async findById(id: number, organizationId: string) {
        return this.db.select().from(productCategories)
            .where(and(eq(productCategories.id, id), eq(productCategories.organizationId, organizationId)))
            .get();
    }

    async create(organizationId: string, data: Omit<NewProductCategory, 'organizationId'>) {
        const result = await this.db.insert(productCategories).values({ ...data, organizationId }).returning();
        return result[0];
    }

    async update(id: number, organizationId: string, data: Partial<Omit<NewProductCategory, 'organizationId'>>) {
        const category = await this.findById(id, organizationId);
        if (!category) return undefined;

        const result = await this.db.update(productCategories).set(data).where(eq(productCategories.id, id)).returning();
        return result[0];
    }

    async delete(id: number, organizationId: string) {
        const category = await this.findById(id, organizationId);
        if (!category) return undefined;

        const result = await this.db.delete(productCategories).where(eq(productCategories.id, id)).returning();
        return result[0];
    }
}
