-- ============================================================
-- نظام إسناد - الإصدار الأول
-- مخطط قاعدة البيانات الأولي
-- شغّلي هذا الملف كاملاً في: Supabase Dashboard > SQL Editor
-- ============================================================

-- تفعيل الامتدادات اللازمة
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1) جدول المدارس
-- ------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2) جدول الملفات الشخصية (يرتبط بحسابات Supabase Auth)
--    role: owner  = مالكة النظام (صلاحية كاملة على كل المدارس)
--          admin  = مديرة مدرسة (صلاحية على مدرستها فقط)
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('owner', 'admin')),
  school_id uuid references public.schools (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3) جدول المواد الدراسية
-- ------------------------------------------------------------
create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 4) جدول الصفوف والشعب
-- ------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  grade text not null,
  section text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 5) جدول المعلمات
-- ------------------------------------------------------------
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  full_name text not null,
  national_id text,
  phone text,
  email text,
  weekly_quota integer not null default 24,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 6) جدول التكليفات (ربط معلمة بمادة وشعبة وعدد حصص أسبوعية)
-- ------------------------------------------------------------
create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  weekly_hours integer not null default 1,
  created_at timestamptz not null default now()
);

-- ============================================================
-- تفعيل أمان الصفوف (Row Level Security)
-- ============================================================
alter table public.schools enable row level security;
alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.classes enable row level security;
alter table public.teachers enable row level security;
alter table public.assignments enable row level security;

-- دالة مساعدة: هل المستخدم الحالي مالكة نظام؟
create or replace function public.is_owner()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

-- دالة مساعدة: مدرسة المستخدم الحالي
create or replace function public.current_school_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select school_id from public.profiles where id = auth.uid();
$$;

-- ---------------- سياسات profiles ----------------
create policy "profiles: قراءة الملف الشخصي أو رؤية مالكة النظام للجميع"
  on public.profiles for select
  using (id = auth.uid() or public.is_owner());

create policy "profiles: تحديث الملف الشخصي فقط"
  on public.profiles for update
  using (id = auth.uid());

-- ---------------- سياسات schools ----------------
create policy "schools: مالكة النظام ترى الكل، والمديرة ترى مدرستها"
  on public.schools for select
  using (public.is_owner() or id = public.current_school_id());

create policy "schools: مالكة النظام فقط تُنشئ مدارس"
  on public.schools for insert
  with check (public.is_owner());

create policy "schools: مالكة النظام فقط تُعدّل المدارس"
  on public.schools for update
  using (public.is_owner());

-- ---------------- سياسات موحّدة لبيانات المدرسة ----------------
-- (المواد / الصفوف والشعب / المعلمات / التكليفات)
-- القاعدة: مالكة النظام ترى كل شيء، ومديرة المدرسة ترى بيانات مدرستها فقط.

create policy "subjects: عرض حسب المدرسة"
  on public.subjects for select
  using (public.is_owner() or school_id = public.current_school_id());
create policy "subjects: إدارة حسب المدرسة"
  on public.subjects for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "classes: عرض حسب المدرسة"
  on public.classes for select
  using (public.is_owner() or school_id = public.current_school_id());
create policy "classes: إدارة حسب المدرسة"
  on public.classes for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "teachers: عرض حسب المدرسة"
  on public.teachers for select
  using (public.is_owner() or school_id = public.current_school_id());
create policy "teachers: إدارة حسب المدرسة"
  on public.teachers for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "assignments: عرض حسب المدرسة"
  on public.assignments for select
  using (public.is_owner() or school_id = public.current_school_id());
create policy "assignments: إدارة حسب المدرسة"
  on public.assignments for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

-- ============================================================
-- إنشاء تلقائي لصف "profiles" عند إنشاء حساب جديد في Auth
-- تُقرأ البيانات (full_name / role / school_id) من
-- raw_user_meta_data الذي يُمرَّر عند إنشاء المستخدم.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, school_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'مستخدمة جديدة'),
    coalesce(new.raw_user_meta_data ->> 'role', 'admin'),
    nullif(new.raw_user_meta_data ->> 'school_id', '')::uuid
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
