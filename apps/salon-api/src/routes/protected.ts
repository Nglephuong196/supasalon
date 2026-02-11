import { Elysia } from "elysia";

import { bookingsProtectedRoutes } from "./protected/bookings";
import { customerMembershipsProtectedRoutes } from "./protected/customer-memberships";
import { customersProtectedRoutes } from "./protected/customers";
import { dashboardProtectedRoutes } from "./protected/dashboard";
import { invoicesProtectedRoutes } from "./protected/invoices";
import { membersProtectedRoutes } from "./protected/members";
import { membershipTiersProtectedRoutes } from "./protected/membership-tiers";
import { productsProtectedRoutes } from "./protected/products";
import { servicesProtectedRoutes } from "./protected/services";
import { staffCommissionRulesProtectedRoutes } from "./protected/staff-commission-rules";
import { usersProtectedRoutes } from "./protected/users";

export const protectedRoutes = new Elysia({ name: "protected-routes" })
  .use(usersProtectedRoutes)
  .use(customersProtectedRoutes)
  .use(customerMembershipsProtectedRoutes)
  .use(servicesProtectedRoutes)
  .use(productsProtectedRoutes)
  .use(membershipTiersProtectedRoutes)
  .use(bookingsProtectedRoutes)
  .use(invoicesProtectedRoutes)
  .use(membersProtectedRoutes)
  .use(staffCommissionRulesProtectedRoutes)
  .use(dashboardProtectedRoutes);
