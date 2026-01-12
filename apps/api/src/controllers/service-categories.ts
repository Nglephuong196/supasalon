import { Hono } from "hono";
import { createDb } from "../db";
import { ServiceCategoriesService } from "../services";
import type { NewServiceCategory } from "../db/schema";

type Bindings = { DB: D1Database };

export const serviceCategoriesController = new Hono<{ Bindings: Bindings }>();

serviceCategoriesController.get("/", async (c) => {
  const service = new ServiceCategoriesService(createDb(c.env.DB));
  const salonId = c.req.query("salonId");
  if (salonId) {
    const categories = await service.findBySalonId(parseInt(salonId));
    return c.json(categories);
  }
  const categories = await service.findAll();
  return c.json(categories);
});

serviceCategoriesController.get("/:id", async (c) => {
  const service = new ServiceCategoriesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const category = await service.findById(id);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json(category);
});

serviceCategoriesController.post("/", async (c) => {
  const service = new ServiceCategoriesService(createDb(c.env.DB));
  const body = await c.req.json<NewServiceCategory>();
  const category = await service.create(body);
  return c.json(category, 201);
});

serviceCategoriesController.put("/:id", async (c) => {
  const service = new ServiceCategoriesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewServiceCategory>>();
  const category = await service.update(id, body);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json(category);
});

serviceCategoriesController.delete("/:id", async (c) => {
  const service = new ServiceCategoriesService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const category = await service.delete(id);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json({ message: "Service category deleted" });
});
