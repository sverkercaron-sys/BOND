"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const searchParams = useSearchParams();
  const refToken = searchParams.get("ref");
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken.");
      setLoading(false);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, ref_token: refToken },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      window.location.href = "/home";
    } else {
      setSuccess(true);
    }

    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bond-bg px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="text-3xl font-bold text-bond-primary mb-2">BOND</div>
            <CardTitle className="text-xl">Kolla din e-post!</CardTitle>
            <CardDescription>
              Vi har skickat en verifieringslänk till <strong>{email}</strong>.
              Klicka på länken för att aktivera ditt konto.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-bond-text-light">
              Fick du inget mail? Kolla skräpposten eller{" "}
              <button
                onClick={() => setSuccess(false)}
                className="text-bond-primary font-medium hover:underline"
              >
                försök igen
              </button>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bond-bg px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="text-3xl font-bold text-bond-primary mb-2">BOND</div>
          <CardTitle className="text-xl">Skapa konto</CardTitle>
          <CardDescription>
            Börja stärka er relation med 3 minuter om dagen
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Förnamn</Label>
              <Input
                id="name"
                type="text"
                placeholder="Ditt förnamn"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Minst 8 tecken"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Skapar konto..." : "Skapa konto"}
            </Button>
          </form>

          <p className="text-center text-sm text-bond-text-light mt-6">
            Har du redan ett konto?{" "}
            <Link href="/login" className="text-bond-primary font-medium hover:underline">
              Logga in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
