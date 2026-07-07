import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

interface SetupPayload {
  schoolName: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
  principalFullName: string;
  principalEmail: string;
  principalPassword: string;
}

function isValidPayload(body: unknown): body is SetupPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return [
    "schoolName",
    "ownerFullName",
    "ownerEmail",
    "ownerPassword",
    "principalFullName",
    "principalEmail",
    "principalPassword",
  ].every((key) => typeof b[key] === "string" && (b[key] as string).trim().length > 0);
}

export async function GET() {
  // يستخدم للتحقّق مما إذا كان الإعداد الأولي قد تم من قبل
  try {
    const supabase = createAdminClient();
    const { count, error } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) throw error;

    return NextResponse.json({ alreadySetup: (count ?? 0) > 0 });
  } catch {
    return NextResponse.json(
      { alreadySetup: false, error: "تعذّر الاتصال بقاعدة البيانات" },
      { status: 200 }
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json(
      { error: "يرجى تعبئة جميع الحقول المطلوبة" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  // منع إعادة تشغيل الإعداد إذا كان هناك حساب موجود مسبقًا
  const { count: existingCount, error: countError } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  if (countError) {
    return NextResponse.json(
      { error: "تعذّر الاتصال بقاعدة البيانات. تأكدي من تشغيل ملف schema.sql." },
      { status: 500 }
    );
  }

  if ((existingCount ?? 0) > 0) {
    return NextResponse.json(
      { error: "تم إعداد النظام مسبقًا. لا يمكن تكرار هذه الخطوة." },
      { status: 409 }
    );
  }

  // ١) إنشاء المدرسة
  const { data: school, error: schoolError } = await supabase
    .from("schools")
    .insert({ name: body.schoolName.trim() })
    .select()
    .single();

  if (schoolError || !school) {
    return NextResponse.json(
      { error: "تعذّر إنشاء المدرسة: " + (schoolError?.message ?? "خطأ غير معروف") },
      { status: 500 }
    );
  }

  // ٢) إنشاء حساب مالكة النظام
  const { error: ownerError } = await supabase.auth.admin.createUser({
    email: body.ownerEmail.trim(),
    password: body.ownerPassword,
    email_confirm: true,
    user_metadata: {
      full_name: body.ownerFullName.trim(),
      role: "owner",
    },
  });

  if (ownerError) {
    return NextResponse.json(
      { error: "تعذّر إنشاء حساب مالكة النظام: " + ownerError.message },
      { status: 500 }
    );
  }

  // ٣) إنشاء حساب مديرة المدرسة
  const { error: principalError } = await supabase.auth.admin.createUser({
    email: body.principalEmail.trim(),
    password: body.principalPassword,
    email_confirm: true,
    user_metadata: {
      full_name: body.principalFullName.trim(),
      role: "admin",
      school_id: school.id,
    },
  });

  if (principalError) {
    return NextResponse.json(
      { error: "تعذّر إنشاء حساب مديرة المدرسة: " + principalError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
