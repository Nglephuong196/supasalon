import { env } from "$env/dynamic/private";
import { type Handle, type HandleFetch, redirect } from "@sveltejs/kit";

// Define protected routes that require authentication (root is dashboard)
const protectedRoutes = [
  "/",
  "/bookings",
  "/customers",
  "/services",
  "/products",
  "/employees",
  "/commission-settings",
  "/invoices",
  "/settings",
];

// Define auth routes (redirect to dashboard if already logged in)
const authRoutes = ["/signin", "/signup"];

// API URL for server-side calls
const API_URL = "http://127.0.0.1:8787";

export const handle: Handle = async ({ event, resolve }) => {
  // Get session from cookies by calling the API
  const sessionCookie = event.cookies.get("better-auth.session_token");

  let session = null;

  if (sessionCookie) {
    try {
      // Fetch session from your API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${API_URL}/api/auth/get-session`, {
        headers: {
          Cookie: `better-auth.session_token=${sessionCookie}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        session = await response.json();
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
    }
  }

  // Store session in locals for use in load functions
  event.locals.session = session;

  const pathname = event.url.pathname;

  // Check if trying to access protected route without session
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || (route !== "/" && pathname.startsWith(route)),
  );
  if (isProtected) {
    if (!session) {
      throw redirect(303, "/signin");
    }
  }

  // Check if trying to access auth routes while logged in
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    if (session) {
      throw redirect(303, "/");
    }
  }

  return resolve(event);
};

/**
 * handleFetch intercepts all fetch() calls made on the server.
 * We use it to automatically inject the X-Organization-Id header for API requests.
 */
export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
  // Check if request is to our API (both localhost and 127.0.0.1)
  const isApiRequest =
    request.url.startsWith("http://localhost:8787") ||
    request.url.startsWith("http://127.0.0.1:8787");

  if (isApiRequest) {
    const organizationId = event.cookies.get("organizationId");
    const sessionToken = event.cookies.get("better-auth.session_token");

    // Create new headers with organization ID and Session Token
    const headers = new Headers(request.headers);

    if (organizationId) {
      headers.set("X-Organization-Id", organizationId);
    }

    // Ensure session token is present in cookies
    if (sessionToken) {
      const currentCookie = headers.get("cookie") || "";
      // If cookie header doesn't already contain the token (or to be safe, just ensure it's there)
      // simplest way: append it or reconstruct.
      // SvelteKit's event.cookies.get verifies it exists.
      // Let's explicitly add it to ensure the API sees it.
      // We'll append it to likely existing cookies or start fresh if empty.
      // Using ; separator.
      const newCookie = currentCookie
        ? `${currentCookie}; better-auth.session_token=${sessionToken}`
        : `better-auth.session_token=${sessionToken}`;

      headers.set("cookie", newCookie);
    }

    // Clone request with modified headers
    const modifiedRequest = new Request(request, { headers });

    const response = await fetch(modifiedRequest);

    if (!response.ok) {
      const { LoggerService } = await import("$lib/server/logger");
      await LoggerService.logError(modifiedRequest, response);
    }

    return response;
  }

  return fetch(request);
};
