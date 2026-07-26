"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/toast-provider";
import { STABLE_BUTTON, STABLE_STATUS_BAR } from "@/lib/ui-stable";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [festivalCode, setFestivalCode] = useState("C15-2026");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ festivalCode, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Identifiants invalides";
        setError(msg);
        toast({ type: "error", message: msg });
        return;
      }
      const redirect = searchParams.get("redirect");
      router.push(redirect || data.redirectTo || "/");
    } catch {
      setError("Erreur de connexion");
      toast({ type: "error", message: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">PLANN</CardTitle>
        <p className="text-zinc-500 text-sm">Planification festival</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="festivalCode">Code festival</Label>
            <Input
              id="festivalCode"
              value={festivalCode}
              onChange={(e) => setFestivalCode(e.target.value.toUpperCase())}
              className="text-lg min-h-12"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <Label htmlFor="pin">PIN personnel</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4,6}"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-2xl text-center tracking-widest min-h-14"
              autoComplete="off"
              required
            />
          </div>
          <div className={cn(STABLE_STATUS_BAR, "text-red-600")} aria-live="polite">
            {error || "\u00A0"}
          </div>
          <Button
            type="submit"
            className={cn("w-full min-h-12 text-lg", STABLE_BUTTON)}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? <Spinner className="h-5 w-5" /> : "Se connecter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <Suspense fallback={<div className="h-[24rem] w-full max-w-md animate-pulse rounded-xl bg-zinc-200" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
