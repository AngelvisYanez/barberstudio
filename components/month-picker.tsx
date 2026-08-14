"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

export function MonthPicker({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("month", value);
    } else {
      params.delete("month");
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Input
      key={defaultValue}
      type="month"
      aria-label="Seleccionar mes"
      defaultValue={defaultValue}
      onChange={handleChange}
      className="h-9 w-fit"
    />
  );
}
