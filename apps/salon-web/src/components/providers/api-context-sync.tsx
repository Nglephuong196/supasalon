import { useEffect } from "react";
import { clearApiContext, setApiContext } from "@/lib/api";
import { organization, useSession } from "@/lib/auth-client";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function ApiContextSync() {
  const session = useSession();

  useEffect(() => {
    let disposed = false;

    async function syncApiContext() {
      const data = session.data as
        | {
            session?: {
              id?: string;
              sessionId?: string;
              token?: string;
              activeOrganizationId?: string;
            };
          }
        | undefined;

      let organizationId =
        data?.session?.activeOrganizationId ??
        readCookie("organizationId") ??
        (typeof localStorage !== "undefined" ? localStorage.getItem("organizationId") : null);
      const sessionId =
        data?.session?.id ??
        data?.session?.sessionId ??
        data?.session?.token ??
        readCookie("sessionId") ??
        readCookie("better-auth.session_token") ??
        (typeof localStorage !== "undefined" ? localStorage.getItem("sessionId") : null);

      // Ensure an active organization exists for tenant-protected endpoints.
      if (!organizationId && data?.session) {
        try {
          const listResult = await organization.list();
          const listPayload = (listResult as { data?: Array<{ id?: string }> | undefined }).data;
          const firstOrgId = listPayload?.[0]?.id;
          if (firstOrgId) {
            await organization.setActive({ organizationId: firstOrgId });
            organizationId = firstOrgId;
          }
        } catch {
          // Silent fallback; protected requests will still guard on missing org.
        }
      }

      if (disposed) return;
      setApiContext({ organizationId, sessionId });
      if (typeof localStorage !== "undefined") {
        if (organizationId) localStorage.setItem("organizationId", organizationId);
        if (sessionId) localStorage.setItem("sessionId", sessionId);
      }
    }

    void syncApiContext();

    return () => {
      disposed = true;
      clearApiContext();
    };
  }, [session.data]);

  return null;
}
