"use client";

import { useState, useTransition } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, CheckCircle2, AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TEACHERS_SHEET,
  SCHEDULE_SHEET,
  REFERENCE_SHEET,
  TEACHERS_HEADERS,
  SCHEDULE_HEADERS,
} from "@/lib/import-template";
import { importFromExcel, type ImportResult } from "@/app/dashboard/teachers/import/actions";

export function ImportClient({
  subjectNames,
  sectionLabels,
}: {
  subjectNames: string[];
  sectionLabels: string[];
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);

  function handleDownloadTemplate() {
    const wb = XLSX.utils.book_new();

    const teachersSheet = XLSX.utils.aoa_to_sheet([
      Object.values(TEACHERS_HEADERS),
      [
        "مثال: فاطمة أحمد",
        "Fatima Ahmed",
        subjectNames[0] ?? "لغتي",
        "24",
        "2",
        "أسبوعي",
        "1",
        "شهري",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, teachersSheet, TEACHERS_SHEET);

    const scheduleSheet = XLSX.utils.aoa_to_sheet([
      Object.values(SCHEDULE_HEADERS),
      ["فاطمة أحمد", "الأحد", "1", sectionLabels[0] ?? "", subjectNames[0] ?? ""],
    ]);
    XLSX.utils.book_append_sheet(wb, scheduleSheet, SCHEDULE_SHEET);

    const refRows = [
      ["أسماء المواد المتاحة", "أكواد الشعب المتاحة (انسخيها بالكامل لورقة الجدول)"],
      ...Array.from({ length: Math.max(subjectNames.length, sectionLabels.length) }, (_, i) => [
        subjectNames[i] ?? "",
        sectionLabels[i] ?? "",
      ]),
    ];
    const refSheet = XLSX.utils.aoa_to_sheet(refRows);
    XLSX.utils.book_append_sheet(wb, refSheet, REFERENCE_SHEET);

    XLSX.writeFile(wb, "قالب-استيراد-المعلمات.xlsx");
  }

  function handleImport() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    startTransition(async () => {
      const res = await importFromExcel(formData);
      setResult(res);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>الخطوة ١: تنزيل القالب</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            يحتوي القالب على ورقة للمعلمات، وورقة للجدول الأسبوعي، وورقة
            مرجعية بأسماء المواد وأكواد الشعب الصحيحة المسجّلة عندك حاليًا.
          </p>
          <div>
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" />
              تنزيل القالب
            </Button>
          </div>
          {(subjectNames.length === 0 || sectionLabels.length === 0) && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
              ملاحظة: ما زلتِ لم تُضيفي مواد و/أو صفوفًا وشعبًا بعد — أضيفيها
              أولًا من صفحتي المواد ومعلومات المدرسة حتى يظهروا في القالب.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>الخطوة ٢: رفع الملف بعد تعبئته</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <div>
            <Button onClick={handleImport} disabled={!file || isPending}>
              <Upload className="h-4 w-4" />
              {isPending ? "جارٍ الاستيراد..." : "استيراد"}
            </Button>
          </div>

          {result && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                تم استيراد {result.teachersImported} معلمة، و
                {result.scheduleRowsImported} خانة جدول بنجاح.
              </div>

              {result.errors.length > 0 && (
                <div className="rounded-md bg-amber-50 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    ملاحظات ({result.errors.length}) — لم تتأثر بقية البيانات
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-amber-700">
                    {result.errors.map((e, i) => (
                      <li key={i}>• {e}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
