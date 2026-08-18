import {
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfYear,
} from "date-fns";
import { es } from "date-fns/locale";

export function parseDateParam(value: string | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  );
  return Number.isNaN(date.getTime()) ? null : date;
}

export type DateRangePreset = "today" | "month";

export type PeriodPreset = "day" | "month" | "quarter" | "year";

export const PERIOD_PRESETS: { value: PeriodPreset; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "month", label: "Mes" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Año" },
];

export function rangeForPeriod(
  period: PeriodPreset,
  now = new Date(),
): { from: Date; to: Date } {
  switch (period) {
    case "day":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "quarter":
      return { from: startOfQuarter(now), to: endOfQuarter(now) };
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
  }
}

export function detectPeriodPreset(
  from: Date,
  to: Date,
  now = new Date(),
): PeriodPreset | null {
  for (const { value } of PERIOD_PRESETS) {
    const range = rangeForPeriod(value, now);
    if (isSameDay(from, range.from) && isSameDay(to, range.to)) {
      return value;
    }
  }
  return null;
}

export function resolveDateRange(
  fromParam: string | undefined,
  toParam: string | undefined,
  preset: DateRangePreset = "today",
) {
  const now = new Date();
  const defaultFrom =
    preset === "month" ? startOfMonth(now) : startOfDay(now);
  const defaultTo = preset === "month" ? endOfMonth(now) : endOfDay(now);

  let fromDate = startOfDay(parseDateParam(fromParam) ?? defaultFrom);
  let toDate = endOfDay(parseDateParam(toParam) ?? defaultTo);

  if (fromDate > toDate) {
    const temp = fromDate;
    fromDate = startOfDay(toDate);
    toDate = endOfDay(temp);
  }

  const fromStr = format(fromDate, "yyyy-MM-dd");
  const toStr = format(toDate, "yyyy-MM-dd");
  const singleDay = isSameDay(fromDate, toDate);
  const isToday = singleDay && isSameDay(fromDate, now);
  const rangeLabel = singleDay
    ? format(fromDate, "EEEE d 'de' MMMM yyyy", { locale: es })
    : `${format(fromDate, "d 'de' MMMM", { locale: es })} — ${format(toDate, "d 'de' MMMM yyyy", { locale: es })}`;
  const period = isToday ? "de hoy" : singleDay ? "del día" : "del período";

  return {
    fromDate,
    toDate,
    fromStr,
    toStr,
    now,
    singleDay,
    isToday,
    rangeLabel,
    period,
  };
}
