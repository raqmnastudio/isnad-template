"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CheckState = "checking" | "ready" | "already-setup" | "error";

export default function SetupPage() {
  const router = useRouter();
  const [checkState, setCheckState] = useState<CheckState>("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [schoolName, setSchoolName] = useState("");
  const [ownerFullName, setOwnerFullName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [principalFullName, setPrincipalFullName] = useState("");
  const [principalEmail, setPrincipalEmail] = useState("");
  const [principalPassword, setPrincipalPassword] = useState("");

  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => {
        setCheckState(data.alreadySetup ? "already-setup" : "ready");
      })
      .catch(() => setCheckState("error"));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schoolName,
          ownerFullName,
          ownerEmail,
          ownerPassword,
          principalFullName,
          principalEmail,
          principalPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "حدث خطأ غير متوقع.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("تعذّر الاتصال بالخادم. تأكدي من ضبط متغيرات البيئة بشكل صحيح.");
      setLoading(false);
    }
  }

  if (checkState === "checking") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory">
        <p className="text-muted-foreground">جارٍ التحقق من حالة النظام...</p>
      </main>
    );
  }

  if (checkState === "already-setup") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>تم إعداد النظام مسبقًا</CardTitle>
            <CardDescription>
              تم تفعيل هذا النظام من قبل ولا يمكن تكرار الإعداد.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              الذهاب إلى تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>تم الإعداد بنجاح 🎉</CardTitle>
            <CardDescription>
              تم إنشاء المدرسة وحسابَي مالكة النظام ومديرة المدرسة بنجاح.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")} className="w-full">
              الذهاب إلى تسجيل الدخول
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-ivory px-4 py-10">
      <div className="w-full max-w-lg">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-navy text-2xl font-extrabold text-white">
            إس
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-navy">
              إعداد نظام إسناد لأول مرة
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              عبّئي البيانات التالية لتفعيل النظام لمدرستك. هذه الخطوة تُنفَّذ
              مرة واحدة فقط.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="schoolName">اسم المدرسة</Label>
                <Input
                  id="schoolName"
                  required
                  placeholder="مثال: مدرسة النور الأهلية"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-bold text-navy">
                  حساب مالكة النظام (لكِ أنتِ)
                </p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ownerFullName">الاسم الكامل</Label>
                  <Input
                    id="ownerFullName"
                    required
                    value={ownerFullName}
                    onChange={(e) => setOwnerFullName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ownerEmail">البريد الإلكتروني</Label>
                  <Input
                    id="ownerEmail"
                    type="email"
                    dir="ltr"
                    required
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ownerPassword">كلمة المرور</Label>
                  <Input
                    id="ownerPassword"
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/40 p-4">
                <p className="text-sm font-bold text-navy">حساب مديرة المدرسة</p>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="principalFullName">الاسم الكامل</Label>
                  <Input
                    id="principalFullName"
                    required
                    value={principalFullName}
                    onChange={(e) => setPrincipalFullName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="principalEmail">البريد الإلكتروني</Label>
                  <Input
                    id="principalEmail"
                    type="email"
                    dir="ltr"
                    required
                    value={principalEmail}
                    onChange={(e) => setPrincipalEmail(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="principalPassword">كلمة المرور</Label>
                  <Input
                    id="principalPassword"
                    type="password"
                    dir="ltr"
                    required
                    minLength={6}
                    value={principalPassword}
                    onChange={(e) => setPrincipalPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "جارٍ التفعيل..." : "تفعيل النظام"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
