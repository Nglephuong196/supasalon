import { ACTIONS, RESOURCES } from "@repo/constants";
import { Hono } from "hono";
import type { Database } from "../db";
import type { NewProduct } from "../db/schema";
import { requirePermission } from "../middleware/permission";
import { ProductsService } from "../services/products";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const productsController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

productsController.get("/", requirePermission(RESOURCES.PRODUCT, ACTIONS.READ), async (c) => {
  const service = new ProductsService(c.get("db"));
  const organization = c.get("organization");
  const categoryId = c.req.query("categoryId");

  if (categoryId) {
    const products = await service.findByCategoryId(parseInt(categoryId), organization.id);
    return c.json(products);
  }
  const products = await service.findAll(organization.id);
  return c.json(products);
});

productsController.get("/:id", requirePermission(RESOURCES.PRODUCT, ACTIONS.READ), async (c) => {
  const service = new ProductsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const product = await service.findById(id, organization.id);
  if (!product) return c.json({ error: "Không tìm thấy sản phẩm" }, 404);
  return c.json(product);
});

productsController.post("/", requirePermission(RESOURCES.PRODUCT, ACTIONS.CREATE), async (c) => {
  const service = new ProductsService(c.get("db"));
  const organization = c.get("organization");
  const body = await c.req.json<NewProduct>();

  try {
    const product = await service.create(body, organization.id);
    return c.json(product, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

productsController.put("/:id", requirePermission(RESOURCES.PRODUCT, ACTIONS.UPDATE), async (c) => {
  const service = new ProductsService(c.get("db"));
  const organization = c.get("organization");
  const id = parseInt(c.req.param("id"));
  const body = await c.req.json<Partial<NewProduct>>();

  try {
    const product = await service.update(id, organization.id, body);
    if (!product) return c.json({ error: "Không tìm thấy sản phẩm" }, 404);
    return c.json(product);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

productsController.delete(
  "/:id",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.DELETE),
  async (c) => {
    const service = new ProductsService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));

    const product = await service.delete(id, organization.id);
    if (!product) return c.json({ error: "Không tìm thấy sản phẩm" }, 404);
    return c.json({ message: "Đã xóa sản phẩm" });
  },
);
