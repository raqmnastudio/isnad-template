import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const DAY_LABEL: Record<string, string> = {
  sun: "الأحد",
  mon: "الاثنين",
  tue: "الثلاثاء",
  wed: "الأربعاء",
  thu: "الخميس",
  fri: "الجمعة",
};

export default async function AssignmentsPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  interface Row {
    teacherName: string;
    subjectName: string;
    sectionLabel: string;
    day: string;
    period: number;
  }

  let rows: Row[] = [];

  if (schoolId) {
    const [teachersRes, subjectsRes, stagesRes, gradesRes, sectionsRes, scheduleRes] =
      await Promise.all([
        supabase.from("teachers").select("id, full_name").eq("school_id", schoolId),
        supabase.from("subjects").select("id, name").eq("school_id", schoolId),
        supabase.from("stages").select("id, name").eq("school_id", schoolId),
        supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
        supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
        supabase
          .from("teacher_schedule")
          .select("teacher_id, day, period_number, section_id, subject_id")
          .eq("school_id", schoolId),
      ]);

    type T = { id: string; full_name: string };
    type S = { id: string; name: string };
    type St = { id: string; name: string };
    type G = { id: string; stage_id: string; name: string };
    type Sec = { id: string; grade_id: string; code: string };
    type Sch = {
      teacher_id: string;
      day: string;
      period_number: number;
      section_id: string | null;
      subject_id: string | null;
    };

    const teachers = (teachersRes.data as T[] | null) ?? [];
    const subjects = (subjectsRes.data as S[] | null) ?? [];
    const stages = (stagesRes.data as St[] | null) ?? [];
    const grades = (gradesRes.data as G[] | null) ?? [];
    const sections = (sectionsRes.data as Sec[] | null) ?? [];
    const schedule = (scheduleRes.data as Sch[] | null) ?? [];

    rows = schedule
      .filter((s) => s.section_id)
      .map((s) => {
        const teacher = teachers.find((t) => t.id === s.teacher_id);
        const subject = subjects.find((sub) => sub.id === s.subject_id);
        const section = sections.find((sec) => sec.id === s.section_id);
        const grade = grades.find((g) => g.id === section?.grade_id);
        const stage = stages.find((st) => st.id === grade?.stage_id);
        return {
          teacherName: teacher?.full_name ?? "—",
          subjectName: subject?.name ?? "—",
          sectionLabel: `${stage?.name ?? ""} - ${grade?.name ?? ""} - ${section?.code ?? ""}`,
          day: s.day,
          period: s.period_number,
        };
      })
      .sort((a, b) => a.teacherName.localeCompare(b.teacherName, "ar"));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">التكليفات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه القائمة تُبنى تلقائيًا من الجدول الأسبوعي الذي أدخلتيه لكل
          معلمة في صفحة المعلمات — لا حاجة لإدخالها مرة أخرى.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>كل التكليفات ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              لا توجد تكليفات بعد — أضيفي جدول المعلمات الأسبوعي من صفحة
              المعلمات.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-start text-muted-foreground">
                    <th className="border-b border-border p-2 text-start">المعلمة</th>
                    <th className="border-b border-border p-2 text-start">المادة</th>
                    <th className="border-b border-border p-2 text-start">الشعبة</th>
                    <th className="border-b border-border p-2 text-start">اليوم</th>
                    <th className="border-b border-border p-2 text-start">الحصة</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="border-b border-border p-2 font-medium text-navy">
                        {row.teacherName}
                      </td>
                      <td className="border-b border-border p-2">{row.subjectName}</td>
                      <td className="border-b border-border p-2">{row.sectionLabel}</td>
                      <td className="border-b border-border p-2">{DAY_LABEL[row.day] ?? row.day}</td>
                      <td className="border-b border-border p-2">{row.period}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
