import { and, desc, eq } from "drizzle-orm";
import type { Database } from "../db";
import { type NewMembershipTier, customers, membershipTiers } from "../db/schema";

export class MembershipTiersService {
  constructor(private db: Database) {}

  async findAll(organizationId: string) {
    return this.db
      .select()
      .from(membershipTiers)
      .where(eq(membershipTiers.organizationId, organizationId))
      .orderBy(desc(membershipTiers.minSpending));
  }

  async findById(id: number, organizationId: string) {
    return this.db
      .select()
      .from(membershipTiers)
      .where(and(eq(membershipTiers.id, id), eq(membershipTiers.organizationId, organizationId)))
      .get();
  }

  async create(data: Omit<NewMembershipTier, "organizationId">, organizationId: string) {
    const result = await this.db
      .insert(membershipTiers)
      .values({
        ...data,
        organizationId,
      })
      .returning();
    return result[0];
  }

  async update(
    id: number,
    organizationId: string,
    data: Partial<Omit<NewMembershipTier, "organizationId">>,
  ) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db
      .update(membershipTiers)
      .set(data)
      .where(eq(membershipTiers.id, id))
      .returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    // First verify access
    const existing = await this.findById(id, organizationId);
    if (!existing) return undefined;

    const result = await this.db
      .delete(membershipTiers)
      .where(eq(membershipTiers.id, id))
      .returning();
    return result[0];
  }

  /**
   * Calculate the appropriate tier for a customer based on their total spent.
   * Returns the highest tier they qualify for, or null if none.
   */
  async calculateTierForCustomer(customerId: number, organizationId: string) {
    // Get customer's total spent
    const customer = await this.db
      .select({ totalSpent: customers.totalSpent })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)))
      .get();

    if (!customer) return null;

    // Get all tiers for this organization, ordered by minSpending descending
    const tiers = await this.findAll(organizationId);

    // Find the highest tier the customer qualifies for
    for (const tier of tiers) {
      if (customer.totalSpent >= tier.minSpending) {
        return tier;
      }
    }

    return null;
  }

  /**
   * Update a customer's tier based on their current spending.
   * Call this after a booking is completed and payment is received.
   */
  async updateCustomerTier(customerId: number, organizationId: string) {
    const newTier = await this.calculateTierForCustomer(customerId, organizationId);

    const result = await this.db
      .update(customers)
      .set({ membershipTierId: newTier?.id ?? null })
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)))
      .returning();

    return result[0];
  }

  /**
   * Add to customer's total spent and recalculate their tier.
   */
  async addCustomerSpending(customerId: number, organizationId: string, amount: number) {
    // Get current total
    const customer = await this.db
      .select({ totalSpent: customers.totalSpent })
      .from(customers)
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)))
      .get();

    if (!customer) return null;

    // Update total spent
    await this.db
      .update(customers)
      .set({ totalSpent: customer.totalSpent + amount })
      .where(and(eq(customers.id, customerId), eq(customers.organizationId, organizationId)));

    // Recalculate tier
    return this.updateCustomerTier(customerId, organizationId);
  }
}
