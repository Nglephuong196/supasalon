import { Hono } from "hono";
import { createAuth } from "../lib/auth";
import type { Database } from "../db";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

type Variables = {
  db: Database;
};

export const authController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Handle all auth routes (login, register, logout, etc.)
authController.all("/*", async (c) => {
  const db = c.get("db");
  const auth = createAuth(db, {
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
  });

  return auth.handler(c.req.raw);
});
