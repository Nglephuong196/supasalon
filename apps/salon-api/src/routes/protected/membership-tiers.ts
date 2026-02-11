import { Elysia } from "elysia";

import { db, type NewMembershipTier } from "../../db";
import { MembershipTiersService } from "../../services";
import { getTenant, protectedPlugin, requirePermissionFor } from "./plugin";

export const membershipTiersProtectedRoutes = new Elysia({ name: "protected-membership-tiers-routes" })
  .use(protectedPlugin)
  .group("/membership-tiers", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await getTenant(request);
        return new MembershipTiersService(db).findAll(organization.id);
      })
      .get("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const tier = await new MembershipTiersService(db).findById(Number.parseInt(params.id, 10), organization.id);
        if (!tier) {
          set.status = 404;
          return { error: "Membership tier not found" };
        }
        return tier;
      })
      .post("/", async ({ request, set }) => {
        const { organization } = await getTenant(request);
        const tier = await new MembershipTiersService(db).create(
          (await request.json()) as Omit<NewMembershipTier, "organizationId">,
          organization.id,
        );
        set.status = 201;
        return tier;
      })
      .put("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const tier = await new MembershipTiersService(db).update(
          Number.parseInt(params.id, 10),
          organization.id,
          (await request.json()) as Partial<Omit<NewMembershipTier, "organizationId">>,
        );
        if (!tier) {
          set.status = 404;
          return { error: "Membership tier not found" };
        }
        return tier;
      })
      .delete("/:id", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const tier = await new MembershipTiersService(db).delete(Number.parseInt(params.id, 10), organization.id);
        if (!tier) {
          set.status = 404;
          return { error: "Membership tier not found" };
        }
        return { message: "Membership tier deleted" };
      })
      .post("/recalculate/:customerId", async ({ request, params, set }) => {
        const { organization } = await getTenant(request);
        const customer = await new MembershipTiersService(db).updateCustomerTier(
          Number.parseInt(params.customerId, 10),
          organization.id,
        );
        if (!customer) {
          set.status = 404;
          return { error: "Customer not found" };
        }
        return customer;
      }),
  );
