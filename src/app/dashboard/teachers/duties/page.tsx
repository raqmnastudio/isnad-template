import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { DutiesClient } from "@/components/duties/duties-client";

export interface TeacherOption {
  id: string;
  full_name: string;
  full_name_en: string | null;
}

export interface AssignmentRow {
  id: string;
  day: string;
  teacherId: string;
}

export interface SubtypeRow {
  id: string;
  name: string;
  name_en: string | null;
  place: string | null;
  place_en: string | null;
  start_time: string | null;
  end_time: string | null;
  friday_start_time: string | null;
  friday_end_time: string | null;
  assignments: AssignmentRow[];
}

export interface CategoryRow {
  id: string;
  name: string;
  name_en: string | null;
  subtypes: SubtypeRow[];
}

export default async function DutiesPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let categories: CategoryRow[] = [];
  let teachers: TeacherOption[] = [];

  if (schoolId) {
    const [categoriesRes, subtypesRes, assignmentsRes, teachersRes] = await Promise.all([
      supabase.from("duty_categories").select("id, name, name_en").eq("school_id", schoolId),
      supabase
        .from("duty_subtypes")
        .select(
          "id, category_id, name, name_en, place, place_en, start_time, end_time, friday_start_time, friday_end_time"
        )
        .eq("school_id", schoolId),
      supabase
        .from("duty_assignments")
        .select("id, subtype_id, teacher_id, day")
        .eq("school_id", schoolId),
      supabase
        .from("teachers")
        .select("id, full_name, full_name_en")
        .eq("school_id", schoolId)
        .order("full_name"),
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
    type AssignmentDb = { id: string; subtype_id: string; teacher_id: string; day: string };

    const categoriesList = (categoriesRes.data as CategoryDb[] | null) ?? [];
    const subtypesList = (subtypesRes.data as SubtypeDb[] | null) ?? [];
    const assignmentsList = (assignmentsRes.data as AssignmentDb[] | null) ?? [];
    teachers = (teachersRes.data as TeacherOption[] | null) ?? [];

    categories = categoriesList.map((cat) => ({
      id: cat.id,
      name: cat.name,
      name_en: cat.name_en,
      subtypes: subtypesList
        .filter((s) => s.category_id === cat.id)
        .map((s) => ({
          id: s.id,
          name: s.name,
          name_en: s.name_en,
          place: s.place,
          place_en: s.place_en,
          start_time: s.start_time,
          end_time: s.end_time,
          friday_start_time: s.friday_start_time,
          friday_end_time: s.friday_end_time,
          assignments: assignmentsList
            .filter((a) => a.subtype_id === s.id)
            .map((a) => ({ id: a.id, day: a.day, teacherId: a.teacher_id })),
        })),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">إدارة المناوبات التفصيلية</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أضيفي الفئات الأساسية، وتحتها الأنواع الفرعية بوقتها ومكانها، ثم
          أسندي معلمة لكل يوم. يمنع النظام إسناد معلمة لمناوبتين بنفس الوقت.
        </p>
      </div>

      <DutiesClient categories={categories} teachers={teachers} hasSchoolSetup={Boolean(schoolId)} />
    </div>
  );
}
