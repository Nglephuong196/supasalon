import { createAuthClient } from "better-auth/svelte";
import { inferAdditionalFields } from "better-auth/client/plugins";

export const authClient = createAuthClient({
    baseURL: import.meta.env.VITE_AUTH_BASE_URL,
    plugins: [
        inferAdditionalFields({
            user: {
                salonName: { type: "string" },
                province: { type: "string" },
                address: { type: "string" },
                phone: { type: "string" },
            },
        }),
    ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
