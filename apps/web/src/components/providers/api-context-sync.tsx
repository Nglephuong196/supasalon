import { clearApiContext, setApiContext } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { useEffect } from "react";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function ApiContextSync() {
  const session = useSession();

  useEffect(() => {
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

    const hasUser = Boolean((session.data as { user?: { id?: string } } | undefined)?.user?.id);
    const sessionOrganizationId = data?.session?.activeOrganizationId ?? null;
    const organizationId = hasUser
      ? sessionOrganizationId
      : readCookie("organizationId") ??
        (typeof localStorage !== "undefined" ? localStorage.getItem("organizationId") : null);
    const sessionId =
      data?.session?.id ??
      data?.session?.sessionId ??
      data?.session?.token ??
      readCookie("sessionId") ??
      readCookie("better-auth.session_token") ??
      (typeof localStorage !== "undefined" ? localStorage.getItem("sessionId") : null);

    setApiContext({ organizationId, sessionId });
    if (typeof localStorage !== "undefined") {
      if (organizationId) localStorage.setItem("organizationId", organizationId);
      else localStorage.removeItem("organizationId");
      if (sessionId) localStorage.setItem("sessionId", sessionId);
      else localStorage.removeItem("sessionId");
    }
  }, [session.data]);

  useEffect(() => {
    return () => {
      clearApiContext();
    };
  }, []);

  return null;
}
