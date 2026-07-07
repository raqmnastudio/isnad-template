"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StageRow } from "@/app/dashboard/settings/page";
import { DAY_LABELS } from "@/lib/day-labels";
import {
  createStage,
  createGradeWithSections,
  createBreak,
  deleteStage,
  deleteGrade,
  deleteBreak,
  savePeriodTimes,
} from "@/app/dashboard/settings/actions";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"];

export function SchoolSettingsClient({ stages }: { stages: StageRow[] }) {
  const [activeStageId, setActiveStageId] = useState<string | null>(
    stages[0]?.id ?? null
  );
  const [showAddStage, setShowAddStage] = useState(stages.length === 0);

  const activeStage = stages.find((s) => s.id === activeStageId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* تبويبات الحلقات */}
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((stage) => (
          <button
            key={stage.id}
            onClick={() => setActiveStageId(stage.id)}
            className={cn(
              "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
              activeStageId === stage.id
                ? "border-navy bg-navy text-white"
                : "border-border bg-white text-navy hover:bg-muted"
            )}
          >
            {stage.name}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddStage((v) => !v)}
        >
          <Plus className="h-4 w-4" />
          إضافة حلقة
        </Button>
      </div>

      {showAddStage && (
        <Card>
          <CardHeader>
            <CardTitle>حلقة دراسية جديدة</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              action={async (formData) => {
                await createStage(formData);
                setShowAddStage(false);
              }}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2"
            >
              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label htmlFor="stage-name">اسم الحلقة</Label>
                <Input
                  id="stage-name"
                  name="name"
                  required
                  placeholder="مثال: المرحلة الابتدائية"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>نوع ترميز الشعب</Label>
                <div className="flex gap-4 pt-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="sectionType" value="letters" defaultChecked />
                    أحرف (A, B, C)
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" name="sectionType" value="numbers" />
                    أرقام (1, 2, 3)
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="periodsPerDay">عدد الحصص (الاثنين - الخميس)</Label>
                <Input
                  id="periodsPerDay"
                  name="periodsPerDay"
                  type="number"
                  min={1}
                  defaultValue={7}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="fridayPeriods">عدد حصص يوم الجمعة</Label>
                <Input
                  id="fridayPeriods"
                  name="fridayPeriods"
                  type="number"
                  min={0}
                  defaultValue={0}
                />
              </div>

              <div className="flex flex-col gap-2 sm:col-span-2">
                <Label>أيام الدوام</Label>
                <div className="flex flex-wrap gap-3 pt-1">
                  {DAYS.map((day) => (
                    <label key={day} className="flex items-center gap-1.5 text-sm">
                      <input
                        type="checkbox"
                        name="workingDays"
                        value={day}
                        defaultChecked={day !== "sun"}
                      />
                      {DAY_LABELS[day]}
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <Button type="submit">حفظ الحلقة</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeStage && (
        <StageDetails key={activeStage.id} stage={activeStage} />
      )}
    </div>
  );
}

function StageDetails({ stage }: { stage: StageRow }) {
  const [showAddGrade, setShowAddGrade] = useState(false);
  const [showAddBreak, setShowAddBreak] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      {/* ملخص إعدادات الحلقة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>إعدادات {stage.name}</CardTitle>
          <form action={deleteStage.bind(null, stage.id)}>
            <Button variant="ghost" size="sm" className="text-destructive">
              <Trash2 className="h-4 w-4" />
              حذف الحلقة
            </Button>
          </form>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-muted-foreground">ترميز الشعب</p>
            <p className="font-bold text-navy">
              {stage.section_type === "letters" ? "أحرف" : "أرقام"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">حصص الأيام العادية</p>
            <p className="font-bold text-navy">{stage.periods_per_day}</p>
          </div>
          <div>
            <p className="text-muted-foreground">حصص الجمعة</p>
            <p className="font-bold text-navy">{stage.friday_periods}</p>
          </div>
          <div>
            <p className="text-muted-foreground">أيام الدوام</p>
            <p className="font-bold text-navy">
              {stage.working_days.map((d) => DAY_LABELS[d]).join("، ")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* الصفوف والشعب */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الصفوف والشعب</CardTitle>
          <Button size="sm" onClick={() => setShowAddGrade((v) => !v)}>
            <Plus className="h-4 w-4" />
            إضافة صف
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showAddGrade && (
            <form
              action={async (formData) => {
                formData.set("stageId", stage.id);
                await createGradeWithSections(formData);
                setShowAddGrade(false);
              }}
              className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-3"
            >
              <div className="flex flex-col gap-2">
                <Label>رقم الصف</Label>
                <Input name="gradeNumber" type="number" min={1} required />
              </div>
              <div className="flex flex-col gap-2">
                <Label>اسم الصف</Label>
                <Input name="gradeName" required placeholder="مثال: الصف الأول" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>عدد الشعب</Label>
                <Input name="sectionsCount" type="number" min={1} defaultValue={1} required />
              </div>
              <div className="sm:col-span-3">
                <Button type="submit" size="sm">
                  إضافة الصف وإنشاء الشعب تلقائيًا
                </Button>
              </div>
            </form>
          )}

          {stage.grades.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد صفوف مضافة بعد في هذه الحلقة.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {stage.grades.map((grade) => (
                <div
                  key={grade.id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="font-medium text-navy">{grade.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      الشعب:{" "}
                      {grade.sections.length > 0
                        ? grade.sections.map((s) => s.code).join("، ")
                        : "—"}
                    </p>
                  </div>
                  <form action={deleteGrade.bind(null, grade.id)}>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* الفسح / البريكات */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>الفسح والبريكات</CardTitle>
          <Button size="sm" onClick={() => setShowAddBreak((v) => !v)}>
            <Plus className="h-4 w-4" />
            إضافة فسحة
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showAddBreak && (
            <form
              action={async (formData) => {
                formData.set("stageId", stage.id);
                await createBreak(formData);
                setShowAddBreak(false);
              }}
              className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-3"
            >
              <div className="flex flex-col gap-2">
                <Label>اسم الفسحة</Label>
                <Input name="name" required placeholder="مثال: الفسحة الأولى" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>بعد الحصة رقم</Label>
                <Input
                  name="afterPeriod"
                  type="number"
                  min={1}
                  max={stage.periods_per_day}
                  required
                />
              </div>
              <div className="flex items-end sm:col-span-1">
                <Button type="submit" size="sm">
                  حفظ
                </Button>
              </div>
            </form>
          )}

          {stage.breaks.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد فسح مضافة بعد في هذه الحلقة.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {stage.breaks.map((brk) => (
                <div
                  key={brk.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <p className="text-sm text-navy">
                    <span className="font-medium">{brk.name}</span> — بعد الحصة{" "}
                    {brk.after_period}
                  </p>
                  <form action={deleteBreak.bind(null, brk.id)}>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* أوقات الحصص */}
      <PeriodTimesCard stage={stage} />
    </div>
  );
}

function PeriodTimesCard({ stage }: { stage: StageRow }) {
  function timeFor(period: number, isFriday: boolean) {
    return stage.periodTimes.find(
      (pt) => pt.period_number === period && pt.is_friday === isFriday
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>أوقات الحصص</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          حدّدي وقت بداية ونهاية كل حصة، ليتمكن النظام من تنبيهك إذا تعارضت
          مناوبة مع حصة تدريس فعلية لنفس المعلمة.
        </p>
        <form
          action={savePeriodTimes.bind(null, stage.id, stage.periods_per_day, stage.friday_periods)}
          className="flex flex-col gap-4"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-border bg-muted/50 p-2 text-navy">الحصة</th>
                  <th className="border border-border bg-muted/50 p-2 text-navy">من (عادي)</th>
                  <th className="border border-border bg-muted/50 p-2 text-navy">إلى (عادي)</th>
                  {stage.friday_periods > 0 && (
                    <>
                      <th className="border border-border bg-muted/50 p-2 text-navy">من (جمعة)</th>
                      <th className="border border-border bg-muted/50 p-2 text-navy">إلى (جمعة)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {Array.from(
                  { length: Math.max(stage.periods_per_day, stage.friday_periods) },
                  (_, i) => i + 1
                ).map((p) => (
                  <tr key={p}>
                    <td className="border border-border p-2 text-center font-medium text-navy">
                      {p}
                    </td>
                    {p <= stage.periods_per_day ? (
                      <>
                        <td className="border border-border p-1">
                          <input
                            type="time"
                            name={`period-${p}-start`}
                            defaultValue={timeFor(p, false)?.start_time ?? ""}
                            className="w-full rounded border border-input px-1 py-1 text-xs"
                          />
                        </td>
                        <td className="border border-border p-1">
                          <input
                            type="time"
                            name={`period-${p}-end`}
                            defaultValue={timeFor(p, false)?.end_time ?? ""}
                            className="w-full rounded border border-input px-1 py-1 text-xs"
                          />
                        </td>
                      </>
                    ) : (
                      stage.friday_periods > 0 && (
                        <td className="border border-border p-2" colSpan={2} />
                      )
                    )}
                    {stage.friday_periods > 0 &&
                      (p <= stage.friday_periods ? (
                        <>
                          <td className="border border-border p-1">
                            <input
                              type="time"
                              name={`period-${p}-fri-start`}
                              defaultValue={timeFor(p, true)?.start_time ?? ""}
                              className="w-full rounded border border-input px-1 py-1 text-xs"
                            />
                          </td>
                          <td className="border border-border p-1">
                            <input
                              type="time"
                              name={`period-${p}-fri-end`}
                              defaultValue={timeFor(p, true)?.end_time ?? ""}
                              className="w-full rounded border border-input px-1 py-1 text-xs"
                            />
                          </td>
                        </>
                      ) : (
                        <td className="border border-border p-2" colSpan={2} />
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <Button type="submit" size="sm">
              حفظ أوقات الحصص
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
