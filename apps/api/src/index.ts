import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  authController,
  usersController,
  salonsController,
  customersController,
  serviceCategoriesController,
  servicesController,
  bookingsController,
  invoicesController,
} from "./controllers";

type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use("*", cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/", (c) => {
  return c.json({ status: "ok", message: "Supasalon API" });
});

// Auth routes (handled by better-auth)
app.route("/api/auth", authController);

// Resource routes
app.route("/users", usersController);
app.route("/salons", salonsController);
app.route("/customers", customersController);
app.route("/service-categories", serviceCategoriesController);
app.route("/services", servicesController);
app.route("/bookings", bookingsController);
app.route("/invoices", invoicesController);

export default app;
