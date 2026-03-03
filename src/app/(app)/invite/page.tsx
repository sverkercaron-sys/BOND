"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { createClient } from "@/lib/supabase/client";
import { getInviteUrl } from "@/lib/invite";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Link from "next/link";
import InviteModal from "@/components/invite-modal";

interface SentInvite {
  id: string;
  email: string;
  status: "pending" | "accepted";
  created_at: string;
}

export default function InvitePage() {
  const { user } = useAuth();
  const { couple } = useCouple();
  const supabase = createClient();
  const [mode, setMode] = useState<"no-partner" | "has-partner">("no-partner");
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (!user || !couple) return;

    if (couple.user2_id) {
      setMode("has-partner");
      loadFriendInvites();
    } else {
      setMode("no-partner");
    }
    setIsLoading(false);
  }, [user, couple]);

  const loadFriendInvites = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from("invites")
        .select("*")
        .eq("inviter_id", user.id)
        .eq("type", "friend")
        .order("created_at", { ascending: false });

      if (data) {
        setSentInvites(data as SentInvite[]);
      }
    } catch (error) {
      console.error("Error loading invites:", error);
    }
  };

  const acceptedCount = sentInvites.filter(
    (inv) => inv.status === "accepted"
  ).length;
  const progressPercent = Math.min((acceptedCount / 3) * 100, 100);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded"></div>
            <div className="h-40 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Bjud in folk till BOND
        </h1>

        {/* Mode A: No partner */}
        {mode === "no-partner" && (
          <div className="space-y-6">
            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Bjud in din partner
              </h2>
              <p className="text-gray-700 mb-4">
                Skapa en koppling genom att bjuda in din partner.
              </p>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Din partners e-post"
                  className="bg-white"
                />
                <div className="flex gap-3">
                  <Button className="flex-1">Skicka inbjudan</Button>
                  <Button variant="outline" className="flex-1">
                    Kopiera länk
                  </Button>
                </div>
              </div>
            </Card>

            {/* Cross-sell section */}
            <div className="mt-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Upptäck fler Dripline-produkter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">Insights</h4>
                  <p className="text-sm text-gray-600">
                    Få personlig feedback och insikter
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/insights"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">PUSH</h4>
                  <p className="text-sm text-gray-600">
                    Nå dina mål tillsammans
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/push"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">MIRROR</h4>
                  <p className="text-sm text-gray-600">
                    Se ditt värde reflekterat
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/mirror"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Mode B: Has partner */}
        {mode === "has-partner" && (
          <div className="space-y-6">
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">✓</span>
                <h2 className="text-lg font-bold text-gray-900">
                  Du och din partner är kopplade!
                </h2>
              </div>
              <p className="text-green-700">
                Börja med era dagliga övningar för att stärka relationen.
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Bjud in ett par ni känner
              </h2>
              <p className="text-gray-600 mb-4">
                Bjud in 3 par → lås upp bonusövningar
              </p>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {acceptedCount}/3 par bjudna
                  </span>
                  <span className="text-sm text-gray-600">
                    {acceptedCount === 3 ? "Olåst!" : ""}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      acceptedCount === 3 ? "bg-green-500" : "bg-blue-500"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <Input
                  type="email"
                  placeholder="E-post på ett par ni känner"
                  className="bg-white"
                />
                <Button className="w-full">Skicka inbjudan</Button>
              </div>

              {sentInvites.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Skickade inbjudningar
                  </h3>
                  <div className="space-y-2">
                    {sentInvites.map((invite) => (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {invite.email}
                        </span>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            invite.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {invite.status === "accepted"
                            ? "Accepterad"
                            : "Väntar"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Cross-sell section */}
            <div className="mt-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Upptäck fler Dripline-produkter
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">Insights</h4>
                  <p className="text-sm text-gray-600">
                    Få personlig feedback och insikter
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/insights"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">PUSH</h4>
                  <p className="text-sm text-gray-600">
                    Nå dina mål tillsammans
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/push"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>

                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <h4 className="font-bold text-gray-900 mb-2">MIRROR</h4>
                  <p className="text-sm text-gray-600">
                    Se ditt värde reflekterat
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4 w-full"
                    asChild
                  >
                    <a
                      href="https://dripline.io/mirror"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Lär dig mer
                    </a>
                  </Button>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>

      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        type="friend"
        coupleId={couple?.id || ""}
        onSuccess={() => {
          loadFriendInvites();
          setShowInviteModal(false);
        }}
      />
    </div>
  );
}
