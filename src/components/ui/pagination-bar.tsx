"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (next: number) => void;
}

/**
 * Simple client-side pagination bar.
 * Pages are 1-indexed. Hides itself when there's only one page.
 */
export function PaginationBar({ page, pageSize, totalItems, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(totalItems, page * pageSize);

  return (
    <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t text-xs">
      <p className="text-muted-foreground">
        Menampilkan {start}–{end} dari {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="size-3.5" />
          <span className="hidden sm:inline ml-1">Sebelum</span>
        </Button>
        <span className="px-2 text-muted-foreground">
          Hal {page} / {totalPages}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span className="hidden sm:inline mr-1">Berikut</span>
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
