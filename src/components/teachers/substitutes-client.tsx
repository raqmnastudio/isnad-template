"use client";

import { useMemo, useState } from "react";
import { UserCheck, UserX } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { DAY_LABELS } from "@/lib/day-labels";
import type {
  SubTeacher,
  SubScheduleCell,
  SubSectionInfo,
  SubDutyAssignment,
  SubDutySubtype,
  SubPeriodTime,
} from "@/app/dashboard/teachers/substitutes/page";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"];
const PERIOD_LABEL: Record<string, string> = { weekly: "أسبوعيًا", monthly: "شهريًا" };

function timesOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart < bEnd && bStart < aEnd;
}

interface Props {
  teachers: SubTeacher[];
  schedule: SubScheduleCell[];
  sections: SubSectionInfo[];
  subjects: { id: string; name: string }[];
  dutyAssignments: SubDutyAssignment[];
  dutySubtypes: SubDutySubtype[];
  periodTimes: SubPeriodTime[];
}

export function SubstitutesClient({
  teachers,
  schedule,
  sections,
  subjects,
  dutyAssignments,
  dutySubtypes,
  periodTimes,
}: Props) {
  const [absentId, setAbsentId] = useState("");
  const [day, setDay] = useState("");

  const absentPeriods = useMemo(() => {
    if (!absentId || !day) return [];
    return schedule
      .filter((s) => s.teacherId === absentId && s.day === day)
      .sort((a, b) => a.period - b.period);
  }, [absentId, day, schedule]);

  function getPeriodTime(sectionId: string | null, period: number) {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return null;
    const isFriday = day === "fri";
    return (
      periodTimes.find(
        (pt) => pt.stageId === section.stageId && pt.period === period && pt.isFriday === isFriday
      ) ?? null
    );
  }

  function getDutyTimeForDay(subtype: SubDutySubtype, d: string) {
    if (d === "fri" && (subtype.friday_start_time || subtype.friday_end_time)) {
      return { start: subtype.friday_start_time, end: subtype.friday_end_time };
    }
    return { start: subtype.start_time, end: subtype.end_time };
  }

  function isTeacherBusy(teacherId: string, period: number, periodTime: SubPeriodTime | null) {
    const busyTeaching = schedule.some(
      (s) => s.teacherId === teacherId && s.day === day && s.period === period
    );
    if (busyTeaching) return { busy: true, reason: "لديها حصة تدريس بنفس الوقت" };

    if (periodTime?.start && periodTime?.end) {
      const teacherDuties = dutyAssignments.filter(
        (d2) => d2.teacherId === teacherId && d2.day === day
      );
      for (const da of teacherDuties) {
        const subtype = dutySubtypes.find((st) => st.id === da.subtypeId);
        if (!subtype) continue;
        const dutyTime = getDutyTimeForDay(subtype, day);
        if (timesOverlap(periodTime.start, periodTime.end, dutyTime.start, dutyTime.end)) {
          return { busy: true, reason: `لديها مناوبة "${subtype.name}" بنفس الوقت` };
        }
      }
    }

    return { busy: false, reason: "" };
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>اختيار المعلمة الغائبة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label>المعلمة الغائبة</Label>
            <select
              value={absentId}
              onChange={(e) => setAbsentId(e.target.value)}
              className="h-11 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">اختاري معلمة</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <Label>اليوم</Label>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="h-11 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="">اختاري اليوم</option>
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {DAY_LABELS[d]}
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {absentId && day && (
        <Card>
          <CardHeader>
            <CardTitle>
              حصص {teachers.find((t) => t.id === absentId)?.full_name} يوم {DAY_LABELS[day]}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {absentPeriods.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                لا توجد حصص لهذي المعلمة في هذا اليوم حسب جدولها الأسبوعي.
              </p>
            ) : (
              absentPeriods.map((cell) => {
                const section = sections.find((s) => s.id === cell.sectionId);
                const subject = subjects.find((s) => s.id === cell.subjectId);
                const periodTime = getPeriodTime(cell.sectionId, cell.period);

                const results = teachers
                  .filter((t) => t.id !== absentId)
                  .map((t) => ({
                    teacher: t,
                    ...isTeacherBusy(t.id, cell.period, periodTime),
                  }));

                const available = results.filter((r) => !r.busy);
                const busy = results.filter((r) => r.busy);

                return (
                  <div key={cell.period} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="font-bold text-navy">
                        الحصة {cell.period} — {section?.label ?? "—"}
                        {subject && (
                          <span className="text-muted-foreground"> ({subject.name})</span>
                        )}
                      </p>
                      {periodTime?.start && periodTime?.end && (
                        <span className="text-xs text-muted-foreground">
                          {periodTime.start} - {periodTime.end}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                          <UserCheck className="h-4 w-4" />
                          متاحات ({available.length})
                        </p>
                        {available.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            لا توجد معلمة متاحة بهذا الوقت.
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1.5">
                            {available.map((r) => (
                              <div
                                key={r.teacher.id}
                                className="rounded-md bg-emerald-50 px-3 py-2 text-sm"
                              >
                                <span className="font-medium text-navy">
                                  {r.teacher.full_name}
                                </span>
                                {r.teacher.full_name_en && (
                                  <span dir="ltr" className="ms-1 text-xs text-muted-foreground">
                                    ({r.teacher.full_name_en})
                                  </span>
                                )}
                                {r.teacher.substitute_limit != null && (
                                  <span className="block text-xs text-muted-foreground">
                                    حدها الأقصى للاحتياط: {r.teacher.substitute_limit}{" "}
                                    {PERIOD_LABEL[r.teacher.substitute_period ?? "weekly"]}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-muted-foreground">
                          <UserX className="h-4 w-4" />
                          مشغولات ({busy.length})
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {busy.map((r) => (
                            <div
                              key={r.teacher.id}
                              className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground"
                            >
                              <span className="font-medium text-navy">{r.teacher.full_name}</span>
                              {" — "}
                              {r.reason}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
