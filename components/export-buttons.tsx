"use client";

import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  xlsxUrl: string;
  pdfUrl: string;
};

export function ExportButtons({ xlsxUrl, pdfUrl }: Props) {
  return (
    <div className="grid w-full grid-cols-2 gap-2 md:flex md:w-auto md:items-center">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        className="h-11 md:h-7"
        render={<a href={xlsxUrl} />}
      >
        <FileSpreadsheetIcon data-icon="inline-start" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        className="h-11 md:h-7"
        render={<a href={pdfUrl} />}
      >
        <FileTextIcon data-icon="inline-start" />
        PDF
      </Button>
    </div>
  );
}
