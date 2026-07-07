"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DAY_LABELS } from "@/lib/day-labels";
import type { CategoryRow, SubtypeRow, TeacherOption } from "@/app/dashboard/teachers/duties/page";
import {
  createDutyCategory,
  deleteDutyCategory,
  createDutySubtype,
  deleteDutySubtype,
  createDutyAssignment,
  deleteDutyAssignment,
} from "@/app/dashboard/teachers/duties/actions";

const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri"];

export function DutiesClient({
  categories,
  teachers,
  hasSchoolSetup,
}: {
  categories: CategoryRow[];
  teachers: TeacherOption[];
  hasSchoolSetup: boolean;
}) {
  const [showAddCategory, setShowAddCategory] = useState(false);

  if (!hasSchoolSetup) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          لم يتم إعداد المدرسة بعد.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAddCategory((v) => !v)}>
          <Plus className="h-4 w-4" />
          إضافة فئة أساسية
        </Button>
      </div>

      {showAddCategory && (
        <Card>
          <CardContent className="pt-6">
            <form
              action={async (formData) => {
                await createDutyCategory(formData);
                setShowAddCategory(false);
              }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <Input name="name" required placeholder="مثال: المناوبة الصباحية" className="flex-1" />
              <Input
                name="nameEn"
                dir="ltr"
                placeholder="Morning Duty (English, optional)"
                className="flex-1"
              />
              <Button type="submit">حفظ</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            لا توجد فئات مناوبات مضافة بعد.
          </CardContent>
        </Card>
      ) : (
        categories.map((cat) => (
          <CategoryCard key={cat.id} category={cat} teachers={teachers} />
        ))
      )}
    </div>
  );
}

function CategoryCard({
  category,
  teachers,
}: {
  category: CategoryRow;
  teachers: TeacherOption[];
}) {
  const [showAddSubtype, setShowAddSubtype] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{category.name}</CardTitle>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowAddSubtype((v) => !v)}>
            <Plus className="h-4 w-4" />
            إضافة نوع فرعي
          </Button>
          <form action={deleteDutyCategory.bind(null, category.id)}>
            <Button variant="ghost" size="icon" className="text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {showAddSubtype && (
          <form
            action={async (formData) => {
              formData.set("categoryId", category.id);
              await createDutySubtype(formData);
              setShowAddSubtype(false);
            }}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-3"
          >
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>اسم النوع الفرعي</Label>
              <Input name="name" required placeholder="مثال: الاستقبال الرئيسي" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>الاسم بالإنجليزي (اختياري)</Label>
              <Input name="nameEn" dir="ltr" placeholder="Main Reception" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>المكان (اختياري)</Label>
              <Input name="place" placeholder="مثال: الباب الرئيسي" />
            </div>
            <div className="flex flex-col gap-2 sm:col-span-3">
              <Label>المكان بالإنجليزي (اختياري)</Label>
              <Input name="placeEn" dir="ltr" placeholder="Main Gate" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>من الساعة</Label>
              <Input name="startTime" type="time" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>إلى الساعة</Label>
              <Input name="endTime" type="time" />
            </div>
            <div />
            <div className="flex flex-col gap-2">
              <Label>وقت الجمعة من (اختياري)</Label>
              <Input name="fridayStartTime" type="time" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>وقت الجمعة إلى (اختياري)</Label>
              <Input name="fridayEndTime" type="time" />
            </div>
            <div />
            <div className="sm:col-span-3">
              <Button type="submit" size="sm">
                حفظ النوع الفرعي
              </Button>
            </div>
          </form>
        )}

        {category.subtypes.length === 0 ? (
          <p className="text-sm text-muted-foreground">لا توجد أنواع فرعية بعد.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {category.subtypes.map((subtype) => (
              <SubtypeCard key={subtype.id} subtype={subtype} teachers={teachers} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SubtypeCard({
  subtype,
  teachers,
}: {
  subtype: SubtypeRow;
  teachers: TeacherOption[];
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-bold text-navy">
            {subtype.name}
            {subtype.name_en && (
              <span dir="ltr" className="ms-2 text-sm font-normal text-muted-foreground">
                ({subtype.name_en})
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            {subtype.place ? `${subtype.place} · ` : ""}
            {subtype.start_time && subtype.end_time
              ? `${subtype.start_time} - ${subtype.end_time}`
              : "بدون وقت محدد"}
            {subtype.friday_start_time && subtype.friday_end_time
              ? ` · الجمعة: ${subtype.friday_start_time} - ${subtype.friday_end_time}`
              : ""}
          </p>
        </div>
        <form action={deleteDutySubtype.bind(null, subtype.id)}>
          <Button variant="ghost" size="icon" className="text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {DAYS.map((day) => (
          <DayCell key={day} day={day} subtype={subtype} teachers={teachers} />
        ))}
      </div>
    </div>
  );
}

function DayCell({
  day,
  subtype,
  teachers,
}: {
  day: string;
  subtype: SubtypeRow;
  teachers: TeacherOption[];
}) {
  const [selected, setSelected] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const dayAssignments = subtype.assignments.filter((a) => a.day === day);
  const assignedTeacherIds = new Set(dayAssignments.map((a) => a.teacherId));
  const availableTeachers = teachers.filter((t) => !assignedTeacherIds.has(t.id));

  function handleAdd() {
    if (!selected) return;
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await createDutyAssignment(subtype.id, day, selected);
      if (result?.error) {
        setError(result.error);
      } else {
        setSelected("");
        if (result?.warning) setWarning(result.warning);
      }
    });
  }

  return (
    <div className="rounded-md border border-border bg-muted/30 p-2">
      <p className="mb-1.5 text-center text-xs font-bold text-navy">{DAY_LABELS[day]}</p>

      <div className="flex flex-col gap-1">
        {dayAssignments.map((a) => {
          const teacher = teachers.find((t) => t.id === a.teacherId);
          return (
            <span
              key={a.id}
              className="flex items-center justify-between gap-1 rounded bg-white px-1.5 py-1 text-xs"
            >
              {teacher?.full_name ?? "—"}
              {teacher?.full_name_en && (
                <span dir="ltr" className="text-muted-foreground">
                  ({teacher.full_name_en})
                </span>
              )}
              <form action={deleteDutyAssignment.bind(null, a.id)}>
                <button type="submit" className="text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </form>
            </span>
          );
        })}
      </div>

      {availableTeachers.length > 0 && (
        <div className="mt-1.5 flex flex-col gap-1">
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="w-full rounded border border-input bg-white px-1 py-1 text-xs"
          >
            <option value="">اختاري معلمة</option>
            {availableTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-xs"
            disabled={!selected || isPending}
            onClick={handleAdd}
          >
            إضافة
          </Button>
        </div>
      )}

      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}
      {warning && <p className="mt-1 text-[11px] text-amber-600">{warning}</p>}
    </div>
  );
}
