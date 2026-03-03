"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Fel e-post eller lösenord. Försök igen.");
      setLoading(false);
    } else {
      router.push("/home");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bond-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-bond-primary mb-2">BOND</div>
          <CardTitle className="text-xl">Välkommen tillbaka</CardTitle>
          <CardDescription>Logga in för att fortsätta</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                placeholder="din@email.se"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Lösenord</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Loggar in..." : "Logga in"}
            </Button>
          </form>

          <p className="text-center text-sm text-bond-text-light mt-6">
            Har du inget konto?{" "}
            <Link href="/signup" className="text-bond-primary font-medium hover:underline">
              Skapa ett
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
