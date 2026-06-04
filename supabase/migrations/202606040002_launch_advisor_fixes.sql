create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create index if not exists activity_log_actor_idx on public.activity_log(actor_id);
create index if not exists agent_messages_thread_idx on public.agent_messages(thread_id);
create index if not exists agent_threads_created_by_idx on public.agent_threads(created_by);
create index if not exists athlete_leaks_athlete_idx on public.athlete_leaks(athlete_id);
create index if not exists athlete_opportunities_athlete_idx on public.athlete_opportunities(athlete_id);
create index if not exists buildout_tasks_assignee_idx on public.buildout_tasks(assignee_id);
create index if not exists buildout_tasks_buildout_idx on public.buildout_tasks(buildout_id);
create index if not exists diagnostic_scores_diagnostic_idx on public.diagnostic_scores(diagnostic_id);
create index if not exists diagnostics_created_by_idx on public.diagnostics(created_by);
create index if not exists files_athlete_idx on public.files(athlete_id);
create index if not exists files_report_idx on public.files(report_id);
create index if not exists files_uploaded_by_idx on public.files(uploaded_by);
create index if not exists offers_created_by_idx on public.offers(created_by);
create index if not exists partner_athlete_access_athlete_idx on public.partner_athlete_access(athlete_id);
create index if not exists pipeline_deals_owner_idx on public.pipeline_deals(owner_id);
create index if not exists reports_created_by_idx on public.reports(created_by);

drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_insert on public.profiles for insert to authenticated
with check (private.is_admin());
create policy profiles_admin_update on public.profiles for update to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy profiles_admin_delete on public.profiles for delete to authenticated
using (private.is_admin());

drop policy if exists athletes_write on public.athletes;
create policy athletes_insert on public.athletes for insert to authenticated
with check (private.can_write_ops());
create policy athletes_update on public.athletes for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy athletes_delete on public.athletes for delete to authenticated
using (private.can_write_ops());

drop policy if exists reports_write on public.reports;
create policy reports_insert on public.reports for insert to authenticated
with check (private.can_write_ops());
create policy reports_update on public.reports for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy reports_delete on public.reports for delete to authenticated
using (private.can_write_ops());

drop policy if exists partner_access_admin on public.partner_athlete_access;
create policy partner_access_insert on public.partner_athlete_access for insert to authenticated
with check (private.is_admin());
create policy partner_access_update on public.partner_athlete_access for update to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy partner_access_delete on public.partner_athlete_access for delete to authenticated
using (private.is_admin());

drop policy if exists leaks_write on public.athlete_leaks;
create policy leaks_insert on public.athlete_leaks for insert to authenticated
with check (private.can_write_ops());
create policy leaks_update on public.athlete_leaks for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy leaks_delete on public.athlete_leaks for delete to authenticated
using (private.can_write_ops());

drop policy if exists opportunities_write on public.athlete_opportunities;
create policy opportunities_insert on public.athlete_opportunities for insert to authenticated
with check (private.can_write_ops());
create policy opportunities_update on public.athlete_opportunities for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy opportunities_delete on public.athlete_opportunities for delete to authenticated
using (private.can_write_ops());

drop policy if exists diagnostics_write on public.diagnostics;
create policy diagnostics_insert on public.diagnostics for insert to authenticated
with check (private.can_write_ops());
create policy diagnostics_update on public.diagnostics for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy diagnostics_delete on public.diagnostics for delete to authenticated
using (private.can_write_ops());

drop policy if exists diagnostic_scores_write on public.diagnostic_scores;
create policy diagnostic_scores_insert on public.diagnostic_scores for insert to authenticated
with check (private.can_write_ops());
create policy diagnostic_scores_update on public.diagnostic_scores for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy diagnostic_scores_delete on public.diagnostic_scores for delete to authenticated
using (private.can_write_ops());

drop policy if exists offers_write on public.offers;
create policy offers_insert on public.offers for insert to authenticated
with check (private.can_write_ops());
create policy offers_update on public.offers for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy offers_delete on public.offers for delete to authenticated
using (private.can_write_ops());

drop policy if exists buildouts_write on public.buildouts;
create policy buildouts_insert on public.buildouts for insert to authenticated
with check (private.can_write_ops());
create policy buildouts_update on public.buildouts for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy buildouts_delete on public.buildouts for delete to authenticated
using (private.can_write_ops());

drop policy if exists buildout_tasks_write on public.buildout_tasks;
create policy buildout_tasks_insert on public.buildout_tasks for insert to authenticated
with check (private.can_write_ops());
create policy buildout_tasks_update on public.buildout_tasks for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy buildout_tasks_delete on public.buildout_tasks for delete to authenticated
using (private.can_write_ops());

drop policy if exists pipeline_write on public.pipeline_deals;
create policy pipeline_insert on public.pipeline_deals for insert to authenticated
with check (private.can_write_ops());
create policy pipeline_update on public.pipeline_deals for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy pipeline_delete on public.pipeline_deals for delete to authenticated
using (private.can_write_ops());

drop policy if exists agent_threads_write on public.agent_threads;
create policy agent_threads_insert on public.agent_threads for insert to authenticated
with check (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()));
create policy agent_threads_update on public.agent_threads for update to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()))
with check (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()));
create policy agent_threads_delete on public.agent_threads for delete to authenticated
using (private.current_app_role() in ('admin', 'operator', 'viewer') and created_by = (select auth.uid()));

drop policy if exists agent_messages_write on public.agent_messages;
create policy agent_messages_insert on public.agent_messages for insert to authenticated
with check (
  private.current_app_role() in ('admin', 'operator', 'viewer')
  and exists (
    select 1 from public.agent_threads thread
    where thread.id = agent_messages.thread_id
    and thread.created_by = (select auth.uid())
  )
);
create policy agent_messages_update on public.agent_messages for update to authenticated
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
create policy agent_messages_delete on public.agent_messages for delete to authenticated
using (
  private.current_app_role() in ('admin', 'operator', 'viewer')
  and exists (
    select 1 from public.agent_threads thread
    where thread.id = agent_messages.thread_id
    and thread.created_by = (select auth.uid())
  )
);

drop policy if exists files_write on public.files;
create policy files_insert on public.files for insert to authenticated
with check (private.can_write_ops());
create policy files_update on public.files for update to authenticated
using (private.can_write_ops()) with check (private.can_write_ops());
create policy files_delete on public.files for delete to authenticated
using (private.can_write_ops());
