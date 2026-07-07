"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  SubjectOption,
  DutyTypeOption,
  SectionOption,
  TeacherRow,
  StageMeta,
} from "@/app/dashboard/teachers/page";
import {
  createDutyType,
  deleteDutyType,
  createTeacher,
  deleteTeacher,
} from "@/app/dashboard/teachers/actions";
import { ScheduleEditor } from "@/components/teachers/schedule-editor";

const PERIOD_LABEL: Record<string, string> = { weekly: "أسبوعيًا", monthly: "شهريًا" };

export function TeachersClient({
  subjects,
  dutyTypes,
  sections,
  teachers,
  stagesMeta,
  hasSchoolSetup,
}: {
  subjects: SubjectOption[];
  dutyTypes: DutyTypeOption[];
  sections: SectionOption[];
  teachers: TeacherRow[];
  stagesMeta: StageMeta[];
  hasSchoolSetup: boolean;
}) {
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [openScheduleId, setOpenScheduleId] = useState<string | null>(null);

  if (!hasSchoolSetup) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          لم يتم إعداد المدرسة بعد. أكملي صفحة الإعداد الأولي أولًا.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* أنواع المناوبات */}
      <DutyTypesManager dutyTypes={dutyTypes} />

      {/* إضافة معلمة */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>المعلمات ({teachers.length})</CardTitle>
          <Button size="sm" onClick={() => setShowAddTeacher((v) => !v)}>
            <Plus className="h-4 w-4" />
            إضافة معلمة
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {showAddTeacher && (
            <AddTeacherForm
              subjects={subjects}
              dutyTypes={dutyTypes}
              onDone={() => setShowAddTeacher(false)}
            />
          )}

          {teachers.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد معلمات مضافات بعد.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {teachers.map((teacher) => (
                <TeacherCard
                  key={teacher.id}
                  teacher={teacher}
                  subjects={subjects}
                  dutyTypes={dutyTypes}
                  sections={sections}
                  stagesMeta={stagesMeta}
                  isOpen={openScheduleId === teacher.id}
                  onToggle={() =>
                    setOpenScheduleId(openScheduleId === teacher.id ? null : teacher.id)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DutyTypesManager({ dutyTypes }: { dutyTypes: DutyTypeOption[] }) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>أنواع المناوبات</CardTitle>
        <Button size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-4 w-4" />
          إضافة نوع
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showAdd && (
          <form
            action={async (formData) => {
              await createDutyType(formData);
              setShowAdd(false);
            }}
            className="flex gap-3"
          >
            <Input name="name" required placeholder="مثال: مناوبة الطابور" className="flex-1" />
            <Button type="submit" size="sm">
              حفظ
            </Button>
          </form>
        )}

        {dutyTypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أنواع مناوبات مضافة بعد.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dutyTypes.map((dt) => (
              <span
                key={dt.id}
                className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm"
              >
                {dt.name}
                <form action={deleteDutyType.bind(null, dt.id)}>
                  <button type="submit" className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddTeacherForm({
  subjects,
  dutyTypes,
  onDone,
}: {
  subjects: SubjectOption[];
  dutyTypes: DutyTypeOption[];
  onDone: () => void;
}) {
  return (
    <form
      action={async (formData) => {
        await createTeacher(formData);
        onDone();
      }}
      className="flex flex-col gap-4 rounded-lg border border-border bg-muted/40 p-4"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">اسم المعلمة</Label>
        <Input id="fullName" name="fullName" required />
      </div>

      <div className="flex flex-col gap-2 sm:w-56">
        <Label htmlFor="weeklyQuota">النصاب الأسبوعي المستهدف (عدد الحصص)</Label>
        <Input id="weeklyQuota" name="weeklyQuota" type="number" min={0} defaultValue={24} />
      </div>

      <div className="flex flex-col gap-2">
        <Label>المواد التي تدرّسها</Label>
        {subjects.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            لا توجد مواد بعد — أضيفيها أولًا من صفحة &quot;المواد&quot;.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {subjects.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="subjectIds" value={s.id} />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="substituteLimit">الحد الأقصى للاحتياط</Label>
          <div className="flex gap-2">
            <Input
              id="substituteLimit"
              name="substituteLimit"
              type="number"
              min={0}
              className="w-24"
            />
            <select
              name="substitutePeriod"
              defaultValue="weekly"
              className="h-11 flex-1 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="weekly">أسبوعيًا</option>
              <option value="monthly">شهريًا</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="dutyLimit">الحد الأقصى للمناوبة</Label>
          <div className="flex gap-2">
            <Input id="dutyLimit" name="dutyLimit" type="number" min={0} className="w-24" />
            <select
              name="dutyPeriod"
              defaultValue="weekly"
              className="h-11 flex-1 rounded-md border border-input bg-white px-3 text-sm"
            >
              <option value="weekly">أسبوعيًا</option>
              <option value="monthly">شهريًا</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>أنواع المناوبات المسندة لها</Label>
        {dutyTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground">لا توجد أنواع مناوبات مضافة بعد.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {dutyTypes.map((dt) => (
              <label key={dt.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="dutyTypeIds" value={dt.id} />
                {dt.name}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <Button type="submit">حفظ المعلمة</Button>
      </div>
    </form>
  );
}

function TeacherCard({
  teacher,
  subjects,
  dutyTypes,
  sections,
  stagesMeta,
  isOpen,
  onToggle,
}: {
  teacher: TeacherRow;
  subjects: SubjectOption[];
  dutyTypes: DutyTypeOption[];
  sections: SectionOption[];
  stagesMeta: StageMeta[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  const teacherSubjects = subjects.filter((s) => teacher.subjectIds.includes(s.id));
  const teacherDuties = dutyTypes.filter((d) => teacher.dutyTypeIds.includes(d.id));

  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <p className="font-bold text-navy">{teacher.full_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            المواد: {teacherSubjects.map((s) => s.name).join("، ") || "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            النصاب الأسبوعي المستهدف: {teacher.weekly_quota} حصة · الفعلي:{" "}
            {teacher.schedule.length} حصة
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            الاحتياط:{" "}
            {teacher.substitute_limit != null
              ? `${teacher.substitute_limit} ${PERIOD_LABEL[teacher.substitute_period ?? "weekly"]}`
              : "—"}
            {" · "}
            المناوبة:{" "}
            {teacher.duty_limit != null
              ? `${teacher.duty_limit} ${PERIOD_LABEL[teacher.duty_period ?? "weekly"]}`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            أنواع المناوبة: {teacherDuties.map((d) => d.name).join("، ") || "—"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onToggle}>
            الجدول الأسبوعي
            {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <form action={deleteTeacher.bind(null, teacher.id)}>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>

      {isOpen && (
        <div className="border-t border-border p-4">
          <ScheduleEditor
            teacher={teacher}
            subjects={teacherSubjects}
            sections={sections}
            stagesMeta={stagesMeta}
          />
        </div>
      )}
    </div>
  );
}
