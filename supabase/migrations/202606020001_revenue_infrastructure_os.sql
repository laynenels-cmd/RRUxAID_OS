create extension if not exists pgcrypto;

create schema if not exists private;

create or replace function private.current_app_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(private.current_app_role() = 'admin', false)
$$;

create or replace function private.can_write_ops()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(private.current_app_role() in ('admin', 'operator'), false)
$$;

create or replace function private.can_read_ops()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(private.current_app_role() in ('admin', 'operator', 'viewer'), false)
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'viewer' check (role in ('admin', 'operator', 'viewer', 'partner')),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.athletes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  sport text not null,
  level text not null,
  audience_count integer not null default 0,
  audience_label text,
  platforms text[] not null default '{}',
  source text,
  owner text,
  stage text,
  stage_index integer,
  readiness_score integer check (readiness_score between 0 and 100),
  brand_summary text,
  monetization_summary text,
  audience_behavior text,
  trust_signals text[] not null default '{}',
  inbound_questions text[] not null default '{}',
  assets text[] not null default '{}',
  current_leak text,
  next_action text,
  pipeline_value numeric not null default 0,
  avatar_initials text,
  archived_at timestamp with time zone,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.partner_athlete_access (
  partner_id uuid not null references public.profiles(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  can_view boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc', now()),
  primary key (partner_id, athlete_id)
);

create table if not exists public.athlete_leaks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  label text not null,
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.athlete_opportunities (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  label text not null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.diagnostics (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'running', 'complete', 'approved')),
  overall_score integer check (overall_score between 0 and 100),
  summary text,
  primary_constraint text,
  recommended_path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.diagnostic_scores (
  id uuid primary key default gen_random_uuid(),
  diagnostic_id uuid not null references public.diagnostics(id) on delete cascade,
  category text not null,
  score integer not null check (score between 0 and 100),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  note text
);

create table if not exists public.offers (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  buyer_profile text,
  promise text,
  mechanism text,
  deliverables jsonb not null default '{"items":[]}'::jsonb,
  projected_month_1_revenue numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'review', 'approved', 'deployed')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.buildouts (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  stage integer not null check (stage between 1 and 10),
  percent_complete integer not null default 0 check (percent_complete between 0 and 100),
  owner text,
  blocker text,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  next_action text,
  status text not null default 'not_started' check (status in ('not_started', 'active', 'blocked', 'complete')),
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.buildout_tasks (
  id uuid primary key default gen_random_uuid(),
  buildout_id uuid not null references public.buildouts(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'doing', 'done', 'blocked')),
  assignee_id uuid references public.profiles(id) on delete set null,
  due_date date,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.pipeline_deals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete set null,
  deal_name text not null,
  deal_type text,
  amount numeric not null default 0,
  probability integer not null default 0 check (probability between 0 and 100),
  stage text not null,
  expected_close_date date,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete set null,
  report_type text not null,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'sent')),
  content jsonb not null default '{}'::jsonb,
  pdf_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.agent_threads (
  id uuid primary key default gen_random_uuid(),
  title text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.agent_threads(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid references public.athletes(id) on delete set null,
  report_id uuid references public.reports(id) on delete set null,
  file_name text not null,
  file_type text,
  storage_path text not null,
  uploaded_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists athletes_code_idx on public.athletes(code);
create index if not exists diagnostics_athlete_idx on public.diagnostics(athlete_id);
create index if not exists offers_athlete_idx on public.offers(athlete_id);
create index if not exists buildouts_athlete_idx on public.buildouts(athlete_id);
create index if not exists pipeline_athlete_idx on public.pipeline_deals(athlete_id);
create index if not exists reports_athlete_idx on public.reports(athlete_id);
create index if not exists activity_entity_idx on public.activity_log(entity_type, entity_id);

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
drop trigger if exists athletes_updated_at on public.athletes;
create trigger athletes_updated_at before update on public.athletes for each row execute function private.set_updated_at();
drop trigger if exists diagnostics_updated_at on public.diagnostics;
create trigger diagnostics_updated_at before update on public.diagnostics for each row execute function private.set_updated_at();
drop trigger if exists offers_updated_at on public.offers;
create trigger offers_updated_at before update on public.offers for each row execute function private.set_updated_at();
drop trigger if exists buildouts_updated_at on public.buildouts;
create trigger buildouts_updated_at before update on public.buildouts for each row execute function private.set_updated_at();
drop trigger if exists buildout_tasks_updated_at on public.buildout_tasks;
create trigger buildout_tasks_updated_at before update on public.buildout_tasks for each row execute function private.set_updated_at();
drop trigger if exists pipeline_deals_updated_at on public.pipeline_deals;
create trigger pipeline_deals_updated_at before update on public.pipeline_deals for each row execute function private.set_updated_at();
drop trigger if exists reports_updated_at on public.reports;
create trigger reports_updated_at before update on public.reports for each row execute function private.set_updated_at();
drop trigger if exists agent_threads_updated_at on public.agent_threads;
create trigger agent_threads_updated_at before update on public.agent_threads for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.athletes enable row level security;
alter table public.partner_athlete_access enable row level security;
alter table public.athlete_leaks enable row level security;
alter table public.athlete_opportunities enable row level security;
alter table public.diagnostics enable row level security;
alter table public.diagnostic_scores enable row level security;
alter table public.offers enable row level security;
alter table public.buildouts enable row level security;
alter table public.buildout_tasks enable row level security;
alter table public.pipeline_deals enable row level security;
alter table public.reports enable row level security;
alter table public.agent_threads enable row level security;
alter table public.agent_messages enable row level security;
alter table public.activity_log enable row level security;
alter table public.files enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.current_app_role() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.can_write_ops() to authenticated;
grant execute on function private.can_read_ops() to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
using ((select auth.uid()) = id or private.can_read_ops() or private.is_admin());
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles for all to authenticated
using (private.is_admin()) with check (private.is_admin());

drop policy if exists athletes_select on public.athletes;
create policy athletes_select on public.athletes for select to authenticated
using (
  private.can_read_ops()
  or (
    private.current_app_role() = 'partner'
    and exists (
      select 1 from public.partner_athlete_access access
      where access.athlete_id = athletes.id
      and access.partner_id = (select auth.uid())
      and access.can_view
    )
  )
);
drop policy if exists athletes_write on public.athletes;
create policy athletes_write on public.athletes for all to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists reports_select on public.reports;
create policy reports_select on public.reports for select to authenticated
using (
  private.can_read_ops()
  or (
    private.current_app_role() = 'partner'
    and reports.status = 'approved'
    and exists (
      select 1 from public.partner_athlete_access access
      where access.athlete_id = reports.athlete_id
      and access.partner_id = (select auth.uid())
      and access.can_view
    )
  )
);
drop policy if exists reports_write on public.reports;
create policy reports_write on public.reports for all to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists partner_access_admin on public.partner_athlete_access;
create policy partner_access_admin on public.partner_athlete_access for all to authenticated
using (private.is_admin()) with check (private.is_admin());

drop policy if exists leaks_read on public.athlete_leaks;
create policy leaks_read on public.athlete_leaks for select to authenticated using (private.can_read_ops());
drop policy if exists leaks_write on public.athlete_leaks;
create policy leaks_write on public.athlete_leaks for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists opportunities_read on public.athlete_opportunities;
create policy opportunities_read on public.athlete_opportunities for select to authenticated using (private.can_read_ops());
drop policy if exists opportunities_write on public.athlete_opportunities;
create policy opportunities_write on public.athlete_opportunities for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists diagnostics_read on public.diagnostics;
create policy diagnostics_read on public.diagnostics for select to authenticated using (private.can_read_ops());
drop policy if exists diagnostics_write on public.diagnostics;
create policy diagnostics_write on public.diagnostics for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists diagnostic_scores_read on public.diagnostic_scores;
create policy diagnostic_scores_read on public.diagnostic_scores for select to authenticated using (private.can_read_ops());
drop policy if exists diagnostic_scores_write on public.diagnostic_scores;
create policy diagnostic_scores_write on public.diagnostic_scores for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists offers_read on public.offers;
create policy offers_read on public.offers for select to authenticated using (private.can_read_ops());
drop policy if exists offers_write on public.offers;
create policy offers_write on public.offers for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists buildouts_read on public.buildouts;
create policy buildouts_read on public.buildouts for select to authenticated using (private.can_read_ops());
drop policy if exists buildouts_write on public.buildouts;
create policy buildouts_write on public.buildouts for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists buildout_tasks_read on public.buildout_tasks;
create policy buildout_tasks_read on public.buildout_tasks for select to authenticated using (private.can_read_ops());
drop policy if exists buildout_tasks_write on public.buildout_tasks;
create policy buildout_tasks_write on public.buildout_tasks for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists pipeline_read on public.pipeline_deals;
create policy pipeline_read on public.pipeline_deals for select to authenticated using (private.can_read_ops());
drop policy if exists pipeline_write on public.pipeline_deals;
create policy pipeline_write on public.pipeline_deals for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

drop policy if exists agent_threads_read on public.agent_threads;
create policy agent_threads_read on public.agent_threads for select to authenticated
using (private.is_admin() or created_by = (select auth.uid()));
drop policy if exists agent_threads_write on public.agent_threads;
create policy agent_threads_write on public.agent_threads for all to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()))
with check (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()));

