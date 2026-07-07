-- ============================================================
-- إسناد - إضافات المخطط (v2)
-- شغّلي هذا الملف بعد schema.sql الأصلي
-- ============================================================

-- الحلقات الدراسية (كل مدرسة عندها عدة حلقات، كل حلقة إعداداتها مستقلة)
create table if not exists public.stages (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  section_type text not null check (section_type in ('numbers', 'letters')),
  periods_per_day integer not null default 7,
  friday_periods integer not null default 0,
  working_days text[] not null default array['mon','tue','wed','thu','fri'],
  created_at timestamptz not null default now()
);

-- الصفوف داخل كل حلقة
create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  grade_number integer not null,
  name text not null,
  created_at timestamptz not null default now()
);

-- الشعب داخل كل صف (تُنشأ تلقائيًا حسب عدد الشعب ونوع الترميز)
create table if not exists public.sections (
  id uuid primary key default gen_random_uuid(),
  grade_id uuid not null references public.grades (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  code text not null, -- مثال: 1A أو 1-1
  created_at timestamptz not null default now()
);

-- فترات الفسحة/البريك داخل كل حلقة
create table if not exists public.breaks (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  after_period integer not null,
  created_at timestamptz not null default now()
);

-- أنواع المناوبات (تُدار من مديرة المدرسة: إضافة/حذف)
create table if not exists public.duty_types (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- إضافة حقول جديدة لجدول المعلمات
alter table public.teachers add column if not exists substitute_limit integer;
alter table public.teachers add column if not exists substitute_period text check (substitute_period in ('weekly', 'monthly'));
alter table public.teachers add column if not exists duty_limit integer;
alter table public.teachers add column if not exists duty_period text check (duty_period in ('weekly', 'monthly'));

-- ربط المعلمة بأكثر من مادة
create table if not exists public.teacher_subjects (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  unique (teacher_id, subject_id)
);

-- ربط المعلمة بأكثر من نوع مناوبة
create table if not exists public.teacher_duties (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  duty_type_id uuid not null references public.duty_types (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  unique (teacher_id, duty_type_id)
);

-- الجدول الأسبوعي للمعلمة: يوم × حصة → شعبة (+ مادة إن كان لديها أكثر من مادة)
create table if not exists public.teacher_schedule (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  day text not null, -- sun/mon/tue/wed/thu/fri
  period_number integer not null,
  section_id uuid references public.sections (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (teacher_id, day, period_number)
);

-- ============================================================
-- تفعيل RLS + سياسات موحّدة (نفس نمط الجداول السابقة)
-- ============================================================
alter table public.stages enable row level security;
alter table public.grades enable row level security;
alter table public.sections enable row level security;
alter table public.breaks enable row level security;
alter table public.duty_types enable row level security;
alter table public.teacher_subjects enable row level security;
alter table public.teacher_duties enable row level security;
alter table public.teacher_schedule enable row level security;

create policy "stages: حسب المدرسة" on public.stages for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "grades: حسب المدرسة" on public.grades for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "sections: حسب المدرسة" on public.sections for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "breaks: حسب المدرسة" on public.breaks for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "duty_types: حسب المدرسة" on public.duty_types for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "teacher_subjects: حسب المدرسة" on public.teacher_subjects for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "teacher_duties: حسب المدرسة" on public.teacher_duties for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "teacher_schedule: حسب المدرسة" on public.teacher_schedule for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());
