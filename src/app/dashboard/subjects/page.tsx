import { Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getCurrentSchoolId } from "@/lib/school";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSubject, deleteSubject } from "@/app/dashboard/subjects/actions";

export default async function SubjectsPage() {
  const schoolId = await getCurrentSchoolId();
  const supabase = await createClient();

  const { data } = schoolId
    ? await supabase
        .from("subjects")
        .select("id, name")
        .eq("school_id", schoolId)
        .order("name")
    : { data: [] };

  const subjects = (data as { id: string; name: string }[] | null) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy">المواد</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          أضيفي المواد الدراسية المعتمدة في المدرسة، لاستخدامها لاحقًا عند
          إدخال بيانات المعلمات.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>إضافة مادة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSubject} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 flex-col gap-2">
              <Label htmlFor="subject-name">اسم المادة</Label>
              <Input id="subject-name" name="name" required placeholder="مثال: لغتي" />
            </div>
            <div className="flex items-end">
              <Button type="submit">إضافة</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>المواد الحالية ({subjects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              لا توجد مواد مضافة بعد.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center justify-between py-3">
                  <p className="text-sm font-medium text-navy">{subject.name}</p>
                  <form action={deleteSubject.bind(null, subject.id)}>
                    <Button variant="ghost" size="icon" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
