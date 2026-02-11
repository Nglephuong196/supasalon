import { Elysia } from "elysia";

import { bookingsProtectedRoutes } from "./protected/bookings";
import { bookingPoliciesProtectedRoutes } from "./protected/booking-policies";
import { bookingRemindersProtectedRoutes } from "./protected/booking-reminders";
import { branchesProtectedRoutes } from "./protected/branches";
import { cashManagementProtectedRoutes } from "./protected/cash-management";
import { commissionPayoutsProtectedRoutes } from "./protected/commission-payouts";
import { customerMembershipsProtectedRoutes } from "./protected/customer-memberships";
import { customersProtectedRoutes } from "./protected/customers";
import { dashboardProtectedRoutes } from "./protected/dashboard";
import { invoicesProtectedRoutes } from "./protected/invoices";
import { membersProtectedRoutes } from "./protected/members";
import { membershipTiersProtectedRoutes } from "./protected/membership-tiers";
import { approvalRequestsProtectedRoutes } from "./protected/approval-requests";
import { payrollProtectedRoutes } from "./protected/payroll";
import { prepaidProtectedRoutes } from "./protected/prepaid";
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
  .use(bookingPoliciesProtectedRoutes)
  .use(bookingRemindersProtectedRoutes)
  .use(branchesProtectedRoutes)
  .use(cashManagementProtectedRoutes)
  .use(invoicesProtectedRoutes)
  .use(prepaidProtectedRoutes)
  .use(approvalRequestsProtectedRoutes)
  .use(payrollProtectedRoutes)
  .use(commissionPayoutsProtectedRoutes)
  .use(membersProtectedRoutes)
  .use(staffCommissionRulesProtectedRoutes)
  .use(dashboardProtectedRoutes);
