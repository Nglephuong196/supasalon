import { Hono } from "hono";
import { ProductCategoriesService } from "../services/product-categories";
import type { NewProductCategory } from "../db/schema";
import type { Database } from "../db";
import { requirePermission } from "../middleware/permission";
import { RESOURCES, ACTIONS } from "@repo/constants";

type Bindings = { DB: D1Database };
type Variables = {
  db: Database;
  organization: { id: string; role: string };
  user: any;
};

export const productCategoriesController = new Hono<{ Bindings: Bindings; Variables: Variables }>();

productCategoriesController.get(
  "/",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.READ),
  async (c) => {
    const service = new ProductCategoriesService(c.get("db"));
    const organization = c.get("organization");
    const categories = await service.findAll(organization.id);
    return c.json(categories);
  },
);

productCategoriesController.get(
  "/:id",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.READ),
  async (c) => {
    const service = new ProductCategoriesService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const category = await service.findById(id, organization.id);
    if (!category) return c.json({ error: "Không tìm thấy danh mục" }, 404);
    return c.json(category);
  },
);

productCategoriesController.post(
  "/",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.CREATE),
  async (c) => {
    const service = new ProductCategoriesService(c.get("db"));
    const organization = c.get("organization");
    const body = await c.req.json<Omit<NewProductCategory, "organizationId">>();

    const category = await service.create(organization.id, body);
    return c.json(category, 201);
  },
);

productCategoriesController.put(
  "/:id",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.UPDATE),
  async (c) => {
    const service = new ProductCategoriesService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));
    const body = await c.req.json<Partial<Omit<NewProductCategory, "organizationId">>>();

    const category = await service.update(id, organization.id, body);
    if (!category) return c.json({ error: "Không tìm thấy danh mục" }, 404);
    return c.json(category);
  },
);

productCategoriesController.delete(
  "/:id",
  requirePermission(RESOURCES.PRODUCT, ACTIONS.DELETE),
  async (c) => {
    const service = new ProductCategoriesService(c.get("db"));
    const organization = c.get("organization");
    const id = parseInt(c.req.param("id"));

    const category = await service.delete(id, organization.id);
    if (!category) return c.json({ error: "Không tìm thấy danh mục" }, 404);
    return c.json({ message: "Đã xóa danh mục" });
  },
);
