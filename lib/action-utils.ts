import { z } from "zod";

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export function firstZodError(
  parsed: z.ZodSafeParseResult<unknown>,
): string {
  return parsed.success
    ? "Datos inválidos"
    : (parsed.error.issues[0]?.message ?? "Datos inválidos");
}

export function decimalToNumber(value: { toNumber?: () => number } | number): number {
  return typeof value === "number" ? value : Number(value);
}
