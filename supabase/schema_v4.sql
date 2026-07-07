-- ============================================================
-- إسناد - إضافات المخطط (v4)
-- شغّلي بعد schema.sql, schema_v2.sql, schema_v3.sql
-- ============================================================

-- أوقات كل حصة داخل كل حلقة (لحساب تعارض المناوبات مع الحصص)
create table if not exists public.period_times (
  id uuid primary key default gen_random_uuid(),
  stage_id uuid not null references public.stages (id) on delete cascade,
  school_id uuid not null references public.schools (id) on delete cascade,
  period_number integer not null,
  is_friday boolean not null default false,
  start_time time,
  end_time time,
  unique (stage_id, period_number, is_friday)
);

alter table public.period_times enable row level security;
create policy "period_times: حسب المدرسة" on public.period_times for all
  using (public.is_owner() or school_id = public.current_school_id())
  with check (public.is_owner() or school_id = public.current_school_id());

-- أسماء إنجليزية اختيارية (لطباعة جداول بلغتين)
alter table public.teachers add column if not exists full_name_en text;
alter table public.duty_categories add column if not exists name_en text;
alter table public.duty_subtypes add column if not exists name_en text;
alter table public.duty_subtypes add column if not exists place_en text;
