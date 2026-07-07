import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ClassesPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  type StageDb = { id: string; name: string };
  type GradeDb = { id: string; stage_id: string; name: string };
  type SectionDb = { id: string; grade_id: string; code: string };

  let stages: StageDb[] = [];
  let grades: GradeDb[] = [];
  let sections: SectionDb[] = [];

  if (schoolId) {
    const [stagesRes, gradesRes, sectionsRes] = await Promise.all([
      supabase.from("stages").select("id, name").eq("school_id", schoolId),
      supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
      supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
    ]);
    stages = (stagesRes.data as StageDb[] | null) ?? [];
    grades = (gradesRes.data as GradeDb[] | null) ?? [];
    sections = (sectionsRes.data as SectionDb[] | null) ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-navy">الصفوف والشعب</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            عرض للصفوف والشعب المضافة. لإضافة أو تعديل الحلقات والصفوف
            والشعب، استخدمي صفحة معلومات المدرسة.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/settings">الذهاب لمعلومات المدرسة</Link>
        </Button>
      </div>

      {stages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            لا توجد حلقات دراسية مضافة بعد.
          </CardContent>
        </Card>
      ) : (
        stages.map((stage) => {
          const stageGrades = grades.filter((g) => g.stage_id === stage.id);
          return (
            <Card key={stage.id}>
              <CardHeader>
                <CardTitle>{stage.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {stageGrades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    لا توجد صفوف مضافة في هذه الحلقة.
                  </p>
                ) : (
                  <div className="flex flex-col divide-y divide-border">
                    {stageGrades.map((grade) => (
                      <div key={grade.id} className="flex items-center justify-between py-3">
                        <p className="font-medium text-navy">{grade.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {sections
                            .filter((s) => s.grade_id === grade.id)
                            .map((s) => s.code)
                            .join("، ") || "—"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
