import { Hono } from "hono";
import { createDb } from "../db";
import { SalonsService } from "../services";
import type { NewSalon } from "../db/schema";

type Bindings = { DB: D1Database };

export const salonsController = new Hono<{ Bindings: Bindings }>();

salonsController.get("/", async (c) => {
  const service = new SalonsService(createDb(c.env.DB));
  const salons = await service.findAll();
  return c.json(salons);
});

salonsController.get("/:id", async (c) => {
  const service = new SalonsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const salon = await service.findById(id);
  if (!salon) return c.json({ error: "Salon not found" }, 404);
  return c.json(salon);
});

salonsController.post("/", async (c) => {
  const service = new SalonsService(createDb(c.env.DB));
  const body = await c.req.json<NewSalon>();
  const salon = await service.create(body);
  return c.json(salon, 201);
});

salonsController.put("/:id", async (c) => {
  const service = new SalonsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewSalon>>();
  const salon = await service.update(id, body);
  if (!salon) return c.json({ error: "Salon not found" }, 404);
  return c.json(salon);
});

salonsController.delete("/:id", async (c) => {
  const service = new SalonsService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const salon = await service.delete(id);
  if (!salon) return c.json({ error: "Salon not found" }, 404);
  return c.json({ message: "Salon deleted" });
});
