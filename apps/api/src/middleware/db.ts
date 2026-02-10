import { createMiddleware } from "hono/factory";
import { type Database, createDb } from "../db";

type Env = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    db: Database;
  };
};

export const initDb = createMiddleware<Env>(async (c, next) => {
  const db = createDb(c.env.DB);
  c.set("db", db);
  await next();
});
