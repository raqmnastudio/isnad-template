import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, ClipboardList, Gauge, Layers } from "lucide-react";

const summaryCards = [
  { title: "المعلمات", icon: Users },
  { title: "التكليفات", icon: ClipboardList },
  { title: "النصاب", icon: Gauge },
  { title: "الصفوف والشعب", icon: Layers },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileData } = user
    ? await supabase.from("profiles").select("full_name").eq("id", user.id).single()
    : { data: null };

  const profile = profileData as unknown as { full_name: string } | null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">
          مرحبًا، {profile?.full_name ?? ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          هذه لوحة التحكم الرئيسية لنظام إسناد. ستظهر هنا مؤشرات المعلمات
          والتكليفات والنصاب فور إدخال البيانات.
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
                <p className="text-3xl font-extrabold text-navy">٠</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  لا توجد بيانات مسجّلة بعد
                </p>
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
          لم تتم إضافة أي بيانات إلى النظام حتى الآن.
        </CardContent>
      </Card>
    </div>
  );
}
