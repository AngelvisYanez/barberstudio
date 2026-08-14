"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";

type Props = {
  defaultValue: { from: string; to: string };
};

export function DateRangeFilter({ defaultValue }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function update(key: "from" | "to", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
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
