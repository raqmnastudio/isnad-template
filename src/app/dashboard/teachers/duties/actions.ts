"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";

const PATH = "/dashboard/teachers/duties";

// ---------------- الفئات الأساسية ----------------

export async function createDutyCategory(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const name = String(formData.get("name") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim() || null;
  if (!name) throw new Error("اسم الفئة مطلوب");

  const supabase = await createClient();
  const { error } = await supabase
    .from("duty_categories")
    .insert({ school_id: schoolId, name, name_en: nameEn });
  if (error) throw new Error(error.message);

  revalidatePath(PATH);
}

export async function deleteDutyCategory(categoryId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("duty_categories").delete().eq("id", categoryId);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

// ---------------- الأنواع الفرعية ----------------

export async function createDutySubtype(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const categoryId = String(formData.get("categoryId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const nameEn = String(formData.get("nameEn") ?? "").trim() || null;
  const place = String(formData.get("place") ?? "").trim() || null;
  const placeEn = String(formData.get("placeEn") ?? "").trim() || null;
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;
  const fridayStartTime = String(formData.get("fridayStartTime") ?? "").trim() || null;
  const fridayEndTime = String(formData.get("fridayEndTime") ?? "").trim() || null;

  if (!categoryId || !name) throw new Error("يرجى تعبئة اسم النوع الفرعي");

  const supabase = await createClient();
  const { error } = await supabase.from("duty_subtypes").insert({
    category_id: categoryId,
    school_id: schoolId,
    name,
    name_en: nameEn,
    place,
    place_en: placeEn,
    start_time: startTime,
    end_time: endTime,
    friday_start_time: fridayStartTime,
    friday_end_time: fridayEndTime,
  });
  if (error) throw new Error(error.message);

  revalidatePath(PATH);
}

export async function deleteDutySubtype(subtypeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("duty_subtypes").delete().eq("id", subtypeId);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

// ---------------- إسناد معلمة لنوع فرعي في يوم معيّن ----------------

interface AssignResult {
  error?: string;
  warning?: string;
}

function effectiveTime(
  day: string,
  subtype: {
    start_time: string | null;
    end_time: string | null;
    friday_start_time: string | null;
    friday_end_time: string | null;
  }
) {
  if (day === "fri" && (subtype.friday_start_time || subtype.friday_end_time)) {
    return { start: subtype.friday_start_time, end: subtype.friday_end_time };
  }
  return { start: subtype.start_time, end: subtype.end_time };
}

function timesOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null
) {
  if (!aStart || !aEnd || !bStart || !bEnd) return false; // بدون وقت محدد = لا يوجد تعارض وقتي
  return aStart < bEnd && bStart < aEnd;
}

export async function createDutyAssignment(
  subtypeId: string,
  day: string,
  teacherId: string
): Promise<AssignResult> {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) return { error: "تعذّر تحديد المدرسة" };

  const supabase = await createClient();

  const { data: subtype, error: subtypeError } = await supabase
    .from("duty_subtypes")
    .select("id, name, start_time, end_time, friday_start_time, friday_end_time")
    .eq("id", subtypeId)
    .single();

  if (subtypeError || !subtype) return { error: "تعذّر العثور على النوع الفرعي" };

  type SubtypeRow = {
    id: string;
    name: string;
    start_time: string | null;
    end_time: string | null;
    friday_start_time: string | null;
    friday_end_time: string | null;
  };
  const st = subtype as unknown as SubtypeRow;
  const target = effectiveTime(day, st);

  if (target.start && target.end) {
    // نجيب كل إسنادات هذي المعلمة بنفس اليوم عبر كل الأنواع الفرعية، ونتحقق من التعارض
    const { data: existing } = await supabase
      .from("duty_assignments")
      .select("id, subtype_id, duty_subtypes(name, start_time, end_time, friday_start_time, friday_end_time)")
      .eq("teacher_id", teacherId)
      .eq("day", day);

    type ExistingRow = {
      id: string;
      subtype_id: string;
      duty_subtypes: SubtypeRow | SubtypeRow[] | null;
    };

    for (const row of (existing as unknown as ExistingRow[] | null) ?? []) {
      const otherSubtypeRaw = Array.isArray(row.duty_subtypes)
        ? row.duty_subtypes[0]
        : row.duty_subtypes;
      if (!otherSubtypeRaw || row.subtype_id === subtypeId) continue;
      const otherTime = effectiveTime(day, otherSubtypeRaw);
      if (timesOverlap(target.start, target.end, otherTime.start, otherTime.end)) {
        return {
          error: `هذي المعلمة مسندة بالفعل لمناوبة "${otherSubtypeRaw.name}" بنفس اليوم وبوقت متعارض.`,
        };
      }
    }
  }

  const { error: insertError } = await supabase.from("duty_assignments").insert({
    subtype_id: subtypeId,
    school_id: schoolId,
    teacher_id: teacherId,
    day,
  });

  if (insertError) {
    return { error: "تعذّر إسناد المعلمة (ربما مُسندة مسبقًا لنفس المناوبة واليوم)." };
  }

  revalidatePath(PATH);
  revalidatePath("/dashboard/reports");

  // فحص تعارض مع حصص التدريس الفعلية (إنذار فقط، لا يمنع الإسناد)
  let warning: string | undefined;
  if (target.start && target.end) {
    const { data: scheduleRows } = await supabase
      .from("teacher_schedule")
      .select("day, period_number, section_id")
      .eq("teacher_id", teacherId)
      .eq("day", day);

    const sectionIds = ((scheduleRows as { section_id: string | null }[] | null) ?? [])
      .map((r) => r.section_id)
      .filter(Boolean) as string[];

    if (sectionIds.length > 0) {
      const { data: sectionsData } = await supabase
        .from("sections")
        .select("id, grade_id")
        .in("id", sectionIds);
      const gradeIds = ((sectionsData as { id: string; grade_id: string }[] | null) ?? []).map(
        (s) => s.grade_id
      );

      const { data: gradesData } = await supabase
        .from("grades")
        .select("id, stage_id")
        .in("id", gradeIds.length > 0 ? gradeIds : [""]);

      const { data: periodTimesData } = await supabase
        .from("period_times")
        .select("stage_id, period_number, is_friday, start_time, end_time")
        .eq("is_friday", day === "fri");

      type SectionRow2 = { id: string; grade_id: string };
      type GradeRow2 = { id: string; stage_id: string };
      type PeriodTimeRow = {
        stage_id: string;
        period_number: number;
        is_friday: boolean;
        start_time: string | null;
        end_time: string | null;
      };

      const sections2 = (sectionsData as SectionRow2[] | null) ?? [];
      const grades2 = (gradesData as GradeRow2[] | null) ?? [];
      const periodTimes2 = (periodTimesData as PeriodTimeRow[] | null) ?? [];

      for (const row of (scheduleRows as
        | { day: string; period_number: number; section_id: string | null }[]
        | null) ?? []) {
        if (!row.section_id) continue;
        const section = sections2.find((s) => s.id === row.section_id);
        const grade = grades2.find((g) => g.id === section?.grade_id);
        const pt = periodTimes2.find(
          (p) => p.stage_id === grade?.stage_id && p.period_number === row.period_number
        );
        if (pt?.start_time && pt?.end_time && timesOverlap(target.start, target.end, pt.start_time, pt.end_time)) {
          warning = `تنبيه: هذي المعلمة عندها حصة تدريس فعلية بنفس الوقت (الحصة ${row.period_number}).`;
          break;
        }
      }
    }
  }

  return warning ? { warning } : {};
}

export async function deleteDutyAssignment(assignmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("duty_assignments").delete().eq("id", assignmentId);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
  revalidatePath("/dashboard/reports");
}
