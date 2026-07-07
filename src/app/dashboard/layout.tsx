import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name, role, school_id, schools ( name )")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as {
    full_name: string;
    role: "owner" | "admin";
    schools: { name: string } | null;
  } | null;

  const fullName = profile?.full_name ?? user.email ?? "مستخدمة";
  const roleLabel = profile?.role === "owner" ? "مالكة النظام" : "مديرة المدرسة";
  const schoolName = profile?.schools?.name;

  return (
    <DashboardShell
      fullName={fullName}
      roleLabel={roleLabel}
      schoolName={schoolName}
    >
      {children}
    </DashboardShell>
  );
}
