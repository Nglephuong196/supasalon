import { Hono } from "hono";
import type { Database } from "../db";
import type { NewMembershipTier } from "../db/schema";
import { MembershipTiersService } from "../services/membership-tiers";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const membershipTiersController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

membershipTiersController.get("/", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const tiers = await service.findAll(organization.id);
  return c.json(tiers);
});

membershipTiersController.get("/:id", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const tier = await service.findById(id, organization.id);
  if (!tier) return c.json({ error: "Membership tier not found" }, 404);
  return c.json(tier);
});

membershipTiersController.post("/", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<Omit<NewMembershipTier, "organizationId">>();

  const tier = await service.create(body, organization.id);
  return c.json(tier, 201);
});

membershipTiersController.put("/:id", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<Omit<NewMembershipTier, "organizationId">>>();

  const tier = await service.update(id, organization.id, body);
  if (!tier) return c.json({ error: "Membership tier not found" }, 404);
  return c.json(tier);
});

membershipTiersController.delete("/:id", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const tier = await service.delete(id, organization.id);
  if (!tier) return c.json({ error: "Membership tier not found" }, 404);
  return c.json({ message: "Membership tier deleted" });
});

// Endpoint to manually recalculate a customer's tier
membershipTiersController.post("/recalculate/:customerId", async (c) => {
  const service = new MembershipTiersService(c.get("db"));
  const organization = c.get("organization");
  const customerId = parseInt(c.req.param("customerId"));

  const customer = await service.updateCustomerTier(customerId, organization.id);
  if (!customer) return c.json({ error: "Customer not found" }, 404);
  return c.json(customer);
});
