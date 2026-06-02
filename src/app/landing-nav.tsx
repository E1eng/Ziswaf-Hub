"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/lembaga", label: "Direktori Lembaga" },
  { href: "/program", label: "Program Aktif" },
  { href: "/lacak", label: "Lacak Penyaluran" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 font-bold text-base sm:text-xl">
          <div className="size-8 sm:size-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-sm sm:text-base font-bold">Z</span>
          </div>
          ZISWAF Hub
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-7 text-sm">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/demo"
            className="px-3 lg:px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Coba Demo
          </Link>
          <Link
            href="/login"
            className="px-3 lg:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="px-4 lg:px-5 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Daftar
          </Link>
        </div>

        {/* Mobile hamburger */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <button
                type="button"
                aria-label="Buka menu"
                className="md:hidden p-2 -mr-2 rounded-lg hover:bg-muted"
              />
            }
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88%] max-w-sm flex flex-col gap-0 p-0">
            <SheetHeader className="border-b p-5">
              <SheetTitle className="flex items-center gap-2 text-base">
                <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground text-sm font-bold">Z</span>
                </div>
                ZISWAF Hub
              </SheetTitle>
            </SheetHeader>

            <nav className="flex-1 flex flex-col p-2 gap-1 overflow-auto">
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-lg text-base font-medium hover:bg-muted transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="border-t p-4 space-y-2">
              <Link
                href="/demo"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center px-4 py-3 rounded-xl border-2 border-emerald-300 bg-emerald-50 text-emerald-700 text-sm font-medium"
              >
                Coba Demo Langsung
              </Link>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center px-4 py-3 rounded-xl border text-sm font-medium hover:bg-muted"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
                >
                  Daftar
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
