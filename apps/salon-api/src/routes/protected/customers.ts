import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db, type NewCustomer } from "../../db";
import { getQuery } from "../../lib/query";
import { CustomersService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const customersProtectedRoutes = new Elysia({ name: "protected-customers-routes" })
  .use(protectedPlugin)
  .group("/customers", (app) =>
    app
    .get("/", async ({ request }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
      const query = getQuery(request);
      const service = new CustomersService(db);

      const paginated = query.get("paginated") === "1";
      if (!paginated) return service.findAll(organization.id);

      const page = Number.parseInt(query.get("page") || "1", 10);
      const limit = Number.parseInt(query.get("limit") || "20", 10);
      const search = query.get("search") || "";
      const vipOnly = query.get("vip") === "1";

      return service.findPage(organization.id, {
        page: Number.isFinite(page) && page > 0 ? page : 1,
        limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 20,
        search,
        vipOnly,
      });
    })
    .get("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.READ);
      const customer = await new CustomersService(db).findById(Number.parseInt(params.id, 10), organization.id);
      if (!customer) {
        set.status = 404;
        return { error: "Customer not found" };
      }
      return customer;
    })
    .post("/", async ({ request, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.CREATE);
      const body = (await request.json()) as NewCustomer;
      const customer = await new CustomersService(db).create({ ...body, organizationId: organization.id });
      set.status = 201;
      return customer;
    })
    .put("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.UPDATE);
      const body = (await request.json()) as Partial<NewCustomer>;
      if (body.organizationId && body.organizationId !== organization.id) {
        set.status = 403;
        return { error: "Cannot move customer to another organization" };
      }
      const customer = await new CustomersService(db).update(Number.parseInt(params.id, 10), organization.id, body);
      if (!customer) {
        set.status = 404;
        return { error: "Customer not found" };
      }
      return customer;
    })
    .delete("/:id", async ({ request, params, set }) => {
      const { organization } = await requirePermissionFor(request, RESOURCES.CUSTOMER, ACTIONS.DELETE);
      const customer = await new CustomersService(db).delete(Number.parseInt(params.id, 10), organization.id);
      if (!customer) {
        set.status = 404;
        return { error: "Customer not found" };
      }
      return { message: "Customer deleted" };
    }),
  );
