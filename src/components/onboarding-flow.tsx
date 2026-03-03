"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { createInvite, getInviteUrl } from "@/lib/invite";
import InviteModal from "./invite-modal";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface Exercise {
  id: string;
  day_number: number;
  title: string;
  description: string;
  instructions: string;
  duration_minutes: number;
}

interface OnboardingFlowProps {
  isOpen: boolean;
  firstExercise?: Exercise;
  onComplete?: () => void;
}

export default function OnboardingFlow({
  isOpen,
  firstExercise,
  onComplete,
}: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [inviteEmail, setInviteEmail] = useState("");
  const [notificationHour, setNotificationHour] = useState(19);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { couple } = useCouple();
  const supabase = createClient();

  if (!isOpen || !user) return null;

  const handleInviteSend = async () => {
    if (!inviteEmail || !couple) return;

    setIsLoading(true);
    try {
      const invite = await createInvite(supabase, user.id, couple.id, "partner");
      toast.success("Inbjudan skickad!");
      setStep(2);
      setInviteEmail("");
    } catch (error) {
      toast.error("Kunde inte skicka inbjudan");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeSet = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          notification_time: `${String(notificationHour).padStart(2, "0")}:00`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Påminnelsetid sparad!");
      setStep(3);
    } catch (error) {
      toast.error("Kunde inte spara påminnelsetid");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("users")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Välkommen till BOND!");
      onComplete?.();
    } catch (error) {
      toast.error("Kunde inte slutföra onboarding");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    setStep(3);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-lg shadow-lg max-w-md w-full p-6"
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= step ? "bg-blue-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          {/* Step 1: Invite partner */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Bjud in din partner
                </h2>
                <p className="text-gray-600">
                  Skapa en koppling genom att bjuda in din partner.
                </p>
              </div>

              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Din partners e-post eller telefon"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  disabled={isLoading}
                />

                <Button
                  onClick={handleInviteSend}
                  disabled={!inviteEmail || isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Skickar..." : "Skicka inbjudan"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isLoading}
                >
                  Kopiera länk
                </Button>

                <button
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Jag vill testa själv först
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Set notification time */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  När vill ni påminnas?
                </h2>
                <p className="text-gray-600 text-sm">
                  Ni får en påminnelse varje dag vid denna tid.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNotificationHour(
                        notificationHour === 0 ? 23 : notificationHour - 1
                      )
                    }
                  >
                    −
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {String(notificationHour).padStart(2, "0")}
                    </div>
                    <div className="text-sm text-gray-500">:00</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setNotificationHour(
                        notificationHour === 23 ? 0 : notificationHour + 1
                      )
                    }
                  >
                    +
                  </Button>
                </div>

                <Button
                  onClick={handleTimeSet}
                  disabled={isLoading}
                  className="w-full"
                  size="lg"
                >
                  {isLoading ? "Sparar..." : "Spara tid"}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First exercise */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Er första övning!
                </h2>
              </div>

              {firstExercise && (
                <Card className="p-4 bg-blue-50 border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {firstExercise.title}
                  </h3>
                  <p className="text-sm text-gray-700 mb-2">
                    {firstExercise.description}
                  </p>
                  <p className="text-xs text-gray-600 mb-3">
                    ⏱ {firstExercise.duration_minutes} minuter
                  </p>
                  <p className="text-sm text-gray-700">
                    {firstExercise.instructions}
                  </p>
                </Card>
              )}

              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? "Sparar..." : "Klar!"}
              </Button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
