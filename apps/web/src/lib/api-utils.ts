import type { Cookies, RequestEvent } from "@sveltejs/kit";

/**
 * Constructs the cookie header for API calls.
 * This is needed because request.headers.get('cookie') doesn't reliably
 * include the session token in all scenarios (especially form actions).
 */
export function getApiCookieHeader(cookies: Cookies, request?: Request): string {
  const sessionToken = cookies.get("better-auth.session_token");
  if (sessionToken) {
    return `better-auth.session_token=${sessionToken}`;
  }
  return request?.headers?.get("cookie") || "";
}

/**
 * Constructs headers for API calls with organization context.
 */
export function getApiHeaders(cookies: Cookies, request?: Request): Record<string, string> {
  const organizationId = cookies.get("organizationId");
  const headers: Record<string, string> = {
    cookie: getApiCookieHeader(cookies, request),
  };
  if (organizationId) {
    headers["X-Organization-Id"] = organizationId;
  }
  return headers;
}
