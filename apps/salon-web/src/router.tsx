import { AuthShell } from "@/components/layout/auth-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PublicBookingShell } from "@/components/layout/public-booking-shell";
import { ApiContextSync } from "@/components/providers/api-context-sync";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  lazyRouteComponent,
} from "@tanstack/react-router";

const OverviewPage = lazyRouteComponent(
  () => import("@/pages/dashboard/overview-page"),
  "OverviewPage",
);
const BookingsPage = lazyRouteComponent(
  () => import("@/pages/dashboard/bookings-page"),
  "BookingsPage",
);
const CustomersPage = lazyRouteComponent(
  () => import("@/pages/dashboard/customers-page"),
  "CustomersPage",
);
const EmployeesPage = lazyRouteComponent(
  () => import("@/pages/dashboard/employees-page"),
  "EmployeesPage",
);
const ServicesPage = lazyRouteComponent(
  () => import("@/pages/dashboard/services-page"),
  "ServicesPage",
);
const ProductsPage = lazyRouteComponent(
  () => import("@/pages/dashboard/products-page"),
  "ProductsPage",
);
const InvoicesPage = lazyRouteComponent(
  () => import("@/pages/dashboard/invoices-page"),
  "InvoicesPage",
);
const SettingsPage = lazyRouteComponent(
  () => import("@/pages/dashboard/settings-page"),
  "SettingsPage",
);
const ProfilePage = lazyRouteComponent(
  () => import("@/pages/dashboard/profile-page"),
  "ProfilePage",
);
const CommissionSettingsPage = lazyRouteComponent(
  () => import("@/pages/dashboard/commission-settings-page"),
  "CommissionSettingsPage",
);
const UnauthorizedPage = lazyRouteComponent(
  () => import("@/pages/dashboard/unauthorized-page"),
  "UnauthorizedPage",
);
const SignInPage = lazyRouteComponent(() => import("@/pages/sign-in-page"), "SignInPage");
const SignUpPage = lazyRouteComponent(() => import("@/pages/sign-up-page"), "SignUpPage");
const PublicBookingPage = lazyRouteComponent(
  () => import("@/pages/public/booking-page"),
  "PublicBookingPage",
);

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <ApiContextSync />
      <Outlet />
    </div>
  ),
});

const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "dashboard-layout",
  component: () => (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  ),
});

const authLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "auth-layout",
  component: () => (
    <AuthShell>
      <Outlet />
    </AuthShell>
  ),
});

const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public-layout",
  component: () => (
    <PublicBookingShell>
      <Outlet />
    </PublicBookingShell>
  ),
});

const overviewRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/",
  component: OverviewPage,
});

const bookingsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/bookings",
  component: BookingsPage,
});

const customersRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/customers",
  component: CustomersPage,
});

const employeesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/employees",
  component: EmployeesPage,
});

const servicesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/services",
  component: ServicesPage,
});

const productsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/products",
  component: ProductsPage,
});

const invoicesRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/invoices",
  component: InvoicesPage,
});

const settingsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/settings",
  component: SettingsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/profile",
  component: ProfilePage,
});

const commissionSettingsRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/commission-settings",
  component: CommissionSettingsPage,
});

const unauthorizedRoute = createRoute({
  getParentRoute: () => dashboardLayoutRoute,
  path: "/unauthorized",
  component: UnauthorizedPage,
});

const signInRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/signin",
  component: SignInPage,
});

const signUpRoute = createRoute({
  getParentRoute: () => authLayoutRoute,
  path: "/signup",
  component: SignUpPage,
});

const publicBookingRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/book/$slug",
  component: PublicBookingPage,
});

const routeTree = rootRoute.addChildren([
  dashboardLayoutRoute.addChildren([
    overviewRoute,
    bookingsRoute,
    customersRoute,
    employeesRoute,
    servicesRoute,
    productsRoute,
    invoicesRoute,
    settingsRoute,
    profileRoute,
    commissionSettingsRoute,
    unauthorizedRoute,
  ]),
  authLayoutRoute.addChildren([signInRoute, signUpRoute]),
  publicLayoutRoute.addChildren([publicBookingRoute]),
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
