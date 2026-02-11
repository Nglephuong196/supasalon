import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewProduct, type NewProductCategory } from "../../db";
import { getQuery } from "../../lib/query";
import { ProductCategoriesService, ProductsService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const productsProtectedRoutes = new Elysia({ name: "protected-products-routes" })
  .use(protectedPlugin)
  .group("/product-categories", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.READ);
        return new ProductCategoriesService(db).findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.READ);
        const category = await new ProductCategoriesService(db).findById(Number.parseInt(params.id, 10), organization.id);
        if (!category) {
          set.status = 404;
          return { error: "Không tìm thấy danh mục" };
        }
        return category;
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.CREATE);
        const category = await new ProductCategoriesService(db).create(
          organization.id,
          (await request.json()) as Omit<NewProductCategory, "organizationId">,
        );
        set.status = 201;
        return category;
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.UPDATE);
        const category = await new ProductCategoriesService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          (await request.json()) as Partial<Omit<NewProductCategory, "organizationId">>,
        );
        if (!category) {
          set.status = 404;
          return { error: "Không tìm thấy danh mục" };
        }
        return category;
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.DELETE);
        const category = await new ProductCategoriesService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!category) {
          set.status = 404;
          return { error: "Không tìm thấy danh mục" };
        }
        return { message: "Đã xóa danh mục" };
      }),
  )
  .group("/products", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.READ);
        const categoryId = getQuery(request).get("categoryId");
        const service = new ProductsService(db);
        if (categoryId) return service.findByCategoryId(Number.parseInt(categoryId, 10), organization.id);
        return service.findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.READ);
        const product = await new ProductsService(db).findById(Number.parseInt(params.id, 10), organization.id);
        if (!product) {
          set.status = 404;
          return { error: "Không tìm thấy sản phẩm" };
        }
        return product;
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.CREATE);
        try {
          const product = await new ProductsService(db).create((await request.json()) as NewProduct, organization.id);
          set.status = 201;
          return product;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.UPDATE);
        try {
          const product = await new ProductsService(db).update(
            Number.parseInt(params.id, 10),
            organization.id,
            (await request.json()) as Partial<NewProduct>,
          );
          if (!product) {
            set.status = 404;
            return { error: "Không tìm thấy sản phẩm" };
          }
          return product;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.PRODUCT, ACTIONS.DELETE);
        const product = await new ProductsService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!product) {
          set.status = 404;
          return { error: "Không tìm thấy sản phẩm" };
        }
        return { message: "Đã xóa sản phẩm" };
      }),
  );
