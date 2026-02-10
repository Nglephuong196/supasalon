import { ACTIONS, RESOURCES } from "@repo/constants";
import { Hono } from "hono";
import type { Database } from "../db";
import type { NewCustomer } from "../db/schema";
import { requirePermission } from "../middleware/permission";
import { CustomersService } from "../services";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const customersController = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// Read operations
customersController.get("/", requirePermission(RESOURCES.CUSTOMER, ACTIONS.READ), async (c) => {
  const service = new CustomersService(c.get("db"));
  const organization = c.get("organization");

  const paginated = c.req.query("paginated") === "1";
  if (!paginated) {
    const customers = await service.findAll(organization.id);
    return c.json(customers);
  }

  const page = Number.parseInt(c.req.query("page") || "1", 10);
  const limit = Number.parseInt(c.req.query("limit") || "20", 10);
  const search = c.req.query("search") || "";
  const vipOnly = c.req.query("vip") === "1";

  const result = await service.findPage(organization.id, {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20,
    search,
    vipOnly,
  });
  return c.json(result);
});

customersController.get("/:id", requirePermission(RESOURCES.CUSTOMER, ACTIONS.READ), async (c) => {
  const service = new CustomersService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));

  const customer = await service.findById(id, organization.id);
  if (!customer) return c.json({ error: "Customer not found" }, 404);
  return c.json(customer);
});

// Create operation
customersController.post("/", requirePermission(RESOURCES.CUSTOMER, ACTIONS.CREATE), async (c) => {
  const service = new CustomersService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewCustomer>();

  const customerData = { ...body, organizationId: organization.id };

  const customer = await service.create(customerData);
  return c.json(customer, 201);
});

// Update operation
customersController.put(
  "/:id",
  requirePermission(RESOURCES.CUSTOMER, ACTIONS.UPDATE),
  async (c) => {
    const service = new CustomersService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json<Partial<NewCustomer>>();

    if (body.organizationId && body.organizationId !== organization.id) {
      return c.json({ error: "Cannot move customer to another organization" }, 403);
    }

    const customer = await service.update(id, organization.id, body);
    if (!customer) return c.json({ error: "Customer not found" }, 404);
    return c.json(customer);
  },
);

// Delete operation
customersController.delete(
  "/:id",
  requirePermission(RESOURCES.CUSTOMER, ACTIONS.DELETE),
  async (c) => {
    const service = new CustomersService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));

    const customer = await service.delete(id, organization.id);
    if (!customer) return c.json({ error: "Customer not found" }, 404);
    return c.json({ message: "Customer deleted" });
  },
);
