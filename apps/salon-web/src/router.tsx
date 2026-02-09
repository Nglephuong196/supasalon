import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { AuthShell } from "@/components/layout/auth-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PublicBookingShell } from "@/components/layout/public-booking-shell";
import { ApiContextSync } from "@/components/providers/api-context-sync";
import { BookingsPage } from "@/pages/dashboard/bookings-page";
import { CommissionSettingsPage } from "@/pages/dashboard/commission-settings-page";
import { CustomersPage } from "@/pages/dashboard/customers-page";
import { EmployeesPage } from "@/pages/dashboard/employees-page";
import { InvoicesPage } from "@/pages/dashboard/invoices-page";
import { OverviewPage } from "@/pages/dashboard/overview-page";
import { ProductsPage } from "@/pages/dashboard/products-page";
import { ProfilePage } from "@/pages/dashboard/profile-page";
import { ServicesPage } from "@/pages/dashboard/services-page";
import { SettingsPage } from "@/pages/dashboard/settings-page";
import { UnauthorizedPage } from "@/pages/dashboard/unauthorized-page";
import { PublicBookingPage } from "@/pages/public/booking-page";
import { SignInPage } from "@/pages/sign-in-page";
import { SignUpPage } from "@/pages/sign-up-page";

const rootRoute = createRootRoute({
  component: () => (
    <div className="min-h-screen">
      <ApiContextSync />
      <Outlet />
    </div>
  ),
});

const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <DashboardShell>
      <OverviewPage />
    </DashboardShell>
  ),
});

const bookingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/bookings",
  component: () => (
    <DashboardShell>
      <BookingsPage />
    </DashboardShell>
  ),
});

const customersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/customers",
  component: () => (
    <DashboardShell>
      <CustomersPage />
    </DashboardShell>
  ),
});

const employeesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/employees",
  component: () => (
    <DashboardShell>
      <EmployeesPage />
    </DashboardShell>
  ),
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/services",
  component: () => (
    <DashboardShell>
      <ServicesPage />
    </DashboardShell>
  ),
});

const productsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  component: () => (
    <DashboardShell>
      <ProductsPage />
    </DashboardShell>
  ),
});

const invoicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/invoices",
  component: () => (
    <DashboardShell>
      <InvoicesPage />
    </DashboardShell>
  ),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/settings",
  component: () => (
    <DashboardShell>
      <SettingsPage />
    </DashboardShell>
  ),
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: () => (
    <DashboardShell>
      <ProfilePage />
    </DashboardShell>
  ),
});

const commissionSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/commission-settings",
  component: () => (
    <DashboardShell>
      <CommissionSettingsPage />
    </DashboardShell>
  ),
});

const unauthorizedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/unauthorized",
  component: () => (
    <DashboardShell>
      <UnauthorizedPage />
    </DashboardShell>
  ),
});

const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signin",
  component: () => (
    <AuthShell>
      <SignInPage />
    </AuthShell>
  ),
});

const signUpRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/signup",
  component: () => (
    <AuthShell>
      <SignUpPage />
    </AuthShell>
  ),
});

const publicBookingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/book/$slug",
  component: () => (
    <PublicBookingShell>
      <PublicBookingPage />
    </PublicBookingShell>
  ),
});

const routeTree = rootRoute.addChildren([
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
  signInRoute,
  signUpRoute,
  publicBookingRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
