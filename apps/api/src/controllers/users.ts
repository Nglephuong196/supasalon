import { Hono } from "hono";
import { createDb } from "../db";
import { UsersService } from "../services";
import type { NewUser } from "../db/schema";

type Bindings = { DB: D1Database };

export const usersController = new Hono<{ Bindings: Bindings }>();

usersController.get("/", async (c) => {
  const service = new UsersService(createDb(c.env.DB));
  const users = await service.findAll();
  return c.json(users);
});

usersController.get("/:id", async (c) => {
  const service = new UsersService(createDb(c.env.DB));
  const id = c.req.param("id");
  const user = await service.findById(id);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

usersController.post("/", async (c) => {
  const service = new UsersService(createDb(c.env.DB));
  const body = await c.req.json<NewUser>();
  const user = await service.create(body);
  return c.json(user, 201);
});

usersController.put("/:id", async (c) => {
  const service = new UsersService(createDb(c.env.DB));
  const id = c.req.param("id");
  const body = await c.req.json<Partial<NewUser>>();
  const user = await service.update(id, body);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

usersController.delete("/:id", async (c) => {
  const service = new UsersService(createDb(c.env.DB));
  const id = c.req.param("id");
  const user = await service.delete(id);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ message: "User deleted" });
});
