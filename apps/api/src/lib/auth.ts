import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization, bearer } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import type { Database } from "../db";
import * as schema from "../db/schema";

export function createAuth(
  db: Database,
  env: { BETTER_AUTH_SECRET: string; BETTER_AUTH_URL: string },
) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema: schema as any,
      usePlural: false,
    }),
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    basePath: "/api/auth",
    trustedOrigins: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:8081",
      "http://10.0.2.2:8081",
      "supasalon://",
      "exp://", // Expo development
      "exp://**",
    ],
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      expo({
        disableOriginOverride: true, // Required for Cloudflare Workers
      }),
      organization({
        allowUserToCreateOrganization: true,
      }),
      bearer(), // Enable Bearer token authentication for mobile
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
