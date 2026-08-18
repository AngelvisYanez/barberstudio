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
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap items-center gap-1">
        {PERIOD_PRESETS.map((period) => (
          <Button
            key={period.value}
            type="button"
            size="sm"
            variant={activePeriod === period.value ? "default" : "outline"}
            className="h-9"
            onClick={() => applyPeriod(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </div>
      <Input
        key={`from-${defaultValue.from}`}
        type="date"
        aria-label="Desde"
        defaultValue={defaultValue.from}
        onChange={(event) => update("from", event.target.value)}
        className="h-9 w-fit"
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
        className="h-9 w-fit"
      />
    </div>
  );
}
