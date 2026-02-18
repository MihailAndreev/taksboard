-- Fix projects SELECT policy - remove project_members check to avoid recursion
drop policy if exists projects_select_for_owner_or_member on public.projects;

create policy projects_select_for_owner_or_member
on public.projects
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or id in (
    select project_id 
    from public.project_members 
    where user_id = auth.uid()
  )
);

-- Also simplify project_stages and tasks policies to avoid any potential recursion
drop policy if exists project_stages_select_for_owner_or_member on public.project_stages;
drop policy if exists project_stages_modify_for_owner_or_member on public.project_stages;

create policy project_stages_select_for_owner_or_member
on public.project_stages
for select
to authenticated
using (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
);

create policy project_stages_modify_for_owner_or_member
on public.project_stages
for all
to authenticated
using (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
)
with check (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
);

drop policy if exists tasks_select_for_owner_or_member on public.tasks;
drop policy if exists tasks_modify_for_owner_or_member on public.tasks;

create policy tasks_select_for_owner_or_member
on public.tasks
for select
to authenticated
using (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
);

create policy tasks_modify_for_owner_or_member
on public.tasks
for all
to authenticated
using (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
)
with check (
  project_id in (
    select id from public.projects where owner_user_id = auth.uid()
  )
  or project_id in (
    select project_id from public.project_members where user_id = auth.uid()
  )
);
