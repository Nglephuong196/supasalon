import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { type NewUser, user } from "../db/schema";

export class UsersService {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.select().from(user);
  }

  async findById(id: string) {
    return this.db.select().from(user).where(eq(user.id, id)).then((rows) => rows[0]);
  }

  async findByEmail(email: string) {
    return this.db.select().from(user).where(eq(user.email, email)).then((rows) => rows[0]);
  }

  async create(data: NewUser) {
    const result = await this.db.insert(user).values(data).returning();
    return result[0];
  }

  async update(id: string, data: Partial<NewUser>) {
    const result = await this.db.update(user).set(data).where(eq(user.id, id)).returning();
    return result[0];
  }

  async delete(id: string) {
    const result = await this.db.delete(user).where(eq(user.id, id)).returning();
    return result[0];
  }
}
