import { Card, CardContent } from "@/components/ui/card";
import { Construction, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";

interface Props {
  pageTitle: string;
  pageDescription: string;
  phase: string;
  whatToDoMeanwhile?: { href: string; label: string }[];
}

export function WorkInProgress({ pageTitle, pageDescription, phase, whatToDoMeanwhile }: Props) {
  return (
    <div className="flex flex-col">
      <PageHeader title={pageTitle} description={pageDescription} />
      <main className="flex-1 p-8 max-w-3xl">
        <Card className="border-amber-200 bg-amber-50/30">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Construction className="size-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Sedang Dimigrate ke Schema v2</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Halaman ini sedang direfactor ke arsitektur baru ({phase})
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Schema database baru sudah siap (mustahik registry, assessments, allocations,
              assistance log, donations). Halaman ini akan menggantikan flow lama agar match
              dengan domain model baru.
            </p>

            {whatToDoMeanwhile && whatToDoMeanwhile.length > 0 && (
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Sementara, Anda bisa:</p>
                <div className="flex flex-wrap gap-2">
                  {whatToDoMeanwhile.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg bg-background hover:bg-muted transition-colors"
                    >
                      {link.label}
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
