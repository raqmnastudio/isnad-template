"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";

const PATH = "/dashboard/teachers/substitutes";

export async function confirmSubstitute(params: {
  substituteTeacherId: string;
  absentTeacherId: string;
  recordDate: string;
  day: string;
  period: number;
  sectionId: string | null;
  subjectId: string | null;
}) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const supabase = await createClient();
  const { error } = await supabase.from("substitute_records").insert({
    school_id: schoolId,
    substitute_teacher_id: params.substituteTeacherId,
    absent_teacher_id: params.absentTeacherId,
    record_date: params.recordDate,
    day: params.day,
    period_number: params.period,
    section_id: params.sectionId,
    subject_id: params.subjectId,
  });

  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}

export async function deleteSubstituteRecord(recordId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("substitute_records").delete().eq("id", recordId);
  if (error) throw new Error(error.message);
  revalidatePath(PATH);
}
