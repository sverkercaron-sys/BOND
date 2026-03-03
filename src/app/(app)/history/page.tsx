"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useAuth } from "@hooks/use-auth";
import { useCouple } from "@/hooks/use-couple";
import { createClient } from "@/lib/supabase/client";

interface CompletedExercise 
  id: string;
  date: string;
  category: string;
  title: string;
  completed: boolean;
}

type Category = "Alla" | "Uppskattning" | "Nyfikenhet" | "Minnen" | "Ömsesidighet" | "Lek";

const CATEGORIES: Category[] = ["Alla", "Uppskattning", "Nyfikenhet", "Minnen", "Ömsesidighet", "Lek"];

const CATEGORY_MAP: Record<string, Category> = {
  appreciation: "Uppskattning",
  curiosity: "Nyfikenhet",
  memories: "Minnen",
  reciprocity: "Ömsesidighet",
  play: "Lek",
};

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { couple, loading: coupleLoading } = useCouple();
  const supabase = createClient();

  const [selectedCategory, setSelectedCategory] = useState<Category>("Alla");
  const [searchQuery, setSearchQuery] = useState("");
  const [exercises, setExercises] = useState<CompletedExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    const fetchExercises = async () => {
      if (!user || !couple) return;

      try {
        setLoading(true);

        let query = supabase
          .from("daily_assignments")
          .select(
            `
              id,
              date,
              completed,
              exercises (
                id,
                title,
                category
              )
            `
          )
          .eq("couple_id", couple.id)
          .order("date", { ascending: false });

        if (selectedCategory !== "Alla") {
          const categoryKey = Object.keys(CATEGORY_MAP).find(
            (key) => CATEGORY_MAP[key as keyof typeof CATEGORY_MAP] === selectedCategory
          );
          if (categoryKey) {
            query = query.eq("exercises.category", categoryKey);
          }
        }

        const { data, error } = await query.range(
          page * ITEMS_PER_PAGE,
          (page + 1) * ITEMS_PER_PAGE - 1
        );

        if (error) throw error;

        const processed = (data || [])
          .filter((assignment: any) => {
            const title = assignment.exercises?.[0]?.title || "";
            return title.toLowerCase().includes(searchQuery.toLowerCase());
          })
          .map((assignment: any) => ({
            id: assignment.id,
            date: assignment.date,
            category: assignment.exercises?.[0]?.category || "",
            title: assignment.exercises?.[0]?.title || "",
            completed: assignment.completed,
          }));

        setExercises((prev) => (page === 0 ? processed : [...prev, ...processed]));
        setHasMore(processed.length === ITEMS_PER_PAGE);
      } catch (error) {
        console.error("Error fetching exercises:", error);
      } finally {
        setLoading(false);
      }
    };

    setPage(0);
    setExercises([]);
    fetchExercises();
  }, [user, couple, selectedCategory, searchQuery, supabase]);

  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  const getCategoryColor = (category: string): string => {
    const categoryLower = category.toLowerCase();
    const colorMap: Record<string, string> = {
      appreciation: "bg-bond-primary",
      curiosity: "bg-bond-accent",
      memories: "bg-bond-success",
      reciprocity: "bg-bond-warning",
      play: "bg-bond-info",
    };
    return colorMap[categoryLower] || "bg-bond-bg-alt";
  };

  const getCategoryLabel = (category: string): string => {
    return CATEGORY_MAP[category as keyof typeof CATEGORY_MAP] || category;
  };

  if (authLoading || coupleLoading) {
    return (
      <div className="w-full max-w-2xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-bond-bg-alt rounded-lg" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-bond-bg-alt rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-bond-text">Historik</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? "bg-bond-primary text-white"
                : "bg-bond-bg-alt text-bond-text hover:bg-bond-bg-light"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Sök övning..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-bond-bg-alt text-bond-text placeholder-bond-text-light border border-bond-bg-light focus:outline-none focus:border-bond-primary"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-bond-text-light">
          🔍
        </span>
      </div>

      {/* Exercises List */}
      {exercises.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-bond-text-light text-lg">
            Inga övningar än. Börja med dagens övning!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              className="flex items-center justify-between p-4 bg-bond-bg-alt rounded-lg hover:bg-bond-bg-light transition-colors"
            >
              <div className="flex items-center gap-4 flex-1">
                {exercise.completed ? (
                  <span className="text-2xl">✓</span>
                ) : (
                  <span className="text-2xl text-bond-text-light">✗</span>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-bond-text">{exercise.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded text-white ${getCategoryColor(exercise.category)}`}>
                      {getCategoryLabel(exercise.category)}
                    </span>
                    <span className="text-xs text-bond-text-light">
                      {format(new Date(exercise.date), "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={loading}
              className="w-full px-4 py-3 rounded-lg font-semibold bg-bond-primary text-white hover:bg-bond-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? "Laddar..." : "Ladda mer"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
