import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
export const authClient = createAuthClient({
    baseURL: "https://bbus-admin.vercel.app/", // Base URL of your Better Auth backend.
    plugins: [
        expoClient({
            scheme: "bbus",
            storagePrefix: "bbus",
            storage: SecureStore,
        })
    ]
});