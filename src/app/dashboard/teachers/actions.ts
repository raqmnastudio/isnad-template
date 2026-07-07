"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";

// ---------------- أنواع المناوبات ----------------

export async function createDutyType(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("اسم المناوبة مطلوب");

  const supabase = await createClient();
  const { error } = await supabase.from("duty_types").insert({ school_id: schoolId, name });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/teachers");
}

export async function deleteDutyType(dutyTypeId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("duty_types").delete().eq("id", dutyTypeId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/teachers");
}

// ---------------- المعلمات ----------------

export async function createTeacher(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const weeklyQuota = formData.get("weeklyQuota");
  const subjectIds = formData.getAll("subjectIds").map(String);
  const dutyTypeIds = formData.getAll("dutyTypeIds").map(String);
  const substituteLimit = formData.get("substituteLimit");
  const substitutePeriod = formData.get("substitutePeriod");
  const dutyLimit = formData.get("dutyLimit");
  const dutyPeriod = formData.get("dutyPeriod");

  if (!fullName) throw new Error("اسم المعلمة مطلوب");

  const supabase = await createClient();

  const { data: teacher, error: teacherError } = await supabase
    .from("teachers")
    .insert({
      school_id: schoolId,
      full_name: fullName,
      weekly_quota: weeklyQuota ? Number(weeklyQuota) : 24,
      substitute_limit: substituteLimit ? Number(substituteLimit) : null,
      substitute_period: substitutePeriod ? String(substitutePeriod) : null,
      duty_limit: dutyLimit ? Number(dutyLimit) : null,
      duty_period: dutyPeriod ? String(dutyPeriod) : null,
    })
    .select()
    .single();

  if (teacherError || !teacher) {
    throw new Error(teacherError?.message ?? "تعذّر إنشاء المعلمة");
  }

  const teacherId = (teacher as unknown as { id: string }).id;

  if (subjectIds.length > 0) {
    const { error } = await supabase.from("teacher_subjects").insert(
      subjectIds.map((subjectId) => ({
        teacher_id: teacherId,
        subject_id: subjectId,
        school_id: schoolId,
      }))
    );
    if (error) throw new Error(error.message);
  }

  if (dutyTypeIds.length > 0) {
    const { error } = await supabase.from("teacher_duties").insert(
      dutyTypeIds.map((dutyTypeId) => ({
        teacher_id: teacherId,
        duty_type_id: dutyTypeId,
        school_id: schoolId,
      }))
    );
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard/teachers");
}

export async function deleteTeacher(teacherId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teachers").delete().eq("id", teacherId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/teachers");
}

/**
 * استبدال كامل للجدول الأسبوعي لمعلمة معيّنة دفعة واحدة: نحذف كل
 * خلاياها الحالية وندرج القيم الجديدة المُرسلة من النموذج.
 */
export async function saveTeacherSchedule(teacherId: string, formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const raw = String(formData.get("scheduleJson") ?? "[]");
  let cells: { day: string; period: number; sectionId: string; subjectId: string }[] = [];
  try {
    cells = JSON.parse(raw);
  } catch {
    throw new Error("تعذّرت قراءة بيانات الجدول");
  }

  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("teacher_schedule")
    .delete()
    .eq("teacher_id", teacherId);
  if (deleteError) throw new Error(deleteError.message);

  const rowsToInsert = cells
    .filter((c) => c.sectionId)
    .map((c) => ({
      teacher_id: teacherId,
      school_id: schoolId,
      day: c.day,
      period_number: c.period,
      section_id: c.sectionId,
      subject_id: c.subjectId || null,
    }));

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from("teacher_schedule")
      .insert(rowsToInsert);
    if (insertError) throw new Error(insertError.message);
  }

  revalidatePath("/dashboard/teachers");
}
