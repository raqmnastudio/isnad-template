import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { DutyRosterReport } from "@/components/reports/duty-roster-report";

export interface RosterRow {
  categoryName: string;
  categoryNameEn: string | null;
  subtypeName: string;
  subtypeNameEn: string | null;
  place: string | null;
  placeEn: string | null;
  timeLabel: string;
  fridayTimeLabel: string | null;
  teachersByDay: Record<string, { ar: string; en: string | null }[]>;
}

export default async function ReportsPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let rows: RosterRow[] = [];
  let schoolName = "";

  if (schoolId) {
    const [schoolRes, categoriesRes, subtypesRes, assignmentsRes, teachersRes] =
      await Promise.all([
        supabase.from("schools").select("name").eq("id", schoolId).single(),
        supabase.from("duty_categories").select("id, name, name_en").eq("school_id", schoolId),
        supabase
          .from("duty_subtypes")
          .select(
            "id, category_id, name, name_en, place, place_en, start_time, end_time, friday_start_time, friday_end_time"
          )
          .eq("school_id", schoolId),
        supabase
          .from("duty_assignments")
          .select("subtype_id, teacher_id, day")
          .eq("school_id", schoolId),
        supabase.from("teachers").select("id, full_name, full_name_en").eq("school_id", schoolId),
      ]);

    type CategoryDb = { id: string; name: string; name_en: string | null };
    type SubtypeDb = {
      id: string;
      category_id: string;
      name: string;
      name_en: string | null;
      place: string | null;
      place_en: string | null;
      start_time: string | null;
      end_time: string | null;
      friday_start_time: string | null;
      friday_end_time: string | null;
    };
    type AssignmentDb = { subtype_id: string; teacher_id: string; day: string };
    type TeacherDb = { id: string; full_name: string; full_name_en: string | null };

    schoolName = (schoolRes.data as { name: string } | null)?.name ?? "";
    const categories = (categoriesRes.data as CategoryDb[] | null) ?? [];
    const subtypes = (subtypesRes.data as SubtypeDb[] | null) ?? [];
    const assignments = (assignmentsRes.data as AssignmentDb[] | null) ?? [];
    const teachers = (teachersRes.data as TeacherDb[] | null) ?? [];

    rows = subtypes.map((s) => {
      const category = categories.find((c) => c.id === s.category_id);
      const teachersByDay: Record<string, { ar: string; en: string | null }[]> = {};
      assignments
        .filter((a) => a.subtype_id === s.id)
        .forEach((a) => {
          const teacher = teachers.find((t) => t.id === a.teacher_id);
          teachersByDay[a.day] = [
            ...(teachersByDay[a.day] ?? []),
            { ar: teacher?.full_name ?? "—", en: teacher?.full_name_en ?? null },
          ];
        });

      return {
        categoryName: category?.name ?? "",
        categoryNameEn: category?.name_en ?? null,
        subtypeName: s.name,
        subtypeNameEn: s.name_en,
        place: s.place,
        placeEn: s.place_en,
        timeLabel: s.start_time && s.end_time ? `${s.start_time} - ${s.end_time}` : "بدون وقت محدد",
        fridayTimeLabel:
          s.friday_start_time && s.friday_end_time
            ? `${s.friday_start_time} - ${s.friday_end_time}`
            : null,
        teachersByDay,
      };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">التقارير</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          جدول المناوبات الكامل، جاهز للطباعة أو التنزيل لتعميمه على المعلمات.
        </p>
      </div>

      <DutyRosterReport rows={rows} schoolName={schoolName} />
    </div>
  );
}
