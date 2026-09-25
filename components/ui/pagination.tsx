import React from "react";
import { Button } from "./button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
}: PaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-3 px-4 border-t border-[#ECE7DE] bg-[#FFFFFF]/90 text-xs text-[#5C5850]">
      <div>
        Showing <span className="font-semibold text-[#1C1B18]">{start}</span> to{" "}
        <span className="font-semibold text-[#1C1B18]">{end}</span> of{" "}
        <span className="font-semibold text-[#1C1B18]">{total}</span> records
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="h-7 px-2 text-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5" />
          Previous
        </Button>

        <span className="px-2 font-medium">
          Page {page} of {totalPages || 1}
        </span>

        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="h-7 px-2 text-xs"
        >
          Next
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>
    </div>
  );
}
