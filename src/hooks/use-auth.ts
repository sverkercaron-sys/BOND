"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/types";

// Read session directly from cookie - bypasses Supabase auth client lock issues
function getSessionFromCookie() {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("sb-") && trimmed.includes("-auth-token=")) {
      const value = trimmed.split("=").slice(1).join("=");
      if (value.startsWith("base64-")) {
        try {
          const decoded = JSON.parse(atob(value.replace("base64-", "")));
          if (decoded.access_token && decoded.user?.id) {
            return decoded;
          }
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const session = getSessionFromCookie();
        if (!session?.user?.id || !session?.access_token) return;

        // Fetch user directly via REST API - no auth client, no locks
        const response = await fetch(
          process.env.NEXT_PUBLIC_SUPABASE_URL +
            "/rest/v1/users?select=*&id=eq." +
            session.user.id,
          {
            headers: {
              apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
              Authorization: "Bearer " + session.access_token,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch user");

        const data = await response.json();
        if (data.length > 0 && isMounted) {
          setUser(data[0]);
        }
      } catch (error) {
        console.error("Auth error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signOut = async () => {
    // Clear all Supabase cookies
    document.cookie.split(";").forEach((c) => {
      const name = c.trim().split("=")[0];
      if (name.startsWith("sb-")) {
        document.cookie =
          name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      }
    });
    setUser(null);
    router.push("/");
  };

  return { user, loading, signOut };
}
