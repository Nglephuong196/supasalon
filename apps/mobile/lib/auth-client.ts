import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import { organizationClient } from "better-auth/client/plugins";
import * as SecureStore from "expo-secure-store";

export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_AUTH_BASE_URL || "http://10.0.2.2:8787",
  plugins: [
    expoClient({
      scheme: "supasalon",
      storagePrefix: "supasalon",
      storage: SecureStore,
    }),
    organizationClient(),
  ],
});

export const { signIn, signUp, signOut, useSession, organization } = authClient;
