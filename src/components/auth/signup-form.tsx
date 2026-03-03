"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SignUpFormProps {
  inviteToken?: string;
}

export default function SignUpForm({ inviteToken }: SignUpFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      toast.success("Konto skapat!");
      if (inviteToken) {
        router.push("/invite/" + inviteToken);
      } else {
        router.push("/home");
      }
    } catch (error: any) {
      toast.error(error.message || "Kunde inte skapa konto");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input type="text" placeholder="Ditt namn" value={name} onChange={(e) => setName(e.target.value)} required disabled={isLoading} />
      <Input type="email" placeholder="E-postadress" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={isLoading} />
      <Input type="password" placeholder="Losenord" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={isLoading} />
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Skapar konto..." : "Skapa konto"}
      </Button>
    </form>
  );
}
