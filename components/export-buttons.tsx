"use client";

import { FileSpreadsheetIcon, FileTextIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
  xlsxUrl: string;
  pdfUrl: string;
};

export function ExportButtons({ xlsxUrl, pdfUrl }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<a href={xlsxUrl} />}
      >
        <FileSpreadsheetIcon data-icon="inline-start" />
        Excel
      </Button>
      <Button
        variant="outline"
        size="sm"
        nativeButton={false}
        render={<a href={pdfUrl} />}
      >
        <FileTextIcon data-icon="inline-start" />
        PDF
      </Button>
    </div>
  );
}
