import { and, desc, eq, isNotNull, like, or, sql } from "drizzle-orm";
import type { Database } from "../db";
import { type NewCustomer, customers } from "../db/schema";

type CustomerListOptions = {
  page?: number;
  limit?: number;
  search?: string;
  vipOnly?: boolean;
};

type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export class CustomersService {
  constructor(private db: Database) {}

  async findAll(organizationId: string) {
    return this.db.query.customers.findMany({
      where: eq(customers.organizationId, organizationId),
      with: {
        membershipTier: true,
      },
      orderBy: [desc(customers.createdAt)],
    });
  }

  async findPage(
    organizationId: string,
    options: CustomerListOptions,
  ): Promise<PaginatedResult<Awaited<ReturnType<CustomersService["findAll"]>>[number]>> {
    const { page = 1, limit = 20, search, vipOnly = false } = options;
    const conditions: Array<ReturnType<typeof eq>> = [eq(customers.organizationId, organizationId)];

    if (search) {
      const pattern = `%${search.trim()}%`;
      conditions.push(
        or(
          like(customers.name, pattern),
          like(customers.phone, pattern),
          like(customers.email, pattern),
        )!,
      );
    }

    if (vipOnly) {
      conditions.push(isNotNull(customers.membershipTierId));
    }

    const whereClause = and(...conditions);
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause)
      .get();

    const total = countResult?.count ?? 0;
    const data = await this.db.query.customers.findMany({
      where: whereClause,
      with: {
        membershipTier: true,
      },
      orderBy: [desc(customers.createdAt)],
      limit,
      offset: (page - 1) * limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async findById(id: number, organizationId: string) {
    return this.db
      .select()
      .from(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
      .get();
  }

  async findByOrganizationId(organizationId: string) {
    return this.findAll(organizationId);
  }

  async create(data: NewCustomer) {
    const result = await this.db.insert(customers).values(data).returning();
    return result[0];
  }

  async update(id: number, organizationId: string, data: Partial<NewCustomer>) {
    const result = await this.db
      .update(customers)
      .set(data)
      .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
      .returning();
    return result[0];
  }

  async delete(id: number, organizationId: string) {
    const result = await this.db
      .delete(customers)
      .where(and(eq(customers.id, id), eq(customers.organizationId, organizationId)))
      .returning();
    return result[0];
  }
}
