import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewService, type NewServiceCategory } from "../../db";
import { getQuery } from "../../lib/query";
import { ServiceCategoriesService, ServicesService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const servicesProtectedRoutes = new Elysia({ name: "protected-services-routes" })
  .use(protectedPlugin)
  .group("/service-categories", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await getTenant(request);
        return new ServiceCategoriesService(db).findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const category = await new ServiceCategoriesService(db).findById(Number.parseInt(params.id, 10), organization.id);
        if (!category) {
          set.status = 404;
          return { error: "Service category not found" };
        }
        return category;
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await getTenant(request);
        const category = await new ServiceCategoriesService(db).create({
          ...((await request.json()) as NewServiceCategory),
          organizationId: organization.id,
        });
        set.status = 201;
        return category;
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const category = await new ServiceCategoriesService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          (await request.json()) as Partial<NewServiceCategory>,
        );
        if (!category) {
          set.status = 404;
          return { error: "Service category not found" };
        }
        return category;
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const category = await new ServiceCategoriesService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!category) {
          set.status = 404;
          return { error: "Service category not found" };
        }
        return { message: "Service category deleted" };
      }),
  )
  .group("/services", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.SERVICE, ACTIONS.READ);
        const categoryId = getQuery(request).get("categoryId");
        const service = new ServicesService(db);
        if (categoryId) return service.findByCategoryId(Number.parseInt(categoryId, 10), organization.id);
        return service.findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.SERVICE, ACTIONS.READ);
        const svc = await new ServicesService(db).findById(Number.parseInt(params.id, 10), organization.id);
        if (!svc) {
          set.status = 404;
          return { error: "Service not found" };
        }
        return svc;
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.SERVICE, ACTIONS.CREATE);
        try {
          const svc = await new ServicesService(db).create((await request.json()) as NewService, organization.id);
          set.status = 201;
          return svc;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.SERVICE, ACTIONS.UPDATE);
        try {
          const svc = await new ServicesService(db).update(
            Number.parseInt(params.id, 10),
            organization.id,
            (await request.json()) as Partial<NewService>,
          );
          if (!svc) {
            set.status = 404;
            return { error: "Service not found" };
          }
          return svc;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.SERVICE, ACTIONS.DELETE);
        const svc = await new ServicesService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!svc) {
          set.status = 404;
          return { error: "Service not found" };
        }
        return { message: "Service deleted" };
      }),
  );
