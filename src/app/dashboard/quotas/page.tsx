import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function QuotasPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  interface Row {
    id: string;
    fullName: string;
    target: number;
    actual: number;
  }

  let rows: Row[] = [];

  if (schoolId) {
    const [teachersRes, scheduleRes] = await Promise.all([
      supabase
        .from("teachers")
        .select("id, full_name, weekly_quota")
        .eq("school_id", schoolId)
        .order("full_name"),
      supabase
        .from("teacher_schedule")
        .select("teacher_id, section_id")
        .eq("school_id", schoolId),
    ]);

    type T = { id: string; full_name: string; weekly_quota: number };
    type Sch = { teacher_id: string; section_id: string | null };

    const teachers = (teachersRes.data as T[] | null) ?? [];
    const schedule = (scheduleRes.data as Sch[] | null) ?? [];

    rows = teachers.map((t) => ({
      id: t.id,
      fullName: t.full_name,
      target: t.weekly_quota,
      actual: schedule.filter((s) => s.teacher_id === t.id && s.section_id).length,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">النصاب</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          مقارنة النصاب الأسبوعي المستهدف لكل معلمة (المحدَّد عند إضافتها) مع
          عدد الحصص الفعلية في جدولها الأسبوعي.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>حالة النصاب ({rows.length} معلمة)</CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              لا توجد معلمات مضافات بعد.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {rows.map((row) => {
                const diff = row.actual - row.target;
                const status =
                  diff === 0
                    ? { label: "مكتمل", cls: "bg-emerald-100 text-emerald-700" }
                    : diff < 0
                      ? { label: `أقل بـ ${Math.abs(diff)}`, cls: "bg-amber-100 text-amber-700" }
                      : { label: `أكثر بـ ${diff}`, cls: "bg-red-100 text-red-700" };

                return (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-medium text-navy">{row.fullName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        المستهدف: {row.target} حصة · الفعلي: {row.actual} حصة
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${status.cls}`}>
                      {status.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
