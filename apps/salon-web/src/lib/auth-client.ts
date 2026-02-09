import { createAuthClient } from "better-auth/react";
import { organizationClient } from "better-auth/client/plugins";

const authBaseURL = import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:8787";

export const authClient = createAuthClient({
  baseURL: authBaseURL,
  basePath: "/api/auth",
  plugins: [organizationClient()],
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
