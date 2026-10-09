"use client";

import { useId, useMemo, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const PAGE_SIZE_OPTIONS = [20, 50, 100] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export function useTablePagination<T>(
  items: T[],
  defaultPageSize: PageSizeOption = 20,
) {
  const [pageSize, setPageSizeState] =
    useState<PageSizeOption>(defaultPageSize);
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount =
    items.length === 0 ? 0 : Math.ceil(items.length / pageSize);
  const safePageIndex =
    pageCount === 0 ? 0 : Math.min(pageIndex, pageCount - 1);

  const pageItems = useMemo(() => {
    const start = safePageIndex * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSize, safePageIndex]);

  function setPageSize(size: PageSizeOption) {
    setPageSizeState(size);
    setPageIndex(0);
  }

  return {
    pageItems,
    pageIndex: safePageIndex,
    pageSize,
    pageCount,
    total: items.length,
    from: items.length === 0 ? 0 : safePageIndex * pageSize + 1,
    to: Math.min((safePageIndex + 1) * pageSize, items.length),
    canPreviousPage: safePageIndex > 0,
    canNextPage: pageCount > 0 && safePageIndex < pageCount - 1,
    setPageSize,
    setPageIndex,
  };
}

type TablePaginationProps = {
  pageIndex: number;
  pageCount: number;
  pageSize: PageSizeOption;
  total: number;
  from: number;
  to: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  setPageSize: (size: PageSizeOption) => void;
  setPageIndex: (index: number) => void;
};

export function TablePagination({
  pageIndex,
  pageCount,
  pageSize,
  total,
  from,
  to,
  canPreviousPage,
  canNextPage,
  setPageSize,
  setPageIndex,
}: TablePaginationProps) {
  const pageSizeId = useId();

  if (total === 0) return null;

  const pageSizeItems = PAGE_SIZE_OPTIONS.map((size) => ({
    label: String(size),
    value: String(size),
  }));

  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Label htmlFor={pageSizeId} className="text-sm font-normal">
          Mostrar
        </Label>
        <Select
          items={pageSizeItems}
          value={String(pageSize)}
          onValueChange={(value) => {
            if (!value) return;
            const next = Number(value) as PageSizeOption;
            if (PAGE_SIZE_OPTIONS.includes(next)) setPageSize(next);
          }}
        >
          <SelectTrigger
            id={pageSizeId}
            size="sm"
            className="h-11 w-[4.5rem] sm:h-8"
            aria-label="Filas por página"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>
          {from}–{to} de {total}
        </span>
      </div>

      <div className="grid w-full grid-cols-[auto_1fr_auto] items-center gap-2 sm:flex sm:w-auto">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 sm:h-8"
          disabled={!canPreviousPage}
          onClick={() => setPageIndex(pageIndex - 1)}
          aria-label="Página anterior"
        >
          <ChevronLeftIcon className="size-4" />
          Anterior
        </Button>
        <span className="min-w-0 text-center text-sm text-muted-foreground">
          Página {pageIndex + 1} de {pageCount}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-11 sm:h-8"
          disabled={!canNextPage}
          onClick={() => setPageIndex(pageIndex + 1)}
          aria-label="Página siguiente"
        >
          Siguiente
          <ChevronRightIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
