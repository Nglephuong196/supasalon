import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { customers, type NewCustomer } from "../db/schema";

export class CustomersService {
  constructor(private db: Database) { }

  async findAll(organizationId: string) {
    return this.db.select().from(customers).where(eq(customers.organizationId, organizationId));
  }

  async findById(id: number, organizationId: string) {
    return this.db.select().from(customers).where(and(eq(customers.id, id), eq(customers.organizationId, organizationId))).get();
  }

  async findByOrganizationId(organizationId: string) {
    return this.findAll(organizationId);
  }

  async create(data: NewCustomer) {
    const result = await this.db.insert(customers).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewCustomer>) {
    const result = await this.db.update(customers).set(data).where(and(eq(customers.id, id), eq(customers.organizationId, organizationId))).returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const result = await this.db.delete(customers).where(and(eq(customers.id, id), eq(customers.organizationId, organizationId))).returning();
    return result[0];
  }
}
