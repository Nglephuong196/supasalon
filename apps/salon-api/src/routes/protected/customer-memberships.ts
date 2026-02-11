import { Elysia } from "elysia";

import { db, type NewCustomerMembership } from "../../db";
import { CustomerMembershipsService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const customerMembershipsProtectedRoutes = new Elysia({ name: "protected-customer-memberships-routes" })
  .use(protectedPlugin)
  .group("/customer-memberships", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await getTenant(request);
        return new CustomerMembershipsService(db).findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const membership = await new CustomerMembershipsService(db).findById(
          Number.parseInt(params.id, 10),
          organization.id,
        );
        if (!membership) {
          set.status = 404;
          return { error: "Membership not found" };
        }
        return membership;
      })
      .get("/customer/:customerId", async ({ request, params }) => {
        const { organization } = await getTenant(request);
        return new CustomerMembershipsService(db).findByCustomerId(Number.parseInt(params.customerId, 10), organization.id);
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await getTenant(request);
        try {
          const membership = await new CustomerMembershipsService(db).create(
            (await request.json()) as NewCustomerMembership,
            organization.id,
          );
          set.status = 201;
          return membership;
        } catch (error: any) {
          set.status = 400;
          return { error: error.message };
        }
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const membership = await new CustomerMembershipsService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          (await request.json()) as Partial<NewCustomerMembership>,
        );
        if (!membership) {
          set.status = 404;
          return { error: "Membership not found" };
        }
        return membership;
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const membership = await new CustomerMembershipsService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!membership) {
          set.status = 404;
          return { error: "Membership not found" };
        }
        return { message: "Membership deleted" };
      }),
  );
