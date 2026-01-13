import { Hono } from "hono";
import { ServiceCategoriesService } from "../services";
import type { NewServiceCategory } from "../db/schema";
import type { Database } from "../db";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const serviceCategoriesController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

serviceCategoriesController.get("/", async (c) => {
  const service = new ServiceCategoriesService(c.get("db"));
  const organization = c.get("organization");
  const categories = await service.findAll(organization.id);
  return c.json(categories);
});

serviceCategoriesController.get("/:id", async (c) => {
  const service = new ServiceCategoriesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const category = await service.findById(id, organization.id);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json(category);
});

serviceCategoriesController.post("/", async (c) => {
  const service = new ServiceCategoriesService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewServiceCategory>();

  // Enforce organizationId from context
  const data = { ...body, organizationId: organization.id };

  const category = await service.create(data);
  return c.json(category, 201);
});

serviceCategoriesController.put("/:id", async (c) => {
  const service = new ServiceCategoriesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewServiceCategory>>();

  const category = await service.update(id, organization.id, body);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json(category);
});

serviceCategoriesController.delete("/:id", async (c) => {
  const service = new ServiceCategoriesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const category = await service.delete(id, organization.id);
  if (!category) return c.json({ error: "Service category not found" }, 404);
  return c.json({ message: "Service category deleted" });
});
