"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { User, Couple } from "@/types";

export function useCouple(user: User | null = null) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    let isMounted = true;

    const fetchCoupleData = async () => {
      if (!user?.couple_id) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Fetch couple data
        const { data: coupleData, error: coupleError } = await supabase
          .from("couples")
          .select("*")
          .eq("id", user.couple_id)
          .single();

        if (coupleError) throw coupleError;

        if (isMounted) {
          setCouple(coupleData);
        }

        // Fetch partner data
        const partnerId = user.is_user1
          ? coupleData?.user2_id
          : coupleData?.user1_id;

        if (partnerId) {
          const { data: partnerData, error: partnerError } = await supabase
            .from("users")
            .select("*")
            .eq("id", partnerId)
            .single();

          if (partnerError) throw partnerError;

          if (isMounted) {
            setPartner(partnerData);
          }
        }
      } catch (error) {
        console.error("Error fetching couple data:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCoupleData();

    return () => {
      isMounted = false;
    };
  }, [user?.id, user?.couple_id]);

  return { couple, partner, loading };
}
