import { organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const authBaseURL =
  import.meta.env.VITE_AUTH_BASE_URL ??
  import.meta.env.VITE_API_URL ??
  import.meta.env.PUBLIC_API_URL ??
  "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
