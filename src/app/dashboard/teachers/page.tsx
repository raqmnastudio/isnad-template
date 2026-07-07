import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { TeachersClient } from "@/components/teachers/teachers-client";

export interface SubjectOption {
  id: string;
  name: string;
}

export interface DutyTypeOption {
  id: string;
  name: string;
}

export interface SectionOption {
  id: string;
  code: string;
  label: string; // "الابتدائية - الصف الأول - 1A"
}

export interface ScheduleCell {
  day: string;
  period: number;
  sectionId: string;
  subjectId: string | null;
}

export interface TeacherRow {
  id: string;
  full_name: string;
  full_name_en: string | null;
  weekly_quota: number;
  substitute_limit: number | null;
  substitute_period: string | null;
  duty_limit: number | null;
  duty_period: string | null;
  subjectIds: string[];
  dutyTypeIds: string[];
  schedule: ScheduleCell[];
}

export interface StageMeta {
  id: string;
  name: string;
  periods_per_day: number;
  friday_periods: number;
  working_days: string[];
}

export default async function TeachersPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let subjects: SubjectOption[] = [];
  let dutyTypes: DutyTypeOption[] = [];
  let sections: SectionOption[] = [];
  let teachers: TeacherRow[] = [];
  let stagesMeta: StageMeta[] = [];

  if (schoolId) {
    const [
      subjectsRes,
      dutyTypesRes,
      stagesRes,
      gradesRes,
      sectionsRes,
      teachersRes,
      teacherSubjectsRes,
      teacherDutiesRes,
      scheduleRes,
    ] = await Promise.all([
      supabase.from("subjects").select("id, name").eq("school_id", schoolId).order("name"),
      supabase
        .from("duty_types")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name"),
      supabase
        .from("stages")
        .select("id, name, periods_per_day, friday_periods, working_days")
        .eq("school_id", schoolId),
      supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
      supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
      supabase
        .from("teachers")
        .select(
          "id, full_name, full_name_en, weekly_quota, substitute_limit, substitute_period, duty_limit, duty_period"
        )
        .eq("school_id", schoolId)
        .order("full_name"),
      supabase
        .from("teacher_subjects")
        .select("teacher_id, subject_id")
        .eq("school_id", schoolId),
      supabase
        .from("teacher_duties")
        .select("teacher_id, duty_type_id")
        .eq("school_id", schoolId),
      supabase
        .from("teacher_schedule")
        .select("teacher_id, day, period_number, section_id, subject_id")
        .eq("school_id", schoolId),
    ]);

    type StageDb = {
      id: string;
      name: string;
      periods_per_day: number;
      friday_periods: number;
      working_days: string[];
    };
    type GradeDb = { id: string; stage_id: string; name: string };
    type SectionDb = { id: string; grade_id: string; code: string };
    type TeacherDb = {
      id: string;
      full_name: string;
      full_name_en: string | null;
      weekly_quota: number;
      substitute_limit: number | null;
      substitute_period: string | null;
      duty_limit: number | null;
      duty_period: string | null;
    };

    subjects = (subjectsRes.data as SubjectOption[] | null) ?? [];
    dutyTypes = (dutyTypesRes.data as DutyTypeOption[] | null) ?? [];
    stagesMeta = (stagesRes.data as StageDb[] | null) ?? [];

    const stagesList = stagesMeta;
    const gradesList = (gradesRes.data as GradeDb[] | null) ?? [];
    const sectionsList = (sectionsRes.data as SectionDb[] | null) ?? [];

    sections = sectionsList.map((s) => {
      const grade = gradesList.find((g) => g.id === s.grade_id);
      const stage = stagesList.find((st) => st.id === grade?.stage_id);
      return {
        id: s.id,
        code: s.code,
        label: `${stage?.name ?? ""} - ${grade?.name ?? ""} - ${s.code}`,
      };
    });

    const teachersList = (teachersRes.data as TeacherDb[] | null) ?? [];
    const teacherSubjectsList =
      (teacherSubjectsRes.data as { teacher_id: string; subject_id: string }[] | null) ?? [];
    const teacherDutiesList =
      (teacherDutiesRes.data as { teacher_id: string; duty_type_id: string }[] | null) ?? [];
    const scheduleList =
      (scheduleRes.data as
        | {
            teacher_id: string;
            day: string;
            period_number: number;
            section_id: string | null;
            subject_id: string | null;
          }[]
        | null) ?? [];

    teachers = teachersList.map((t) => ({
      id: t.id,
      full_name: t.full_name,
      full_name_en: t.full_name_en,
      weekly_quota: t.weekly_quota,
      substitute_limit: t.substitute_limit,
      substitute_period: t.substitute_period,
      duty_limit: t.duty_limit,
      duty_period: t.duty_period,
      subjectIds: teacherSubjectsList.filter((ts) => ts.teacher_id === t.id).map((ts) => ts.subject_id),
      dutyTypeIds: teacherDutiesList.filter((td) => td.teacher_id === t.id).map((td) => td.duty_type_id),
      schedule: scheduleList
        .filter((s) => s.teacher_id === t.id && s.section_id)
        .map((s) => ({
          day: s.day,
          period: s.period_number,
          sectionId: s.section_id as string,
          subjectId: s.subject_id,
        })),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">المعلمات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          إدارة بيانات المعلمات، المواد التي يدرّسنها، جدولهن الأسبوعي، وحدود
          الاحتياط والمناوبة.
        </p>
      </div>

      <TeachersClient
        subjects={subjects}
        dutyTypes={dutyTypes}
        sections={sections}
        teachers={teachers}
        stagesMeta={stagesMeta}
        hasSchoolSetup={Boolean(schoolId)}
      />
    </div>
  );
}
