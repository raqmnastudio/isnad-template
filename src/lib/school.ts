import { createClient } from "@/lib/supabase/server";

/**
 * في هذه النسخة (نسخة مستقلة لكل مدرسة) يوجد صف واحد فقط في جدول
 * schools. مديرة المدرسة مرتبطة به عبر profile.school_id، أما مالكة
 * النظام فتُعامَل كأنها تدير هذه المدرسة الوحيدة أيضًا.
 */
export async function getCurrentSchoolId(): Promise<string | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("school_id")
    .eq("id", user.id)
    .single();

  const profileSchoolId = (profile as unknown as { school_id: string | null } | null)
    ?.school_id;

  if (profileSchoolId) return profileSchoolId;

  // مالكة النظام: نأخذ أول مدرسة موجودة (نسخة مستقلة = مدرسة واحدة)
  const { data: school } = await supabase.from("schools").select("id").limit(1).single();
  return (school as unknown as { id: string } | null)?.id ?? null;
}
