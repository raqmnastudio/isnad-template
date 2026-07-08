import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { SubstitutesClient } from "@/components/teachers/substitutes-client";
import { BackLink } from "@/components/layout/back-link";

export interface SubTeacher {
  id: string;
  full_name: string;
  full_name_en: string | null;
  substitute_limit: number | null;
  substitute_period: string | null;
}

export interface SubScheduleCell {
  teacherId: string;
  day: string;
  period: number;
  sectionId: string | null;
  subjectId: string | null;
}

export interface SubSectionInfo {
  id: string;
  label: string;
  stageId: string;
}

export interface SubDutyAssignment {
  teacherId: string;
  day: string;
  subtypeId: string;
}

export interface SubDutySubtype {
  id: string;
  name: string;
  start_time: string | null;
  end_time: string | null;
  friday_start_time: string | null;
  friday_end_time: string | null;
}

export interface SubPeriodTime {
  stageId: string;
  period: number;
  isFriday: boolean;
  start: string | null;
  end: string | null;
}

export interface SubstituteRecord {
  id: string;
  substituteTeacherId: string;
  absentTeacherId: string;
  recordDate: string;
  day: string;
  period: number;
  sectionId: string | null;
  subjectId: string | null;
}

export default async function SubstitutesPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let teachers: SubTeacher[] = [];
  let schedule: SubScheduleCell[] = [];
  let sections: SubSectionInfo[] = [];
  let subjects: { id: string; name: string }[] = [];
  let dutyAssignments: SubDutyAssignment[] = [];
  let dutySubtypes: SubDutySubtype[] = [];
  let periodTimes: SubPeriodTime[] = [];
  let substituteRecords: SubstituteRecord[] = [];

  if (schoolId) {
    const [
      teachersRes,
      scheduleRes,
      sectionsRes,
      gradesRes,
      stagesRes,
      subjectsRes,
      dutyAssignmentsRes,
      dutySubtypesRes,
      periodTimesRes,
      substituteRecordsRes,
    ] = await Promise.all([
      supabase
        .from("teachers")
        .select("id, full_name, full_name_en, substitute_limit, substitute_period")
        .eq("school_id", schoolId)
        .order("full_name"),
      supabase
        .from("teacher_schedule")
        .select("teacher_id, day, period_number, section_id, subject_id")
        .eq("school_id", schoolId),
      supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
      supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
      supabase.from("stages").select("id, name").eq("school_id", schoolId),
      supabase.from("subjects").select("id, name").eq("school_id", schoolId),
      supabase
        .from("duty_assignments")
        .select("teacher_id, day, subtype_id")
        .eq("school_id", schoolId),
      supabase
        .from("duty_subtypes")
        .select("id, name, start_time, end_time, friday_start_time, friday_end_time")
        .eq("school_id", schoolId),
      supabase
        .from("period_times")
        .select("stage_id, period_number, is_friday, start_time, end_time")
        .eq("school_id", schoolId),
      supabase
        .from("substitute_records")
        .select(
          "id, substitute_teacher_id, absent_teacher_id, record_date, day, period_number, section_id, subject_id"
        )
        .eq("school_id", schoolId),
    ]);

    type TeacherDb = SubTeacher;
    type ScheduleDb = {
      teacher_id: string;
      day: string;
      period_number: number;
      section_id: string | null;
      subject_id: string | null;
    };
    type SectionDb = { id: string; grade_id: string; code: string };
    type GradeDb = { id: string; stage_id: string; name: string };
    type StageDb = { id: string; name: string };

    teachers = (teachersRes.data as TeacherDb[] | null) ?? [];
    subjects = (subjectsRes.data as { id: string; name: string }[] | null) ?? [];

    const scheduleList = (scheduleRes.data as ScheduleDb[] | null) ?? [];
    schedule = scheduleList.map((s) => ({
      teacherId: s.teacher_id,
      day: s.day,
      period: s.period_number,
      sectionId: s.section_id,
      subjectId: s.subject_id,
    }));

    const sectionsList = (sectionsRes.data as SectionDb[] | null) ?? [];
    const gradesList = (gradesRes.data as GradeDb[] | null) ?? [];
    const stagesList = (stagesRes.data as StageDb[] | null) ?? [];

    sections = sectionsList.map((s) => {
      const grade = gradesList.find((g) => g.id === s.grade_id);
      const stage = stagesList.find((st) => st.id === grade?.stage_id);
      return {
        id: s.id,
        label: `${stage?.name ?? ""} - ${grade?.name ?? ""} - ${s.code}`,
        stageId: grade?.stage_id ?? "",
      };
    });

    dutyAssignments = (
      (dutyAssignmentsRes.data as
        | { teacher_id: string; day: string; subtype_id: string }[]
        | null) ?? []
    ).map((d) => ({ teacherId: d.teacher_id, day: d.day, subtypeId: d.subtype_id }));

    dutySubtypes = (dutySubtypesRes.data as SubDutySubtype[] | null) ?? [];

    periodTimes = (
      (periodTimesRes.data as
        | {
            stage_id: string;
            period_number: number;
            is_friday: boolean;
            start_time: string | null;
            end_time: string | null;
          }[]
        | null) ?? []
    ).map((p) => ({
      stageId: p.stage_id,
      period: p.period_number,
      isFriday: p.is_friday,
      start: p.start_time,
      end: p.end_time,
    }));

    substituteRecords = (
      (substituteRecordsRes.data as
        | {
            id: string;
            substitute_teacher_id: string;
            absent_teacher_id: string;
            record_date: string;
            day: string;
            period_number: number;
            section_id: string | null;
            subject_id: string | null;
          }[]
        | null) ?? []
    ).map((r) => ({
      id: r.id,
      substituteTeacherId: r.substitute_teacher_id,
      absentTeacherId: r.absent_teacher_id,
      recordDate: r.record_date,
      day: r.day,
      period: r.period_number,
      sectionId: r.section_id,
      subjectId: r.subject_id,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <BackLink href="/dashboard/teachers" label="رجوع إلى المعلمات" />
        <h1 className="text-2xl font-extrabold text-navy">الاحتياط</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          اختاري المعلمة الغائبة واليوم، وسيقترح النظام معلمات فاضيات في
          نفس أوقات حصصها بناءً على الجداول والمناوبات المُدخلة.
        </p>
      </div>

      <SubstitutesClient
        teachers={teachers}
        schedule={schedule}
        sections={sections}
        subjects={subjects}
        dutyAssignments={dutyAssignments}
        dutySubtypes={dutySubtypes}
        periodTimes={periodTimes}
        substituteRecords={substituteRecords}
      />
    </div>
  );
}
