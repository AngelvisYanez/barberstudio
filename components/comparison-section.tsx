"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { ComparisonPoint } from "@/actions/transactions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { formatMoney } from "@/lib/money";

const chartConfig = {
  income: {
    label: "Ingresos",
    color: "var(--chart-1)",
  },
  businessExpense: {
    label: "Gastos",
    color: "var(--chart-2)",
  },
  ownerDraw: {
    label: "Retiros",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type Props = {
  day: ComparisonPoint[];
  month: ComparisonPoint[];
  year: ComparisonPoint[];
};

function ComparisonChart({ data }: { data: ComparisonPoint[] }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[260px] w-full">
      <BarChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
        />
        <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="businessExpense"
          fill="var(--color-businessExpense)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="ownerDraw"
          fill="var(--color-ownerDraw)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  );
}

export function ComparisonSection({ day, month, year }: Props) {
  const [active, setActive] = useState("day");

  const views = {
    day: { label: "por día", data: day },
    month: { label: "por mes", data: month },
    year: { label: "por año", data: year },
  } as const;

  const current = views[active as keyof typeof views];
  const totals = current.data.reduce(
    (acc, point) => ({
      income: acc.income + point.income,
      businessExpense: acc.businessExpense + point.businessExpense,
      ownerDraw: acc.ownerDraw + point.ownerDraw,
    }),
    { income: 0, businessExpense: 0, ownerDraw: 0 },
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparación de movimientos</CardTitle>
        <CardDescription>
          Ingresos, gastos y retiros {current.label}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={active} onValueChange={setActive} className="gap-4">
          <TabsList>
            <TabsTrigger value="day">Días</TabsTrigger>
            <TabsTrigger value="month">Meses</TabsTrigger>
            <TabsTrigger value="year">Años</TabsTrigger>
          </TabsList>
          <TabsContent value="day">
            <ComparisonChart data={day} />
          </TabsContent>
          <TabsContent value="month">
            <ComparisonChart data={month} />
          </TabsContent>
          <TabsContent value="year">
            <ComparisonChart data={year} />
          </TabsContent>
        </Tabs>

        <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Ingresos</span>
            <span className="font-medium tabular-nums">
              {formatMoney(totals.income)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Gastos</span>
            <span className="font-medium tabular-nums">
              {formatMoney(totals.businessExpense)}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <span className="text-muted-foreground">Retiros</span>
            <span className="font-medium tabular-nums">
              {formatMoney(totals.ownerDraw)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
