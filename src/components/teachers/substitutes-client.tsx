"use client";

import { useMemo, useState, useTransition } from "react";
import { UserCheck, UserX, CheckCircle2, Trash2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DAY_LABELS } from "@/lib/day-labels";
import type {
  SubTeacher,
  SubScheduleCell,
  SubSectionInfo,
  SubDutyAssignment,
  SubDutySubtype,
  SubPeriodTime,
  SubstituteRecord,
} from "@/app/dashboard/teachers/substitutes/page";
import {
  confirmSubstitute,
  deleteSubstituteRecord,
} from "@/app/dashboard/teachers/substitutes/actions";

const DAY_CODES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
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

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function dayCodeFromDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return DAY_CODES[d.getDay()];
}

function weekRange(iso: string) {
  const d = new Date(iso + "T00:00:00");
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

function monthRange(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const start = `${y}-${String(m).padStart(2, "0")}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const end = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

interface Props {
  teachers: SubTeacher[];
  schedule: SubScheduleCell[];
  sections: SubSectionInfo[];
  subjects: { id: string; name: string }[];
  dutyAssignments: SubDutyAssignment[];
  dutySubtypes: SubDutySubtype[];
  periodTimes: SubPeriodTime[];
  substituteRecords: SubstituteRecord[];
}

export function SubstitutesClient({
  teachers,
  schedule,
  sections,
  subjects,
  dutyAssignments,
  dutySubtypes,
  periodTimes,
  substituteRecords,
}: Props) {
  const [absentId, setAbsentId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [isPending, startTransition] = useTransition();
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);

  const day = date ? dayCodeFromDate(date) : "";

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

    const alreadySubForThisSlot = substituteRecords.some(
      (r) => r.substituteTeacherId === teacherId && r.recordDate === date && r.period === period
    );
    if (alreadySubForThisSlot) {
      return { busy: true, reason: "معتمدة احتياط لحصة أخرى بنفس الوقت اليوم" };
    }

    return { busy: false, reason: "" };
  }

  function usageCount(teacher: SubTeacher) {
    if (!teacher.substitute_limit) return null;
    const period = teacher.substitute_period ?? "weekly";
    const range = period === "monthly" ? monthRange(date) : weekRange(date);
    const count = substituteRecords.filter(
      (r) =>
        r.substituteTeacherId === teacher.id &&
        r.recordDate >= range.start &&
        r.recordDate <= range.end
    ).length;
    return { count, limit: teacher.substitute_limit, period };
  }

  function handleConfirm(
    substituteTeacherId: string,
    cell: { period: number; sectionId: string | null; subjectId: string | null }
  ) {
    const key = `${substituteTeacherId}-${cell.period}`;
    startTransition(async () => {
      await confirmSubstitute({
        substituteTeacherId,
        absentTeacherId: absentId,
        recordDate: date,
        day,
        period: cell.period,
        sectionId: cell.sectionId,
        subjectId: cell.subjectId,
      });
      setConfirmedKey(key);
    });
  }

  const dayRecords = substituteRecords
    .filter((r) => r.recordDate === date)
    .sort((a, b) => a.period - b.period);

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
            <Label>التاريخ</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            {date && (
              <p className="text-xs text-muted-foreground">اليوم: {DAY_LABELS[day] ?? day}</p>
            )}
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

                const alreadyAssigned = substituteRecords.find(
                  (r) =>
                    r.recordDate === date && r.period === cell.period && r.absentTeacherId === absentId
                );

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

                    {alreadyAssigned && (
                      <div className="mb-3 flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                        <CheckCircle2 className="h-4 w-4" />
                        تم اعتماد{" "}
                        {teachers.find((t) => t.id === alreadyAssigned.substituteTeacherId)
                          ?.full_name ?? "—"}{" "}
                        لهذي الحصة.
                      </div>
                    )}

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
                            {available.map((r) => {
                              const usage = usageCount(r.teacher);
                              const atLimit = usage ? usage.count >= usage.limit : false;
                              const key = `${r.teacher.id}-${cell.period}`;
                              return (
                                <div
                                  key={r.teacher.id}
                                  className="flex items-center justify-between gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm"
                                >
                                  <div>
                                    <span className="font-medium text-navy">
                                      {r.teacher.full_name}
                                    </span>
                                    {r.teacher.full_name_en && (
                                      <span dir="ltr" className="ms-1 text-xs text-muted-foreground">
                                        ({r.teacher.full_name_en})
                                      </span>
                                    )}
                                    {usage && (
                                      <span
                                        className={`block text-xs ${
                                          atLimit ? "text-destructive" : "text-muted-foreground"
                                        }`}
                                      >
                                        الاستخدام: {usage.count}/{usage.limit}{" "}
                                        {PERIOD_LABEL[usage.period]}
                                        {atLimit && " — بلغت الحد الأقصى"}
                                      </span>
                                    )}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isPending || Boolean(alreadyAssigned)}
                                    onClick={() =>
                                      handleConfirm(r.teacher.id, {
                                        period: cell.period,
                                        sectionId: cell.sectionId,
                                        subjectId: cell.subjectId,
                                      })
                                    }
                                  >
                                    {confirmedKey === key ? "تم" : "اعتماد"}
                                  </Button>
                                </div>
                              );
                            })}
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

      {dayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>سجل الاحتياط المعتمد ليوم {date}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col divide-y divide-border">
            {dayRecords.map((r) => {
              const substitute = teachers.find((t) => t.id === r.substituteTeacherId);
              const absent = teachers.find((t) => t.id === r.absentTeacherId);
              return (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <p>
                    <span className="font-medium text-navy">{substitute?.full_name}</span> غطّت
                    حصة <span className="font-medium text-navy">{absent?.full_name}</span> — الحصة{" "}
                    {r.period}
                  </p>
                  <form action={deleteSubstituteRecord.bind(null, r.id)}>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
