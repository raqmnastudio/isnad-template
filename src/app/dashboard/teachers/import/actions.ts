"use server";

import * as XLSX from "xlsx";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import {
  TEACHERS_SHEET,
  SCHEDULE_SHEET,
  TEACHERS_HEADERS,
  SCHEDULE_HEADERS,
  DAY_NAME_TO_CODE,
} from "@/lib/import-template";

export interface ImportResult {
  success: boolean;
  teachersImported: number;
  scheduleRowsImported: number;
  errors: string[];
}

function normalizePeriod(value: string): "weekly" | "monthly" {
  return String(value).trim() === "شهري" ? "monthly" : "weekly";
}

export async function importFromExcel(formData: FormData): Promise<ImportResult> {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    return { success: false, teachersImported: 0, scheduleRowsImported: 0, errors: ["تعذّر تحديد المدرسة"] };
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return { success: false, teachersImported: 0, scheduleRowsImported: 0, errors: ["لم يتم اختيار ملف"] };
  }

  const errors: string[] = [];
  const supabase = await createClient();

  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return {
      success: false,
      teachersImported: 0,
      scheduleRowsImported: 0,
      errors: ["تعذّرت قراءة الملف. تأكدي أنه بصيغة xlsx صحيحة."],
    };
  }

  const teachersSheet = workbook.Sheets[TEACHERS_SHEET];
  const scheduleSheet = workbook.Sheets[SCHEDULE_SHEET];

  if (!teachersSheet) {
    return {
      success: false,
      teachersImported: 0,
      scheduleRowsImported: 0,
      errors: [`لم يتم العثور على ورقة "${TEACHERS_SHEET}" في الملف.`],
    };
  }

  // جلب المواد والشعب والمعلمات الحالية للمدرسة لمطابقة الأسماء/الأكواد
  const [subjectsRes, sectionsRes, gradesRes, stagesRes, existingTeachersRes] = await Promise.all([
    supabase.from("subjects").select("id, name").eq("school_id", schoolId),
    supabase.from("sections").select("id, grade_id, code").eq("school_id", schoolId),
    supabase.from("grades").select("id, stage_id, name").eq("school_id", schoolId),
    supabase.from("stages").select("id, name").eq("school_id", schoolId),
    supabase.from("teachers").select("id, full_name").eq("school_id", schoolId),
  ]);

  type SubjectDb = { id: string; name: string };
  type SectionDb = { id: string; grade_id: string; code: string };
  type GradeDb = { id: string; stage_id: string; name: string };
  type StageDb = { id: string; name: string };
  type TeacherExistingDb = { id: string; full_name: string };

  const subjectsList = (subjectsRes.data as SubjectDb[] | null) ?? [];
  const sectionsList = (sectionsRes.data as SectionDb[] | null) ?? [];
  const gradesList = (gradesRes.data as GradeDb[] | null) ?? [];
  const stagesList = (stagesRes.data as StageDb[] | null) ?? [];
  const existingTeachers = (existingTeachersRes.data as TeacherExistingDb[] | null) ?? [];

  const sectionsWithLabel = sectionsList.map((s) => {
    const grade = gradesList.find((g) => g.id === s.grade_id);
    const stage = stagesList.find((st) => st.id === grade?.stage_id);
    return { id: s.id, label: `${stage?.name ?? ""} - ${grade?.name ?? ""} - ${s.code}` };
  });

  const teacherNameToId = new Map<string, string>(
    existingTeachers.map((t) => [t.full_name.trim(), t.id])
  );

  // ---------------- معالجة ورقة المعلمات ----------------
  const teacherRows = XLSX.utils.sheet_to_json<Record<string, string>>(teachersSheet, {
    defval: "",
  });

  let teachersImported = 0;

  for (let i = 0; i < teacherRows.length; i++) {
    const row = teacherRows[i];
    const rowNum = i + 2; // مراعاة صف العنوان
    const name = String(row[TEACHERS_HEADERS.name] ?? "").trim();
    if (!name) continue;

    const nameEn = String(row[TEACHERS_HEADERS.nameEn] ?? "").trim() || null;
    const weeklyQuota = Number(row[TEACHERS_HEADERS.weeklyQuota]) || 24;
    const substituteLimitRaw = String(row[TEACHERS_HEADERS.substituteLimit] ?? "").trim();
    const dutyLimitRaw = String(row[TEACHERS_HEADERS.dutyLimit] ?? "").trim();

    const payload = {
      school_id: schoolId,
      full_name: name,
      full_name_en: nameEn,
      weekly_quota: weeklyQuota,
      substitute_limit: substituteLimitRaw ? Number(substituteLimitRaw) : null,
      substitute_period: normalizePeriod(String(row[TEACHERS_HEADERS.substitutePeriod] ?? "")),
      duty_limit: dutyLimitRaw ? Number(dutyLimitRaw) : null,
      duty_period: normalizePeriod(String(row[TEACHERS_HEADERS.dutyPeriod] ?? "")),
    };

    let teacherId = teacherNameToId.get(name);

    if (teacherId) {
      const { error } = await supabase.from("teachers").update(payload).eq("id", teacherId);
      if (error) {
        errors.push(`صف ${rowNum} (${name}): تعذّر التحديث — ${error.message}`);
        continue;
      }
    } else {
      const { data: inserted, error } = await supabase
        .from("teachers")
        .insert(payload)
        .select()
        .single();
      if (error || !inserted) {
        errors.push(`صف ${rowNum} (${name}): تعذّر الإضافة — ${error?.message ?? "خطأ غير معروف"}`);
        continue;
      }
      teacherId = (inserted as unknown as { id: string }).id;
      teacherNameToId.set(name, teacherId);
    }

    teachersImported++;

    // المواد
    const subjectsStr = String(row[TEACHERS_HEADERS.subjects] ?? "").trim();
    if (subjectsStr) {
      const subjectNames = subjectsStr
        .split(/[،,]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const matchedIds: string[] = [];
      for (const sName of subjectNames) {
        const match = subjectsList.find((s) => s.name.trim() === sName);
        if (match) matchedIds.push(match.id);
        else errors.push(`صف ${rowNum} (${name}): المادة "${sName}" غير موجودة في صفحة المواد.`);
      }

      if (matchedIds.length > 0) {
        await supabase.from("teacher_subjects").delete().eq("teacher_id", teacherId);
        await supabase.from("teacher_subjects").insert(
          matchedIds.map((subjectId) => ({
            teacher_id: teacherId,
            subject_id: subjectId,
            school_id: schoolId,
          }))
        );
      }
    }
  }

  // ---------------- معالجة ورقة الجدول ----------------
  let scheduleRowsImported = 0;

  if (scheduleSheet) {
    const scheduleRows = XLSX.utils.sheet_to_json<Record<string, string>>(scheduleSheet, {
      defval: "",
    });

    for (let i = 0; i < scheduleRows.length; i++) {
      const row = scheduleRows[i];
      const rowNum = i + 2;

      const teacherName = String(row[SCHEDULE_HEADERS.teacherName] ?? "").trim();
      const dayName = String(row[SCHEDULE_HEADERS.day] ?? "").trim();
      const periodRaw = String(row[SCHEDULE_HEADERS.period] ?? "").trim();
      const sectionLabel = String(row[SCHEDULE_HEADERS.section] ?? "").trim();
      const subjectName = String(row[SCHEDULE_HEADERS.subject] ?? "").trim();

      if (!teacherName && !dayName && !periodRaw && !sectionLabel) continue; // صف فارغ

      const teacherId = teacherNameToId.get(teacherName);
      if (!teacherId) {
        errors.push(`صف ${rowNum} (جدول): المعلمة "${teacherName}" غير معروفة.`);
        continue;
      }

      const dayCode = DAY_NAME_TO_CODE[dayName];
      if (!dayCode) {
        errors.push(`صف ${rowNum} (جدول): اسم اليوم "${dayName}" غير صحيح.`);
        continue;
      }

      const period = Number(periodRaw);
      if (!period) {
        errors.push(`صف ${rowNum} (جدول): رقم الحصة غير صحيح.`);
        continue;
      }

      const section = sectionsWithLabel.find((s) => s.label === sectionLabel);
      if (!section) {
        errors.push(`صف ${rowNum} (جدول): الشعبة "${sectionLabel}" غير مطابقة لأي شعبة موجودة.`);
        continue;
      }

      const subject = subjectName ? subjectsList.find((s) => s.name.trim() === subjectName) : null;
      if (subjectName && !subject) {
        errors.push(`صف ${rowNum} (جدول): المادة "${subjectName}" غير موجودة.`);
      }

      const { error } = await supabase.from("teacher_schedule").upsert(
        {
          teacher_id: teacherId,
          school_id: schoolId,
          day: dayCode,
          period_number: period,
          section_id: section.id,
          subject_id: subject?.id ?? null,
        },
        { onConflict: "teacher_id,day,period_number" }
      );

      if (error) {
        errors.push(`صف ${rowNum} (جدول): تعذّر الحفظ — ${error.message}`);
        continue;
      }

      scheduleRowsImported++;
    }
  }

  revalidatePath("/dashboard/teachers");
  revalidatePath("/dashboard/assignments");
  revalidatePath("/dashboard/quotas");
  revalidatePath("/dashboard/reports");

  return { success: true, teachersImported, scheduleRowsImported, errors };
}
