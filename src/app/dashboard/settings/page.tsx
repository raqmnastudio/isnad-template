import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { SchoolSettingsClient } from "@/components/settings/school-settings-client";

export interface SectionRow {
  id: string;
  code: string;
}

export interface GradeRow {
  id: string;
  grade_number: number;
  name: string;
  sections: SectionRow[];
}

export interface BreakRow {
  id: string;
  name: string;
  after_period: number;
}

export interface PeriodTimeRow {
  period_number: number;
  is_friday: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface StageRow {
  id: string;
  name: string;
  section_type: "numbers" | "letters";
  periods_per_day: number;
  friday_periods: number;
  working_days: string[];
  grades: GradeRow[];
  breaks: BreakRow[];
  periodTimes: PeriodTimeRow[];
}

export default async function SettingsPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  let stages: StageRow[] = [];

  if (schoolId) {
    const { data: stagesData } = await supabase
      .from("stages")
      .select("id, name, section_type, periods_per_day, friday_periods, working_days")
      .eq("school_id", schoolId)
      .order("created_at");

    const { data: gradesData } = await supabase
      .from("grades")
      .select("id, stage_id, grade_number, name")
      .eq("school_id", schoolId)
      .order("grade_number");

    const { data: sectionsData } = await supabase
      .from("sections")
      .select("id, grade_id, code")
      .eq("school_id", schoolId)
      .order("code");

    const { data: breaksData } = await supabase
      .from("breaks")
      .select("id, stage_id, name, after_period")
      .eq("school_id", schoolId)
      .order("after_period");

    const { data: periodTimesData } = await supabase
      .from("period_times")
      .select("stage_id, period_number, is_friday, start_time, end_time")
      .eq("school_id", schoolId);

    type StageDb = {
      id: string;
      name: string;
      section_type: "numbers" | "letters";
      periods_per_day: number;
      friday_periods: number;
      working_days: string[];
    };
    type GradeDb = { id: string; stage_id: string; grade_number: number; name: string };
    type SectionDb = { id: string; grade_id: string; code: string };
    type BreakDb = { id: string; stage_id: string; name: string; after_period: number };
    type PeriodTimeDb = {
      stage_id: string;
      period_number: number;
      is_friday: boolean;
      start_time: string | null;
      end_time: string | null;
    };

    stages = ((stagesData as StageDb[] | null) ?? []).map((stage) => ({
      ...stage,
      grades: ((gradesData as GradeDb[] | null) ?? [])
        .filter((g) => g.stage_id === stage.id)
        .map((g) => ({
          id: g.id,
          grade_number: g.grade_number,
          name: g.name,
          sections: ((sectionsData as SectionDb[] | null) ?? [])
            .filter((s) => s.grade_id === g.id)
            .map((s) => ({ id: s.id, code: s.code })),
        })),
      breaks: ((breaksData as BreakDb[] | null) ?? [])
        .filter((b) => b.stage_id === stage.id)
        .map((b) => ({ id: b.id, name: b.name, after_period: b.after_period })),
      periodTimes: ((periodTimesData as PeriodTimeDb[] | null) ?? [])
        .filter((pt) => pt.stage_id === stage.id)
        .map((pt) => ({
          period_number: pt.period_number,
          is_friday: pt.is_friday,
          start_time: pt.start_time,
          end_time: pt.end_time,
        })),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">معلومات المدرسة</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أضيفي الحلقات الدراسية، وعدد الصفوف والشعب لكل حلقة، وجدول الحصص
          والفسح اليومي.
        </p>
      </div>

      <SchoolSettingsClient stages={stages} />
    </div>
  );
}