drop policy if exists agent_messages_read on public.agent_messages;
create policy agent_messages_read on public.agent_messages for select to authenticated
using (
  private.is_admin()
  or exists (
    select 1 from public.agent_threads thread
    where thread.id = agent_messages.thread_id
    and thread.created_by = (select auth.uid())
  )
);
drop policy if exists agent_messages_write on public.agent_messages;
create policy agent_messages_write on public.agent_messages for all to authenticated
using (
  private.current_app_role() in ('admin', 'operator', 'viewer')
  and exists (
    select 1 from public.agent_threads thread
    where thread.id = agent_messages.thread_id
    and thread.created_by = (select auth.uid())
  )
)
with check (
  private.current_app_role() in ('admin', 'operator', 'viewer')
  and exists (
    select 1 from public.agent_threads thread
    where thread.id = agent_messages.thread_id
    and thread.created_by = (select auth.uid())
  )
);

drop policy if exists activity_read on public.activity_log;
create policy activity_read on public.activity_log for select to authenticated using (private.can_read_ops());
drop policy if exists activity_write on public.activity_log;
create policy activity_write on public.activity_log for insert to authenticated with check (private.can_write_ops() or private.current_app_role() = 'viewer');

drop policy if exists files_read on public.files;
create policy files_read on public.files for select to authenticated using (private.can_read_ops());
drop policy if exists files_write on public.files;
create policy files_write on public.files for all to authenticated using (private.can_write_ops()) with check (private.can_write_ops());

insert into storage.buckets (id, name, public)
values ('reports', 'reports', false)
on conflict (id) do nothing;
