"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import { getInviteByToken, acceptInvite } from "@/lib/invite";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SignUpForm from "@/components/auth/signup-form";
import Link from "next/link";

interface Invite {
  id: string;
  token: string;
  inviter_id: string;
  couple_id: string;
  type: string;
  status: "pending" | "accepted" | "expired";
  accepted_by?: string;
  created_at: string;
  expires_at: string;
  inviter?: {
    name: string;
    email: string;
  };
}

type PageState = "loading" | "expired" | "accepted" | "pending" | "signup";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const token = params.token as string;

  const [state, setState] = useState<PageState>("loading");
  const [invite, setInvite] = useState<Invite | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadInvite = async () => {
      try {
        const inviteData = await getInviteByToken(supabase, token);

        if (!inviteData) {
          setState("expired");
          return;
        }

        setInvite(inviteData);

        // Check if expired
        const expiresAt = new Date(inviteData.expires_at);
        if (expiresAt < new Date()) {
          setState("expired");
          return;
        }

        // Check if already accepted
        if (inviteData.status === "accepted") {
          setState("accepted");
          return;
        }

        // If logged in
        if (user) {
          setState("pending");
        } else {
          setState("signup");
        }
      } catch (error) {
        console.error("Error loading invite:", error);
        setState("expired");
      }
    };

    loadInvite();
  }, [token, user, supabase]);

  const handleAccept = async () => {
    if (!invite || !user) return;

    setIsLoading(true);
    try {
      await acceptInvite(supabase, invite.id, user.id, invite.couple_id);
      toast.success("Du har gått med i BOND!");
      setState("accepted");
      setTimeout(() => router.push("/home"), 1500);
    } catch (error) {
      toast.error("Kunde inte acceptera inbjudan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* BOND Header */}
        <div className="text-center mb-8">
          <Link href="/">
            <h1 className="text-4xl font-bold text-blue-600 mb-2">BOND</h1>
          </Link>
          <p className="text-gray-600">Tillsammans, dagligen</p>
        </div>

        {state === "loading" && (
          <Card className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            </div>
          </Card>
        )}

        {state === "expired" && (
          <Card className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Inbjudan har gått ut
            </h2>
            <p className="text-gray-600 mb-6">
              Be din partner skicka en ny inbjudan.
            </p>
            <Button asChild className="w-full">
              <Link href="/">Tillbaka till startsidan</Link>
            </Button>
          </Card>
        )}

        {state === "accepted" && (
          <Card className="p-6 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Inbjudan redan använd
            </h2>
            <p className="text-gray-600 mb-6">
              Du är redan medlem i BOND.
            </p>
            <Button asChild className="w-full">
              <Link href="/home">Gå till BOND</Link>
            </Button>
          </Card>
        )}

        {state === "pending" && invite && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Du har blivit inbjuden!
            </h2>
            <p className="text-gray-600 mb-4">
              {invite.inviter?.name} har bjudit in dig till BOND.
            </p>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? "Accepterar..." : "Acceptera och gå med"}
            </Button>
          </Card>
        )}

        {state === "signup" && invite && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2 text-center">
              {invite.inviter?.name} har bjudit in dig till BOND
            </h2>
            <p className="text-gray-600 text-center mb-6 text-sm">
              Skapa ett konto för att acceptera inbjudan
            </p>
            <SignUpForm inviteToken={token} />
          </Card>
        )}
      </div>
    </div>
  );
}
