import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { BackLink } from "@/components/layout/back-link";
import { ImportClient } from "@/components/teachers/import-client";

export default async function ImportPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let subjectNames: string[] = [];
  let sectionLabels: string[] = [];

  if (schoolId) {
    const [subjectsRes, sectionsRes, gradesRes, stagesRes] = await Promise.all([
      supabase.from("subjects").select("name").eq("school_id", schoolId),
      supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
      supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
      supabase.from("stages").select("id, name").eq("school_id", schoolId),
    ]);

    type SectionDb = { id: string; grade_id: string; code: string };
    type GradeDb = { id: string; stage_id: string; name: string };
    type StageDb = { id: string; name: string };

    subjectNames = ((subjectsRes.data as { name: string }[] | null) ?? []).map((s) => s.name);

    const sectionsList = (sectionsRes.data as SectionDb[] | null) ?? [];
    const gradesList = (gradesRes.data as GradeDb[] | null) ?? [];
    const stagesList = (stagesRes.data as StageDb[] | null) ?? [];

    sectionLabels = sectionsList.map((s) => {
      const grade = gradesList.find((g) => g.id === s.grade_id);
      const stage = stagesList.find((st) => st.id === grade?.stage_id);
      return `${stage?.name ?? ""} - ${grade?.name ?? ""} - ${s.code}`;
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/dashboard/teachers" label="رجوع إلى المعلمات" />
        <h1 className="text-2xl font-extrabold text-navy">استيراد من إكسل</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          نزّلي القالب، عبّئيه، ثم ارفعيه لإضافة المعلمات وجداولهن الأسبوعي
          دفعة واحدة.
        </p>
      </div>

      <ImportClient subjectNames={subjectNames} sectionLabels={sectionLabels} />
    </div>
  );
}
