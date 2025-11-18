import { authClient } from "@/lib/auth-client";
import * as SecureStore from 'expo-secure-store';
export const makeAuthenticatedRequest = async (api_path: string, body?: BodyInit | null | undefined, method: "POST" | "GET" = "GET") => {
  const cookies = authClient.getCookie(); 
  const headers: any = {
    "Cookie": cookies
  };
  if (body) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch("https://bbus-admin.vercel.app/api/" + api_path, { 
    headers,
    // 'include' can interfere with the cookies we just set manually in the headers
    credentials: "omit",
    body,
    method
  });
  SecureStore.setItemAsync("lastConnectedTime", new Date().getTime().toString());
  return await response.json();
};