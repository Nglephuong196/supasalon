import { ACTIONS, RESOURCES } from "@repo/constants";
import { Elysia } from "elysia";

import { db } from "../../db";
import { BookingPoliciesService } from "../../services";
import { protectedPlugin, requirePermissionFor } from "./plugin";

export const bookingPoliciesProtectedRoutes = new Elysia({ name: "protected-booking-policies-routes" })
  .use(protectedPlugin)
  .group("/booking-policies", (app) =>
    app
      .get("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.READ);
        return new BookingPoliciesService(db).getByOrganizationId(organization.id);
      })
      .put("/", async ({ request }) => {
        const { organization } = await requirePermissionFor(request, RESOURCES.BOOKING, ACTIONS.UPDATE);
        const body = (await request.json()) as {
          preventStaffOverlap?: boolean;
          bufferMinutes?: number;
          requireDeposit?: boolean;
          defaultDepositAmount?: number;
          cancellationWindowHours?: number;
        };

        return new BookingPoliciesService(db).upsert(organization.id, body);
      }),
  );
