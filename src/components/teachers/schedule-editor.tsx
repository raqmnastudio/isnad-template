"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubjectOption, SectionOption, TeacherRow, StageMeta } from "@/app/dashboard/teachers/page";
import { saveTeacherSchedule } from "@/app/dashboard/teachers/actions";

const DAY_ORDER = ["sun", "mon", "tue", "wed", "thu", "fri"];
const DAY_LABEL: Record<string, string> = {
  sun: "الأحد",
  mon: "الاثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
};

type CellKey = string; // `${day}-${period}`
interface CellValue {
  sectionId: string;
  subjectId: string;
}

export function ScheduleEditor({
  teacher,
  subjects,
  sections,
  stagesMeta,
}: {
  teacher: TeacherRow;
  subjects: SubjectOption[];
  sections: SectionOption[];
  stagesMeta: StageMeta[];
}) {
  const workingDays = useMemo(() => {
    const set = new Set<string>();
    stagesMeta.forEach((s) => s.working_days.forEach((d) => set.add(d)));
    if (set.size === 0) ["sun", "mon", "tue", "wed", "thu"].forEach((d) => set.add(d));
    return DAY_ORDER.filter((d) => set.has(d));
  }, [stagesMeta]);

  const periodsForDay = (day: string) => {
    if (stagesMeta.length === 0) return day === "fri" ? 0 : 7;
    if (day === "fri") {
      return Math.max(0, ...stagesMeta.map((s) => s.friday_periods));
    }
    return Math.max(1, ...stagesMeta.map((s) => s.periods_per_day));
  };

  const maxPeriods = Math.max(1, ...workingDays.map((d) => periodsForDay(d)));

  const [cells, setCells] = useState<Record<CellKey, CellValue>>(() => {
    const initial: Record<CellKey, CellValue> = {};
    teacher.schedule.forEach((c) => {
      initial[`${c.day}-${c.period}`] = {
        sectionId: c.sectionId,
        subjectId: c.subjectId ?? "",
      };
    });
    return initial;
  });

  const [saved, setSaved] = useState(false);

  function updateCell(day: string, period: number, patch: Partial<CellValue>) {
    const key = `${day}-${period}`;
    setCells((prev) => ({
      ...prev,
      [key]: {
        sectionId: prev[key]?.sectionId ?? "",
        subjectId: prev[key]?.subjectId ?? (subjects.length === 1 ? subjects[0].id : ""),
        ...patch,
      },
    }));
    setSaved(false);
  }

  const scheduleJson = JSON.stringify(
    Object.entries(cells)
      .filter(([, v]) => v.sectionId)
      .map(([key, v]) => {
        const [day, period] = key.split("-");
        return {
          day,
          period: Number(period),
          sectionId: v.sectionId,
          subjectId: v.subjectId,
        };
      })
  );

  if (sections.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        لا توجد شعب مضافة بعد — أضيفي الصفوف والشعب من صفحة معلومات المدرسة أولًا.
      </p>
    );
  }

  return (
    <form
      action={async (formData) => {
        await saveTeacherSchedule(teacher.id, formData);
        setSaved(true);
      }}
      className="flex flex-col gap-4"
    >
      <input type="hidden" name="scheduleJson" value={scheduleJson} />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="border border-border bg-muted/50 p-2 text-navy">الحصة</th>
              {workingDays.map((day) => (
                <th key={day} className="border border-border bg-muted/50 p-2 text-navy">
                  {DAY_LABEL[day]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxPeriods }, (_, i) => i + 1).map((period) => (
              <tr key={period}>
                <td className="border border-border p-2 text-center font-medium text-navy">
                  {period}
                </td>
                {workingDays.map((day) => {
                  const disabled = period > periodsForDay(day);
                  const value = cells[`${day}-${period}`];
                  return (
                    <td key={day} className="border border-border p-2">
                      {disabled ? (
                        <span className="block text-center text-xs text-muted-foreground">—</span>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <select
                            value={value?.sectionId ?? ""}
                            onChange={(e) =>
                              updateCell(day, period, { sectionId: e.target.value })
                            }
                            className="w-full rounded border border-input bg-white px-1 py-1 text-xs"
                          >
                            <option value="">—</option>
                            {sections.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                          {subjects.length > 1 && value?.sectionId && (
                            <select
                              value={value?.subjectId ?? ""}
                              onChange={(e) =>
                                updateCell(day, period, { subjectId: e.target.value })
                              }
                              className="w-full rounded border border-input bg-white px-1 py-1 text-xs"
                            >
                              <option value="">اختاري مادة</option>
                              {subjects.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm">
          حفظ الجدول
        </Button>
        {saved && <span className="text-xs text-secondary">تم الحفظ بنجاح</span>}
      </div>
    </form>
  );
}
