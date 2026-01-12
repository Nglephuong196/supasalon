import { Hono } from "hono";
import { createDb } from "../db";
import { CustomersService } from "../services";
import type { NewCustomer } from "../db/schema";

type Bindings = { DB: D1Database };

export const customersController = new Hono<{ Bindings: Bindings }>();

customersController.get("/", async (c) => {
  const service = new CustomersService(createDb(c.env.DB));
  const salonId = c.req.query("salonId");
  if (salonId) {
    const customers = await service.findBySalonId(parseInt(salonId));
    return c.json(customers);
  }
  const customers = await service.findAll();
  return c.json(customers);
});

customersController.get("/:id", async (c) => {
  const service = new CustomersService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const customer = await service.findById(id);
  if (!customer) return c.json({ error: "Customer not found" }, 404);
  return c.json(customer);
});

customersController.post("/", async (c) => {
  const service = new CustomersService(createDb(c.env.DB));
  const body = await c.req.json<NewCustomer>();
  const customer = await service.create(body);
  return c.json(customer, 201);
});

customersController.put("/:id", async (c) => {
  const service = new CustomersService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewCustomer>>();
  const customer = await service.update(id, body);
  if (!customer) return c.json({ error: "Customer not found" }, 404);
  return c.json(customer);
});

customersController.delete("/:id", async (c) => {
  const service = new CustomersService(createDb(c.env.DB));
  const id = parseInt(c.req.param("id"));
  const customer = await service.delete(id);
  if (!customer) return c.json({ error: "Customer not found" }, 404);
  return c.json({ message: "Customer deleted" });
});
