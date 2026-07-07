import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ClipboardList, Gauge, Layers } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  const profile = profileData as unknown as { full_name: string } | null;

  const schoolId = await getCurrentSchoolId();

  let teachersCount = 0;
  let assignmentsCount = 0;
  let sectionsCount = 0;
  let quotaLabel = "لا توجد بيانات مسجّلة بعد";

  if (schoolId) {
    const [teachersRes, scheduleRes, sectionsRes] = await Promise.all([
      supabase
        .from("teachers")
        .select("id, weekly_quota")
        .eq("school_id", schoolId),
      supabase
        .from("teacher_schedule")
        .select("teacher_id, section_id")
        .eq("school_id", schoolId),
      supabase.from("sections").select("id").eq("school_id", schoolId),
    ]);

    type TeacherRow = { id: string; weekly_quota: number };
    type ScheduleRow = { teacher_id: string; section_id: string | null };

    const teachers = (teachersRes.data as TeacherRow[] | null) ?? [];
    const schedule = (scheduleRes.data as ScheduleRow[] | null) ?? [];
    const sections = (sectionsRes.data as { id: string }[] | null) ?? [];

    teachersCount = teachers.length;
    assignmentsCount = schedule.filter((s) => s.section_id).length;
    sectionsCount = sections.length;

    if (teachers.length > 0) {
      const completed = teachers.filter(
        (t) => schedule.filter((s) => s.teacher_id === t.id && s.section_id).length === t.weekly_quota
      ).length;
      quotaLabel = `${completed} من ${teachers.length} مكتملة النصاب`;
    }
  }

  const summaryCards = [
    {
      title: "المعلمات",
      icon: Users,
      value: teachersCount.toLocaleString("ar"),
      hint: teachersCount > 0 ? "معلمة مسجّلة" : "لا توجد بيانات مسجّلة بعد",
    },
    {
      title: "التكليفات",
      icon: ClipboardList,
      value: assignmentsCount.toLocaleString("ar"),
      hint: assignmentsCount > 0 ? "حصة مُسندة أسبوعيًا" : "لا توجد بيانات مسجّلة بعد",
    },
    {
      title: "النصاب",
      icon: Gauge,
      value: teachersCount > 0 ? "" : "٠",
      hint: quotaLabel,
    },
    {
      title: "الصفوف والشعب",
      icon: Layers,
      value: sectionsCount.toLocaleString("ar"),
      hint: sectionsCount > 0 ? "شعبة مضافة" : "لا توجد بيانات مسجّلة بعد",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">
          مرحبًا، {profile?.full_name ?? ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه لوحة التحكم الرئيسية لنظام إسناد. تعرض المؤشرات أدناه البيانات
          الفعلية المُدخلة في النظام.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-navy/10 text-navy">
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </CardHeader>
              <CardContent>
                {card.value && (
                  <p className="text-3xl font-extrabold text-navy">{card.value}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>البداية</CardTitle>
          <CardDescription>
            استخدمي القائمة الجانبية للانتقال إلى الأقسام المختلفة من النظام.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {teachersCount > 0
            ? "بيانات النظام محدّثة ومرتبطة مباشرة بما أدخلتيه."
            : "لم تتم إضافة أي بيانات إلى النظام حتى الآن."}
        </CardContent>
      </Card>
    </div>
  );
}
