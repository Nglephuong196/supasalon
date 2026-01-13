import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Database } from "../db";
import * as schema from "../db/schema";

export function createAuth(db: Database, env: { BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string }) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema as any,
      usePlural: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: ["http://localhost:5173", "http://127.0.0.1:5173"],
    emailAndPassword: {
      enabled: true,
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user, context) => {
            // Get custom fields from the request body
            const body = context?.body as {
              salonName?: string;
              province?: string;
              address?: string;
              phone?: string;
            } | undefined;

            // Create salon if salonName was provided
            if (body?.salonName) {
              await db.insert(schema.salons).values({
                ownerId: user.id,
                name: body.salonName,
                address: body.province
                  ? `${body.address || ""}, ${body.province}`.trim()
                  : body.address || null,
                phone: body.phone || null,
              });
            }
          },
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
