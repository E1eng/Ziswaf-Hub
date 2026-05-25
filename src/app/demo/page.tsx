"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

/**
 * Demo Mode — Automatic login for hackathon judges.
 * Creates or signs in with a demo account, then redirects to dashboard.
 */

const DEMO_EMAIL = "demo@ziswafhub.id";
const DEMO_PASSWORD = "demo-judge-2026";

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Menyiapkan akun demo...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function autoLogin() {
      const supabase = createClient();

      // Try sign in first
      setStatus("Login ke akun demo...");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });

      if (!signInError) {
        setStatus("Berhasil! Mengarahkan ke dashboard...");
        router.push("/dashboard");
        return;
      }

      // If sign in fails, try to create account
      setStatus("Membuat akun demo baru...");
      const { error: signUpError } = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          data: {
            full_name: "Demo Judge",
            role: "admin",
          },
        },
      });

      if (signUpError) {
        // If sign up also fails (email confirmation required), just try signing in again
        const { error: retryError } = await supabase.auth.signInWithPassword({
          email: DEMO_EMAIL,
          password: DEMO_PASSWORD,
        });

        if (retryError) {
          setError(`Tidak dapat login: ${retryError.message}. Silakan hubungi developer.`);
          return;
        }
      }

      setStatus("Berhasil! Mengarahkan ke dashboard...");
      router.push("/dashboard");
    }

    autoLogin();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 max-w-md px-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
          Z
        </div>
        <h1 className="text-2xl font-bold">ZISWAF Hub — Demo Mode</h1>
        {error ? (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 text-sm font-medium text-red-600 underline"
            >
              Coba Lagi
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="size-5 animate-spin text-primary" />
            <p className="text-muted-foreground">{status}</p>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Akun demo: {DEMO_EMAIL} — Semua fitur tersedia tanpa batasan.
        </p>
      </div>
    </div>
  );
}
