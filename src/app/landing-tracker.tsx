"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function LandingTracker() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      router.push("/lacak");
      return;
    }
    router.push(`/lacak?kode=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto"
    >
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="ZH-2026-XXXXXX atau D-2026-XXXXXX"
          className="w-full pl-11 pr-4 py-3.5 text-sm sm:text-base border-2 rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow font-mono uppercase"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button
        type="submit"
        className="px-6 py-3.5 bg-primary text-primary-foreground rounded-xl text-sm sm:text-base font-semibold hover:bg-primary/90 transition-colors whitespace-nowrap"
      >
        Lacak Sekarang
      </button>
    </form>
  );
}
