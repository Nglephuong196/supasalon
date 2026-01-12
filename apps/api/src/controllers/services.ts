import { Hono } from "hono";
import { createDb } from "../db";
import { ServicesService } from "../services";
import type { NewService } from "../db/schema";

type Bindings = { DB: D1Database };

export const servicesController = new Hono<{ Bindings: Bindings }>();

servicesController.get("/", async (c) => {
  const service = new ServicesService(createDb(c.env.DB));
  const categoryId = c.req.query("categoryId");
  if (categoryId) {
    const services = await service.findByCategoryId(parseInt(categoryId));
    return c.json(services);
  }
  const services = await service.findAll();
  return c.json(services);
});

servicesController.get("/:id", async (c) => {
  const service = new ServicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const svc = await service.findById(id);
  if (!svc) return c.json({ error: "Service not found" }, 404);
  return c.json(svc);
});

servicesController.post("/", async (c) => {
  const service = new ServicesService(createDb(c.env.DB));
  const body = await c.req.json<NewService>();
  const svc = await service.create(body);
  return c.json(svc, 201);
});

servicesController.put("/:id", async (c) => {
  const service = new ServicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewService>>();
  const svc = await service.update(id, body);
  if (!svc) return c.json({ error: "Service not found" }, 404);
  return c.json(svc);
});

servicesController.delete("/:id", async (c) => {
  const service = new ServicesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const svc = await service.delete(id);
  if (!svc) return c.json({ error: "Service not found" }, 404);
  return c.json({ message: "Service deleted" });
});
