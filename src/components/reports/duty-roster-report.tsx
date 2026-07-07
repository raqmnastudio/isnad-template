"use client";

import { Printer, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_LABELS } from "@/lib/day-labels";
import type { RosterRow } from "@/app/dashboard/reports/page";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"];
const DAY_LABELS_EN: Record<string, string> = {
  sun: "Sun",
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
};

function bilingual(ar: string, en: string | null) {
  return en ? `${ar} / ${en}` : ar;
}

function teacherCell(entries: { ar: string; en: string | null }[]) {
  if (entries.length === 0) return "—";
  return entries.map((t) => bilingual(t.ar, t.en)).join("، ");
}

export function DutyRosterReport({
  rows,
  schoolName,
}: {
  rows: RosterRow[];
  schoolName: string;
}) {
  function buildTableHtml() {
    const headerCells = DAYS.map((d) => `<th>${DAY_LABELS[d]} / ${DAY_LABELS_EN[d]}</th>`).join("");
    const bodyRows = rows
      .map((row) => {
        const dayCells = DAYS.map(
          (d) => `<td>${teacherCell(row.teachersByDay[d] ?? [])}</td>`
        ).join("");
        return `<tr>
          <td>${bilingual(row.categoryName, row.categoryNameEn)}</td>
          <td>${bilingual(row.subtypeName, row.subtypeNameEn)}</td>
          <td>${row.place ? bilingual(row.place, row.placeEn) : "—"}</td>
          <td>${row.timeLabel}${row.fridayTimeLabel ? ` / Fri: ${row.fridayTimeLabel}` : ""}</td>
          ${dayCells}
        </tr>`;
      })
      .join("");

    return `
      <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8" />
          <title>جدول المناوبات / Duty Roster - ${schoolName}</title>
          <style>
            body { font-family: Tahoma, Arial, sans-serif; padding: 24px; }
            h1 { color: #17324D; font-size: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: center; }
            th { background: #17324D; color: #fff; }
            @media print {
              @page { size: landscape; }
            }
          </style>
        </head>
        <body>
          <h1>جدول المناوبات / Duty Roster — ${schoolName}</h1>
          <table>
            <thead>
              <tr>
                <th>الفئة / Category</th>
                <th>النوع الفرعي / Type</th>
                <th>المكان / Place</th>
                <th>الوقت / Time</th>
                ${headerCells}
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(buildTableHtml());
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  }

  function handleDownloadCsv() {
    const header = [
      "الفئة / Category",
      "النوع الفرعي / Type",
      "المكان / Place",
      "الوقت / Time",
      ...DAYS.map((d) => `${DAY_LABELS[d]} / ${DAY_LABELS_EN[d]}`),
    ];
    const lines = rows.map((row) => [
      bilingual(row.categoryName, row.categoryNameEn),
      bilingual(row.subtypeName, row.subtypeNameEn),
      row.place ? bilingual(row.place, row.placeEn) : "",
      row.timeLabel,
      ...DAYS.map((d) => teacherCell(row.teachersByDay[d] ?? [])),
    ]);

    const csv = [header, ...lines]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "duty-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>جدول المناوبات الكامل (عربي / English)</CardTitle>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleDownloadCsv} disabled={rows.length === 0}>
            <Download className="h-4 w-4" />
            تنزيل CSV
          </Button>
          <Button size="sm" onClick={handlePrint} disabled={rows.length === 0}>
            <Printer className="h-4 w-4" />
            طباعة
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            لا توجد مناوبات مضافة بعد — أضيفيها من صفحة &quot;إدارة المناوبات
            التفصيلية&quot; داخل المعلمات.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 p-2 text-navy">الفئة</th>
                  <th className="border border-border bg-muted/50 p-2 text-navy">النوع الفرعي</th>
                  <th className="border border-border bg-muted/50 p-2 text-navy">المكان</th>
                  <th className="border border-border bg-muted/50 p-2 text-navy">الوقت</th>
                  {DAYS.map((d) => (
                    <th key={d} className="border border-border bg-muted/50 p-2 text-navy">
                      {DAY_LABELS[d]}
                      <span className="block font-normal text-muted-foreground">
                        {DAY_LABELS_EN[d]}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="hover:bg-muted/40">
                    <td className="border border-border p-2">
                      {row.categoryName}
                      {row.categoryNameEn && (
                        <span dir="ltr" className="block text-muted-foreground">
                          {row.categoryNameEn}
                        </span>
                      )}
                    </td>
                    <td className="border border-border p-2 font-medium text-navy">
                      {row.subtypeName}
                      {row.subtypeNameEn && (
                        <span dir="ltr" className="block font-normal text-muted-foreground">
                          {row.subtypeNameEn}
                        </span>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {row.place ?? "—"}
                      {row.placeEn && (
                        <span dir="ltr" className="block text-muted-foreground">
                          {row.placeEn}
                        </span>
                      )}
                    </td>
                    <td className="border border-border p-2">
                      {row.timeLabel}
                      {row.fridayTimeLabel && (
                        <span className="block text-muted-foreground">
                          الجمعة: {row.fridayTimeLabel}
                        </span>
                      )}
                    </td>
                    {DAYS.map((d) => (
                      <td key={d} className="border border-border p-2">
                        {(row.teachersByDay[d] ?? []).map((t, idx) => (
                          <span key={idx} className="block">
                            {t.ar}
                            {t.en && (
                              <span dir="ltr" className="block text-[10px] text-muted-foreground">
                                {t.en}
                              </span>
                            )}
                          </span>
                        ))}
                        {(row.teachersByDay[d] ?? []).length === 0 && "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
