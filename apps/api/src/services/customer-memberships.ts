import { eq, and } from "drizzle-orm";
import type { Database } from "../db";
import { customerMemberships, customers, type NewCustomerMembership } from "../db/schema";

export class CustomerMembershipsService {
  constructor(private db: Database) {}

  async findAll(organizationId: string) {
    return this.db.query.customerMemberships.findMany({
      with: {
        customer: true,
      },
      where: (memberships, { exists, eq, and }) =>
        exists(
          this.db
            .select()
            .from(customers)
            .where(
              and(
                eq(customers.id, memberships.customerId),
                eq(customers.organizationId, organizationId),
              ),
            ),
        ),
    });
  }

  async findById(id: number, organizationId: string) {
    const result = await this.db
      .select({
        id: customerMemberships.id,
        customerId: customerMemberships.customerId,
        type: customerMemberships.type,
        status: customerMemberships.status,
        startDate: customerMemberships.startDate,
        endDate: customerMemberships.endDate,
        notes: customerMemberships.notes,
        createdAt: customerMemberships.createdAt,
      })
      .from(customerMemberships)
      .innerJoin(customers, eq(customerMemberships.customerId, customers.id))
      .where(and(eq(customerMemberships.id, id), eq(customers.organizationId, organizationId)))
      .get();

    return result;
  }

  async findByCustomerId(customerId: number, organizationId: string) {
    // Verify customer belongs to org
    const customer = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)))
      .get();

    if (!customer) return [];

    return this.db
      .select()
      .from(customerMemberships)
      .where(eq(customerMemberships.customerId, customerId));
  }

  async create(data: NewCustomerMembership, organizationId: string) {
    // Verify customer belongs to org
    const customer = await this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, data.customerId), eq(customers.organizationId, organizationId)))
      .get();

    if (!customer) {
      throw new Error("Customer not found or access denied");
    }

    const result = await this.db.insert(customerMemberships).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewCustomerMembership>) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db
      .update(customerMemberships)
      .set(data)
      .where(eq(customerMemberships.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db
      .delete(customerMemberships)
      .where(eq(customerMemberships.id, id))
      .returning();
    return result[0];
  }
}
