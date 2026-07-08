-- ============================================================
-- إسناد - إضافات المخطط (v5): سجل الاحتياط
-- شغّلي بعد schema.sql إلى schema_v4.sql
-- ============================================================

create table if not exists public.substitute_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools (id) on delete cascade,
  substitute_teacher_id uuid not null references public.teachers (id) on delete cascade,
  absent_teacher_id uuid not null references public.teachers (id) on delete cascade,
  record_date date not null,
  day text not null,
  period_number integer not null,
  section_id uuid references public.sections (id) on delete set null,
  subject_id uuid references public.subjects (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.substitute_records enable row level security;
create policy "substitute_records: حسب المدرسة" on public.substitute_records for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());
