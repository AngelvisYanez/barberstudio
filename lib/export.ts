import { format } from "date-fns";
import ExcelJS from "exceljs";
import { PDFDocument, PageSizes, StandardFonts, rgb } from "pdf-lib";

import { formatMoney } from "@/lib/money";

export type ExportCellValue = string | number | Date;

export type ExportColumn<T extends Record<string, ExportCellValue>> = {
  key: keyof T & string;
  header: string;
  format?: "text" | "money" | "date";
  width?: number;
};

function cellText(
  column: Pick<ExportColumn<Record<string, ExportCellValue>>, "format">,
  value: ExportCellValue,
): string {
  if (value instanceof Date) return format(value, "dd/MM/yyyy");
  if (column.format === "money" && typeof value === "number") {
    return formatMoney(value);
  }
  return String(value);
}

export async function buildExcelBuffer<T extends Record<string, ExportCellValue>>(
  sheetName: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Barber Studio";
  workbook.company = "Barber Studio";

  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.key,
    width: column.width ?? 18,
  }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 20;

  for (const row of rows) {
    const excelRow = sheet.addRow({ ...row });
    columns.forEach((column) => {
      const cell = excelRow.getCell(column.key);
      if (column.format === "money") {
        cell.numFmt = '"$"#,##0.00';
        cell.alignment = { horizontal: "right" };
      } else if (column.format === "date") {
        cell.numFmt = "dd/mm/yyyy";
      }
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export async function buildPdfBuffer<T extends Record<string, ExportCellValue>>(
  title: string,
  subtitle: string,
  columns: ExportColumn<T>[],
  rows: T[],
): Promise<Buffer> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const margin = 40;
  const pageWidth = PageSizes.A4[0];
  const pageHeight = PageSizes.A4[1];
  const usableWidth = pageWidth - margin * 2;

  const requestedWidths = columns.map((column) => column.width ?? 18);
  const totalRequested = requestedWidths.reduce((sum, width) => sum + width, 0);
  const colWidths = requestedWidths.map(
    (width) => (width / totalRequested) * usableWidth,
  );

  const headerBackground = rgb(0.12, 0.12, 0.12);
  const headerText = rgb(1, 1, 1);
  const bodyText = rgb(0.16, 0.16, 0.16);
  const mutedText = rgb(0.42, 0.42, 0.42);
  const borderColor = rgb(0.87, 0.87, 0.87);

  let page = pdf.addPage(PageSizes.A4);
  let y = pageHeight - margin;

  function drawPageHeader(currentPage: typeof page) {
    currentPage.drawText(title, {
      x: margin,
      y: pageHeight - margin,
      size: 16,
      font: fontBold,
      color: bodyText,
    });
    currentPage.drawText(subtitle, {
      x: margin,
      y: pageHeight - margin - 16,
      size: 10,
      font,
      color: mutedText,
    });
  }

  function drawTableHeader(currentPage: typeof page, currentY: number) {
    let x = margin;
    currentPage.drawRectangle({
      x,
      y: currentY - 6,
      width: usableWidth,
      height: 22,
      color: headerBackground,
    });
    columns.forEach((column, index) => {
      const alignRight = column.format === "money";
      const textWidth = fontBold.widthOfTextAtSize(column.header, 9);
      const drawX = alignRight
        ? x + colWidths[index] - textWidth - 6
        : x + 6;
      currentPage.drawText(column.header, {
        x: drawX,
        y: currentY,
        size: 9,
        font: fontBold,
        color: headerText,
      });
      x += colWidths[index];
    });
  }

  function clipText(
    text: string,
    maxWidth: number,
    size: number,
    textFont: typeof font,
  ): string {
    if (textFont.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let clipped = text;
    while (
      clipped.length > 0 &&
      textFont.widthOfTextAtSize(`${clipped}…`, size) > maxWidth
    ) {
      clipped = clipped.slice(0, -1);
    }
    return clipped.length > 0 ? `${clipped}…` : "";
  }

  drawPageHeader(page);
  y -= 44;
  drawTableHeader(page, y);
  y -= 16;

  if (rows.length === 0) {
    page.drawText("Sin registros para exportar.", {
      x: margin,
      y: y - 10,
      size: 10,
      font,
      color: mutedText,
    });
  } else {
    for (const row of rows) {
      if (y < margin + 20) {
        page = pdf.addPage(PageSizes.A4);
        y = pageHeight - margin;
        drawPageHeader(page);
        y -= 44;
        drawTableHeader(page, y);
        y -= 16;
      }

      let x = margin;
      page.drawLine({
        start: { x: margin, y },
        end: { x: margin + usableWidth, y },
        thickness: 0.5,
        color: borderColor,
      });

      columns.forEach((column, index) => {
        const text = clipText(
          cellText(column, row[column.key]),
          colWidths[index] - 12,
          8.5,
          font,
        );
        const alignRight = column.format === "money";
        const textWidth = font.widthOfTextAtSize(text, 8.5);
        const drawX = alignRight
          ? x + colWidths[index] - textWidth - 6
          : x + 6;
        page.drawText(text, {
          x: drawX,
          y,
          size: 8.5,
          font,
          color: bodyText,
        });
        x += colWidths[index];
      });

      y -= 20;
    }
  }

  const bytes = await pdf.save();
  return Buffer.from(bytes);
}
