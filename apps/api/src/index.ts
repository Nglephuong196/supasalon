import { Hono } from "hono";
import { cors } from "hono/cors";
import { initDb } from "./middleware/db";
import type { Database } from "./db";
import {
  authController,
  usersController,
  customersController,
  customerMembershipsController,
  serviceCategoriesController,
  servicesController,
  productCategoriesController,
  productsController,
  bookingsController,
  invoicesController,
  membershipTiersController,
  membersController,
} from "./controllers";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

type Variables = {
  db: Database;
};

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Middleware
app.use("*", cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Organization-Id"],
}));
app.use("*", initDb);

// Health check
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Supasalon API" });
});

// Auth routes (handled by better-auth)
app.route("/api/auth", authController);

// Protected routes (require tenancy)
import { ensureTenant } from "./middleware/tenant";

const protectedRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>();
protectedRoutes.use("*", ensureTenant);

protectedRoutes.route("/users", usersController);
protectedRoutes.route("/customers", customersController);
protectedRoutes.route("/customer-memberships", customerMembershipsController);
protectedRoutes.route("/service-categories", serviceCategoriesController);
protectedRoutes.route("/services", servicesController);
protectedRoutes.route("/product-categories", productCategoriesController);
protectedRoutes.route("/products", productsController);
protectedRoutes.route("/bookings", bookingsController);
protectedRoutes.route("/invoices", invoicesController);
protectedRoutes.route("/membership-tiers", membershipTiersController);
protectedRoutes.route("/members", membersController);

app.route("/", protectedRoutes);

export default app;
