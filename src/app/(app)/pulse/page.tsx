"use client";

import { useEffect, useState } from "react";
import { getDay, getHours, addDays, format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@/hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
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

const QUESTION_KEYS: Array<
  keyof Omit<PulseResponse, "id" | "user_id" | "couple_id" | "week_start" | "created_at">
> = ["connection", "communication", "appreciation", "fun", "trust"];

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("sb-") && trimmed.includes("-auth-token=")) {
      const value = trimmed.split("=").slice(1).join("=");
      if (value.startsWith("base64-")) {
        try {
          const decoded = JSON.parse(atob(value.replace("base64-", "")));
          return decoded.access_token || null;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function supabaseRest(path: string, options?: RequestInit) {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    apikey: SUPABASE_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) {
    headers["Authorization"] = "Bearer " + token;
  }
  const res = await fetch(SUPABASE_URL + "/rest/v1/" + path, {
    ...options,
    headers: { ...headers, ...(options?.headers || {}) },
  });
  if (!res.ok) throw new Error("Supabase REST error: " + res.status);
  return res.json();
}

export default function PulsePage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();

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
      const dayOfWeek = getDay(now);
      const hour = getHours(now);
      const inWindow = (dayOfWeek === 0 && hour >= 17) || dayOfWeek === 1;
      setIsInWindow(inWindow);

      if (!inWindow) {
        const daysUntilSunday = (7 - dayOfWeek) % 7;
        const nextSunday = addDays(now, daysUntilSunday === 0 ? 7 : daysUntilSunday);
        nextSunday.setHours(17, 0, 0, 0);
        setNextOpenTime(nextSunday);
      }
    };
    checkTimeWindow();
    const interval = setInterval(checkTimeWindow, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPulseData = async () => {
      if (!user) return;

      if (!couple) {
        setLoading(false);
        return;
      }

      try {
        // Check if user already responded this week
        const userResponse = await supabaseRest(
          "pulse_responses?select=*&user_id=eq." +
            user.id +
            "&couple_id=eq." +
            couple.id +
            "&order=created_at.desc&limit=1"
        );

        if (userResponse && userResponse.length > 0) {
          setHasResponded(true);

          // Check if partner also responded
          const partnerResponse = await supabaseRest(
            "pulse_responses?select=*&couple_id=eq." +
              couple.id +
              "&user_id=neq." +
              user.id +
              "&order=created_at.desc&limit=1"
          );

          if (partnerResponse && partnerResponse.length > 0) {
            setPartnerResponded(true);
          }
        }

        // Fetch history data
        const history = await supabaseRest(
          "pulse_weekly?select=*&couple_id=eq." +
            couple.id +
            "&order=week_start.asc"
        );

        if (history) {
          setHistoryData(history);
        }
      } catch (error) {
        console.error("Error fetching pulse data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPulseData();
  }, [user, couple]);

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
      weekStart.setDate(
        today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
      );

      const responseData = {
        user_id: user.id,
        couple_id: couple.id,
        week_start: weekStart.toISOString().split("T")[0],
        ...responses,
        created_at: new Date().toISOString(),
      };

      await supabaseRest("pulse_responses", {
        method: "POST",
        body: JSON.stringify([responseData]),
      });

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
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="h-64 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!isInWindow) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Pulsen är stängd
          </h1>
          <p className="text-gray-500">
            Pulsen öppnas igen på söndag kväll.
          </p>
          {nextOpenTime && (
            <p className="text-teal-600 font-semibold">
              Nästa öppning:{" "}
              {format(nextOpenTime, "eeee d MMMM 'kl.' HH:mm", { locale: sv })}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (hasResponded && !partnerResponded) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white shadow-sm border border-gray-100 p-8 rounded-lg space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">
            Du har redan svarat
          </h1>
          <p className="text-gray-500">Väntar på din partner...</p>
        </div>
      </div>
    );
  }

  if (hasResponded && partnerResponded) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
        <h1 className="text-2xl font-bold text-gray-800">Din Puls</h1>
        <p className="text-sm text-gray-500 text-center">
          Din partner ser bara det gemensamma resultatet.
        </p>
        <PulseChart data={historyData} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-8">
      <p className="text-sm text-gray-500 text-center mb-6">
        Din partner ser bara det gemensamma resultatet.
      </p>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-500">
            Fråga {currentQuestion + 1} av {QUESTIONS.length}
          </span>
          <div className="flex gap-1">
            {Array.from({ length: QUESTIONS.length }).map((_, i) => (
              <div
                key={i}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i <= currentQuestion ? "bg-teal-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-800">
            {QUESTIONS[currentQuestion]}
          </h2>
          <div className="space-y-4">
            <input
              type="range"
              min="1"
              max="5"
              value={responses[QUESTION_KEYS[currentQuestion]] || 3}
              onChange={(e) => handleResponseChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1</span>
              <span className="font-bold text-gray-800">
                {responses[QUESTION_KEYS[currentQuestion]] || 3}
              </span>
              <span>5</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleBack}
            disabled={currentQuestion === 0}
            className="flex-1 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 bg-gray-100 text-gray-700 hover:bg-gray-200"
          >
            Tillbaka
          </button>
          {currentQuestion < QUESTIONS.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
            >
              Nästa
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg font-semibold bg-green-500 text-white hover:bg-green-600 transition-colors"
            >
              Skicka
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
