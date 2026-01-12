import { Hono } from "hono";
import { createDb } from "../db";
import { createAuth } from "../lib/auth";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

export const authController = new Hono<{ Bindings: Bindings }>();

// Handle all auth routes (login, register, logout, etc.)
authController.all("/*", async (c) => {
  console.log(c);
  const db = createDb(c.env.DB);
  const auth = createAuth(db, {
    BETTER_AUTH_SECRET: c.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: c.env.BETTER_AUTH_URL,
  });

  return auth.handler(c.req.raw);
});
