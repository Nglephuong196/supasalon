import { Hono } from "hono";
import { ServicesService } from "../services";
import type { NewService } from "../db/schema";
import type { Database } from "../db";
import { requirePermission } from "../middleware/permission";
import { RESOURCES, ACTIONS } from "@repo/constants";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const servicesController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Read operations
servicesController.get("/", requirePermission(RESOURCES.SERVICE, ACTIONS.READ), async (c) => {
  const service = new ServicesService(c.get("db"));
  const organization = c.get("organization");
  const categoryId = c.req.query("categoryId");

  if (categoryId) {
    const services = await service.findByCategoryId(parseInt(categoryId), organization.id);
    return c.json(services);
  }
  const services = await service.findAll(organization.id);
  return c.json(services);
});

servicesController.get("/:id", requirePermission(RESOURCES.SERVICE, ACTIONS.READ), async (c) => {
  const service = new ServicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const svc = await service.findById(id, organization.id);
  if (!svc) return c.json({ error: "Service not found" }, 404);
  return c.json(svc);
});

// Create operation
servicesController.post("/", requirePermission(RESOURCES.SERVICE, ACTIONS.CREATE), async (c) => {
  const service = new ServicesService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewService>();

  try {
    const svc = await service.create(body, organization.id);
    return c.json(svc, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Update operation
servicesController.put("/:id", requirePermission(RESOURCES.SERVICE, ACTIONS.UPDATE), async (c) => {
  const service = new ServicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewService>>();

  try {
    const svc = await service.update(id, organization.id, body);
    if (!svc) return c.json({ error: "Service not found" }, 404);
    return c.json(svc);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

// Delete operation
servicesController.delete("/:id", requirePermission(RESOURCES.SERVICE, ACTIONS.DELETE), async (c) => {
  const service = new ServicesService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const svc = await service.delete(id, organization.id);
  if (!svc) return c.json({ error: "Service not found" }, 404);
  return c.json({ message: "Service deleted" });
});
