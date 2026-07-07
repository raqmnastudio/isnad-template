-- ============================================================
-- إسناد - إضافات المخطط (v3): نظام المناوبات الهرمي
-- شغّلي هذا الملف بعد schema.sql و schema_v2.sql
-- ============================================================

-- الأنواع الأساسية للمناوبات (مثال: المناوبة الصباحية)
create table if not exists public.duty_categories (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- الأنواع الفرعية (مثال: الاستقبال الرئيسي، الإشراف العام) — بوقت ومكان
create table if not exists public.duty_subtypes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.duty_categories (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  name text not null,
  place text,
  start_time time,
  end_time time,
  friday_start_time time,
  friday_end_time time,
  created_at timestamptz not null default now()
);

-- إسناد معلمة لنوع فرعي في يوم معيّن (يتكرر أسبوعيًا، معلمة مختلفة كل يوم)
create table if not exists public.duty_assignments (
  id uuid primary key default gen_random_uuid(),
  subtype_id uuid not null references public.duty_subtypes (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  teacher_id uuid not null references public.teachers (id) on delete cascade,
  day text not null,
  created_at timestamptz not null default now(),
  unique (subtype_id, teacher_id, day)
);

alter table public.duty_categories enable row level security;
alter table public.duty_subtypes enable row level security;
alter table public.duty_assignments enable row level security;

create policy "duty_categories: حسب المدرسة" on public.duty_categories for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "duty_subtypes: حسب المدرسة" on public.duty_subtypes for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

create policy "duty_assignments: حسب المدرسة" on public.duty_assignments for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());
