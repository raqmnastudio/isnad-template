"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";

export async function createSubject(formData: FormData) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) throw new Error("تعذّر تحديد المدرسة");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("اسم المادة مطلوب");

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({ school_id: schoolId, name });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/subjects");
}

export async function deleteSubject(subjectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", subjectId);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard/subjects");
}
