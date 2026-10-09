"use client";

import { format } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PERIOD_PRESETS,
  detectPeriodPreset,
  parseDateParam,
  rangeForPeriod,
  type PeriodPreset,
} from "@/lib/date-range";

type Props = {
  defaultValue: { from: string; to: string };
};

export function DateRangeFilter({ defaultValue }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromDate = parseDateParam(defaultValue.from);
  const toDate = parseDateParam(defaultValue.to);
  const activePeriod =
    fromDate && toDate ? detectPeriodPreset(fromDate, toDate) : null;

  function pushRange(from: string, to: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyPeriod(period: PeriodPreset) {
    const range = rangeForPeriod(period);
    pushRange(
      format(range.from, "yyyy-MM-dd"),
      format(range.to, "yyyy-MM-dd"),
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
      <div className="flex max-w-full gap-1 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
        {PERIOD_PRESETS.map((period) => (
          <Button
            key={period.value}
            type="button"
            size="sm"
            variant={activePeriod === period.value ? "default" : "outline"}
            className="h-11 shrink-0 sm:h-9"
            onClick={() => applyPeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex">
        <Input
          key={`from-${defaultValue.from}`}
          type="date"
          aria-label="Desde"
          defaultValue={defaultValue.from}
          onChange={(event) => update("from", event.target.value)}
          className="h-11 w-full min-w-0 sm:h-9 sm:w-[9.25rem]"
        />
        <span className="text-sm text-muted-foreground" aria-hidden="true">
          —
        </span>
        <Input
          key={`to-${defaultValue.to}`}
          type="date"
          aria-label="Hasta"
          defaultValue={defaultValue.to}
          onChange={(event) => update("to", event.target.value)}
          className="h-11 w-full min-w-0 sm:h-9 sm:w-[9.25rem]"
        />
      </div>
    </div>
  );
}
