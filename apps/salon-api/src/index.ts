import { Elysia } from "elysia";

import { pool } from "./db";
import { auth } from "./lib/auth";
import { HttpError } from "./lib/http-error";
import { protectedRoutes } from "./routes/protected";
import { publicBookingRoutes } from "./routes/public-booking";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8081",
  "http://10.0.2.2:8081",
  "supasalon://",
]);

function applyCors(origin: string | null, set: { headers: Record<string, string> }) {
  if (origin && allowedOrigins.has(origin)) {
    set.headers["access-control-allow-origin"] = origin;
  }
  set.headers["access-control-allow-credentials"] = "true";
  set.headers["access-control-allow-methods"] = "GET,POST,PUT,DELETE,PATCH,OPTIONS";
  set.headers["access-control-allow-headers"] =
    "Content-Type,Authorization,Cookie,X-Organization-Id,sessionId,X-Session-Id";
}

const app = new Elysia()
  .options("/*", ({ request, set }) => {
    applyCors(request.headers.get("origin"), set as { headers: Record<string, string> });
    set.status = 204;
    return "";
  })
  .onAfterHandle(({ request, set }) => {
    applyCors(request.headers.get("origin"), set as { headers: Record<string, string> });
  })
  .onError(({ error, set }) => {
    if (error instanceof HttpError) {
      set.status = error.status;
      return error.payload;
    }

    set.status = 500;
    const message = error instanceof Error ? error.message : "Internal server error";
    return { error: message };
  })
  .get("/", () => ({ status: "ok", message: "Supasalon API" }))
  .get("/healthz", () => ({ ok: true, service: "salon-api" }))
  .mount(auth.handler)
  .use(publicBookingRoutes)
  .use(protectedRoutes)
  .listen(3000);

console.log(`Salon API listening on ${app.server?.hostname}:${app.server?.port}`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, async () => {
    await pool.end();
    process.exit(0);
  });
}
