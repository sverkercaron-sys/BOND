"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        // Get current session
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user && isMounted) {
          // Fetch user from users table
          const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (error) throw error;

          if (isMounted) {
            setUser(userData);
          }
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

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && isMounted) {
        const { data: userData } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (isMounted) {
          setUser(userData || null);
        }
      } else if (!session && isMounted) {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return { user, loading, signOut };
}
