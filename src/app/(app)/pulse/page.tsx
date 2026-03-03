"use client";

import { useEffect, useState } from "react";
import { getDay, getHours, addDays, format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { createClient } from "@/lib/supabase/client";
import PulseChart from "@/components/pulse-chart";

interface PulseResponse {
  id: string;
  user_id: string;
  couple_id: string;
  week_start: string;
  connection: number;
  communication: number;
  appreciation: number;
  fun: number;
  trust: number;
  created_at: string;
}

interface PulseWeekly {
  week_start: string;
  connection: number;
  communication: number;
  appreciation: number;
  fun: number;
  trust: number;
}

const QUESTIONS = [
  "Hur nära har du känt dig din partner?",
  "Hur bra har ni kommunicerat?",
  "Hur uppskattad har du känt dig?",
  "Hur mycket har ni skrattat tillsammans?",
  "Hur trygg känner du dig i relationen?",
];

const QUESTION_KEYS: Array<keyof Omit<PulseResponse, "id" | "user_id" | "couple_id" | "week_start" | "created_at">> = [
  "connection",
  "communication",
  "appreciation",
  "fun",
  "trust",
];

export default function PulsePage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const supabase = createClient();

  const [isInWindow, setIsInWindow] = useState(false);
  const [hasResponded, setHasResponded] = useState(false);
  const [partnerResponded, setPartnerResponded] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [historyData, setHistoryData] = useState<PulseWeekly[]>([]);
  const [nextOpenTime, setNextOpenTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkTimeWindow = () => {
      const now = new Date();
      const dayOfWeek = getDay(now); // 0 = Sunday, 1 = Monday, etc.
      const hour = getHours(now);

      const isInWindow =
        (dayOfWeek === 0 && hour >= 17) ||
        (dayOfWeek === 1);

      setIsInWindow(isInWindow);

      if (!isInWindow) {
        // Calculate next Sunday 17:00
        const nextSunday = addDays(now, (7 - dayOfWeek) % 7);
        nextSunday.setHours(17, 0, 0, 0);
        setNextOpenTime(nextSunday);
      }
    };

    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPulseData = async () => {
      if (!user || !couple) return;

      try {
        setLoading(true);

        // Check if user already responded this week
        const { data: userResponse, error: responseError } = await supabase
          .from("pulse_responses")
          .select("*")
          .eq("user_id", user.id)
          .eq("couple_id", couple.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (responseError) throw responseError;

        if (userResponse && userResponse.length > 0) {
          setHasResponded(true);
          // Check if partner also responded
          const { data: partnerResponse } = await supabase
            .from("pulse_responses")
            .select("*")
            .eq("couple_id", couple.id)
            .neq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (partnerResponse && partnerResponse.length > 0) {
            setPartnerResponded(true);
          }
        }

        // Fetch history data
        const { data: historyData } = await supabase
          .from("pulse_weekly")
          .select("*")
          .eq("couple_id", couple.id)
          .order("week_start", { ascending: true });

        if (historyData) {
          setHistoryData(historyData);
        }
      } catch (error) {
        console.error("Error fetching pulse data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPulseData();
  }, [user, couple, supabase]);

  const handleResponseChange = (value: number) => {
    setResponses({
      ...responses,
      [QUESTION_KEYS[currentQuestion]]: value,
    });
  };

  const handleNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user || !couple) return;

    try {
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));

      const responseData = {
        user_id: user.id,
        couple_id: couple.id,
        week_start: weekStart.toISOString().split("T")[0],
        ...responses,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("pulse_responses")
        .insert([responseData]);

      if (error) throw error;

      setHasResponded(true);
      setCurrentQuestion(0);
      setResponses({});
    } catch (error) {
      console.error("Error submitting pulse response:", error);
    }
  };

  if (authLoading || coupleLoading || loading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-12 bg-bond-bg-alt rounded-lg" />
          <div className="h-64 bg-bond-bg-alt rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isInWindow) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <div className="bg-bond-bg-alt p-8 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-bond-text">Pulsen är stängd</h1>
          <p className="text-bond-text-light">
            Pulsen öppnas igen på söndag kväll.
          </p>
          {nextOpenTime && (
            <p className="text-bond-primary font-semibold">
              Nästa öppning: {format(nextOpenTime, "eeee d MMMM 'kl.' HH:mm", { locale: sv })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (hasResponded && !partnerResponded) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <div className="bg-bond-bg-alt p-8 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-bond-text">
            Du har redan svarat
          </h1>
          <p className="text-bond-text-light">
            Väntar på din partner...
          </p>
        </div>
      </div>
    );
  }

  if (hasResponded && partnerResponded) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold text-bond-text">Din Puls</h1>
        <p className="text-sm text-bond-text-light text-center">
          Din partner ser bara det gemensamma resultatet.
        </p>
        <PulseChart data={historyData} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <p className="text-sm text-bond-text-light text-center mb-6">
        Din partner ser bara det gemensamma resultatet.
      </p>

      <div className="space-y-6">
        {/* Progress Indicator */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-bond-text-light">
            Fråga {currentQuestion + 1} av {QUESTIONS.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: QUESTIONS.length }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= currentQuestion ? "bg-bond-primary" : "bg-bond-bg-alt"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-bond-text">
            {QUESTIONS[currentQuestion]}
          </h2>

          {/* Slider */}
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="5"
              value={responses[QUESTION_KEYS[currentQuestion]] || 3}
              onChange={(e) => handleResponseChange(Number(e.target.value))}
              className="w-full h-2 bg-bond-bg-alt rounded-lg appearance-none cursor-pointer accent-bond-primary"
            />
            <div className="flex justify-between text-xs text-bond-text-light">
              <span>1</span>
              <span className="font-bold text-bond-text">
                {responses[QUESTION_KEYS[currentQuestion]] || 3}
              </span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 bg-bond-bg-alt text-bond-text hover:bg-bond-bg-light"
          >
            Tillbaka
          </button>
          {currentQuestion < QUESTIONS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-bond-primary text-white hover:bg-bond-primary-dark transition-colors"
            >
              Nästa
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-bond-success text-white hover:bg-bond-success-dark transition-colors"
            >
              Skicka
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
