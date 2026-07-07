export type Lang = "ar" | "en";

export interface TranslationShape {
  nav: {
    dashboard: string;
    teachers: string;
    assignments: string;
    quotas: string;
    classes: string;
    subjects: string;
    reports: string;
    settings: string;
    logout: string;
  };
  topbar: {
    settings: string;
    logout: string;
    language: string;
  };
  app: {
    name: string;
    tagline: string;
  };
}

export const translations: Record<Lang, TranslationShape> = {
  ar: {
    nav: {
      dashboard: "لوحة التحكم",
      teachers: "المعلمات",
      assignments: "التكليفات",
      quotas: "النصاب",
      classes: "الصفوف والشعب",
      subjects: "المواد",
      reports: "التقارير",
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
    },
    topbar: {
      settings: "الإعدادات",
      logout: "تسجيل الخروج",
      language: "English",
    },
    app: {
      name: "إسناد",
      tagline: "نظام إدارة النصاب التدريسي",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      teachers: "Teachers",
      assignments: "Assignments",
      quotas: "Workload",
      classes: "Classes & Sections",
      subjects: "Subjects",
      reports: "Reports",
      settings: "Settings",
      logout: "Log Out",
    },
    topbar: {
      settings: "Settings",
      logout: "Log Out",
      language: "العربية",
    },
    app: {
      name: "Isnad",
      tagline: "Teaching Workload Management System",
    },
  },
};
