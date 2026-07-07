"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";

const DAY_LABELS: Record<string, string> = {
  sun: "الأحد",
  mon: "الاثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
  sat: "السبت",
};

export { DAY_LABELS };

function sectionCode(gradeNumber: number, index: number, type: "numbers" | "letters") {
  if (type === "letters") {
    const letter = String.fromCharCode("A".charCodeAt(0) + index);
    return `${gradeNumber}${letter}`;
  }
  return `${gradeNumber}-${index + 1}`;
}

export async function createStage(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const name = String(formData.get("name") ?? "").trim();
  const sectionType = String(formData.get("sectionType") ?? "letters") as
    | "numbers"
    | "letters";
  const periodsPerDay = Number(formData.get("periodsPerDay") ?? 7);
  const fridayPeriods = Number(formData.get("fridayPeriods") ?? 0);
  const workingDays = formData.getAll("workingDays").map(String);

  if (!name) throw new Error("اسم الحلقة مطلوب");

  const supabase = await createClient();
  const { error } = await supabase.from("stages").insert({
    school_id: schoolId,
    name,
    section_type: sectionType,
    periods_per_day: periodsPerDay,
    friday_periods: fridayPeriods,
    working_days: workingDays.length ? workingDays : ["sun", "mon", "tue", "wed", "thu"],
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function updateStage(stageId: string, formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const sectionType = String(formData.get("sectionType") ?? "letters");
  const periodsPerDay = Number(formData.get("periodsPerDay") ?? 7);
  const fridayPeriods = Number(formData.get("fridayPeriods") ?? 0);
  const workingDays = formData.getAll("workingDays").map(String);

  const { error } = await supabase
    .from("stages")
    .update({
      name,
      section_type: sectionType,
      periods_per_day: periodsPerDay,
      friday_periods: fridayPeriods,
      working_days: workingDays.length ? workingDays : ["sun", "mon", "tue", "wed", "thu"],
    })
    .eq("id", stageId);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function deleteStage(stageId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("stages").delete().eq("id", stageId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

/**
 * إضافة صف جديد داخل حلقة، مع إنشاء شعبه تلقائيًا حسب العدد المطلوب
 * ونوع الترميز المحدد في الحلقة (أرقام أو أحرف).
 */
export async function createGradeWithSections(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const stageId = String(formData.get("stageId") ?? "");
  const gradeNumber = Number(formData.get("gradeNumber") ?? 0);
  const gradeName = String(formData.get("gradeName") ?? "").trim();
  const sectionsCount = Number(formData.get("sectionsCount") ?? 1);

  if (!stageId || !gradeNumber || !gradeName || sectionsCount < 1) {
    throw new Error("يرجى تعبئة جميع بيانات الصف");
  }

  const supabase = await createClient();

  const { data: stage, error: stageError } = await supabase
    .from("stages")
    .select("section_type")
    .eq("id", stageId)
    .single();

  if (stageError || !stage) throw new Error("تعذّر العثور على الحلقة");

  const sectionType = (stage as unknown as { section_type: "numbers" | "letters" })
    .section_type;

  const { data: grade, error: gradeError } = await supabase
    .from("grades")
    .insert({
      stage_id: stageId,
      school_id: schoolId,
      grade_number: gradeNumber,
      name: gradeName,
    })
    .select()
    .single();

  if (gradeError || !grade) throw new Error(gradeError?.message ?? "تعذّر إنشاء الصف");

  const gradeId = (grade as unknown as { id: string }).id;

  const sectionsToInsert = Array.from({ length: sectionsCount }, (_, i) => ({
    grade_id: gradeId,
    school_id: schoolId,
    code: sectionCode(gradeNumber, i, sectionType),
  }));

  const { error: sectionsError } = await supabase.from("sections").insert(sectionsToInsert);
  if (sectionsError) throw new Error(sectionsError.message);

  revalidatePath("/dashboard/settings");
}

export async function deleteGrade(gradeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("grades").delete().eq("id", gradeId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function createBreak(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const stageId = String(formData.get("stageId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const afterPeriod = Number(formData.get("afterPeriod") ?? 0);

  if (!stageId || !name || !afterPeriod) {
    throw new Error("يرجى تعبئة بيانات الفسحة/البريك");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("breaks").insert({
    stage_id: stageId,
    school_id: schoolId,
    name,
    after_period: afterPeriod,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}

export async function deleteBreak(breakId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("breaks").delete().eq("id", breakId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/settings");
}
