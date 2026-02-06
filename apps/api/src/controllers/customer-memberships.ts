import { Hono } from "hono";
import { CustomerMembershipsService } from "../services/customer-memberships";
import type { NewCustomerMembership } from "../db/schema";
import type { Database } from "../db";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const customerMembershipsController = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

customerMembershipsController.get("/", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const memberships = await service.findAll(organization.id);
  return c.json(memberships);
});

customerMembershipsController.get("/:id", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const membership = await service.findById(id, organization.id);
  if (!membership) return c.json({ error: "Membership not found" }, 404);
  return c.json(membership);
});

customerMembershipsController.get("/customer/:customerId", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const customerId = parseInt(c.req.param("customerId"));

  const memberships = await service.findByCustomerId(customerId, organization.id);
  return c.json(memberships);
});

customerMembershipsController.post("/", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewCustomerMembership>();

  try {
    const membership = await service.create(body, organization.id);
    return c.json(membership, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

customerMembershipsController.put("/:id", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewCustomerMembership>>();

  const membership = await service.update(id, organization.id, body);
  if (!membership) return c.json({ error: "Membership not found" }, 404);
  return c.json(membership);
});

customerMembershipsController.delete("/:id", async (c) => {
  const service = new CustomerMembershipsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const membership = await service.delete(id, organization.id);
  if (!membership) return c.json({ error: "Membership not found" }, 404);
  return c.json({ message: "Membership deleted" });
});
