-- Remove all policies and recreate with NO circular dependencies
-- The key: projects SELECT will NOT check project_members at all during the query
-- Instead, we'll rely on application-level logic or separate queries

drop policy if exists projects_select_for_owner_or_member on public.projects;
drop policy if exists project_members_select_for_owner_or_member on public.project_members;

-- Projects: users can only see their OWN projects (no member check to avoid recursion)
create policy projects_select_owner_only
on public.projects
for select
to authenticated
using (owner_user_id = auth.uid());

-- Project members: users can see memberships for projects they OWN, or their OWN membership rows
create policy project_members_select_simple
on public.project_members
for select
to authenticated
using (
  user_id = auth.uid()
  or project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
);

-- Update stages and tasks to only check project ownership (remove member access for now)
drop policy if exists project_stages_select_for_owner_or_member on public.project_stages;
drop policy if exists project_stages_modify_for_owner_or_member on public.project_stages;
drop policy if exists tasks_select_for_owner_or_member on public.tasks;
drop policy if exists tasks_modify_for_owner_or_member on public.tasks;

create policy project_stages_select_owner
on public.project_stages
for select
to authenticated
using (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
);

create policy project_stages_modify_owner
on public.project_stages
for all
to authenticated
using (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
)
with check (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
);

create policy tasks_select_owner
on public.tasks
for select
to authenticated
using (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
);

create policy tasks_modify_owner
on public.tasks
for all
to authenticated
using (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
)
with check (
  project_id in (select id from public.projects where owner_user_id = auth.uid())
);
