export const TEACHERS_SHEET = "المعلمات";
export const SCHEDULE_SHEET = "الجدول";
export const REFERENCE_SHEET = "مرجع";

export const TEACHERS_HEADERS = {
  name: "الاسم",
  nameEn: "الاسم بالإنجليزي",
  subjects: "المواد (مفصولة بفاصلة ،)",
  weeklyQuota: "النصاب الأسبوعي",
  substituteLimit: "حد الاحتياط",
  substitutePeriod: "فترة الاحتياط (أسبوعي / شهري)",
  dutyLimit: "حد المناوبة",
  dutyPeriod: "فترة المناوبة (أسبوعي / شهري)",
} as const;

export const SCHEDULE_HEADERS = {
  teacherName: "اسم المعلمة",
  day: "اليوم (الأحد/الاثنين/الثلاثاء/الأربعاء/الخميس/الجمعة)",
  period: "رقم الحصة",
  section: "الشعبة (انسخيها بالضبط من ورقة مرجع)",
  subject: "المادة (اختياري إن كانت المعلمة تدرّس مادة واحدة)",
} as const;

export const DAY_NAME_TO_CODE: Record<string, string> = {
  الأحد: "sun",
  الاثنين: "mon",
  الثلاثاء: "tue",
  الأربعاء: "wed",
  الخميس: "thu",
  الجمعة: "fri",
};
