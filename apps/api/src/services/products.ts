import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { products, productCategories, type NewProduct } from "../db/schema";

export class ProductsService {
  constructor(private db: Database) {}

  async findAll(organizationId: string) {
    return this.db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        minStock: products.minStock,
        sku: products.sku,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(eq(productCategories.organizationId, organizationId));
  }

  async findById(id: number, organizationId: string) {
    return this.db
      .select({
        id: products.id,
        categoryId: products.categoryId,
        name: products.name,
        description: products.description,
        price: products.price,
        stock: products.stock,
        minStock: products.minStock,
        sku: products.sku,
        createdAt: products.createdAt,
      })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(and(eq(products.id, id), eq(productCategories.organizationId, organizationId)))
      .get();
  }

  async findByCategoryId(categoryId: number, organizationId: string) {
    const category = await this.db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, categoryId),
          eq(productCategories.organizationId, organizationId),
        ),
      )
      .get();
    if (!category) return [];

    return this.db.select().from(products).where(eq(products.categoryId, categoryId));
  }

  async create(data: NewProduct, organizationId: string) {
    const category = await this.db
      .select()
      .from(productCategories)
      .where(
        and(
          eq(productCategories.id, data.categoryId),
          eq(productCategories.organizationId, organizationId),
        ),
      )
      .get();

    if (!category) {
      throw new Error("Danh mục không hợp lệ cho tổ chức này");
    }

    const result = await this.db.insert(products).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewProduct>) {
    const product = await this.findById(id, organizationId);
    if (!product) return undefined;

    if (data.categoryId) {
      const category = await this.db
        .select()
        .from(productCategories)
        .where(
          and(
            eq(productCategories.id, data.categoryId),
            eq(productCategories.organizationId, organizationId),
          ),
        )
        .get();
      if (!category) {
        throw new Error("Danh mục không hợp lệ cho tổ chức này");
      }
    }

    const result = await this.db.update(products).set(data).where(eq(products.id, id)).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const product = await this.findById(id, organizationId);
    if (!product) return undefined;

    const result = await this.db.delete(products).where(eq(products.id, id)).returning();
    return result[0];
  }
}
