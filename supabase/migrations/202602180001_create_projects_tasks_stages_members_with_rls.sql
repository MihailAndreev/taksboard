create extension if not exists pgcrypto;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  project text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  added_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table if not exists public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, position),
  unique (id, project_id),
  check (position >= 0)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  stage_id uuid not null,
  title text not null,
  description_html text,
  order_position integer not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (order_position >= 0),
  constraint tasks_project_fk
    foreign key (project_id) references public.projects(id) on delete cascade,
  constraint tasks_stage_project_fk
    foreign key (stage_id, project_id) references public.project_stages(id, project_id) on delete cascade,
  unique (stage_id, order_position)
);

create index if not exists idx_projects_owner_user_id on public.projects(owner_user_id);
create index if not exists idx_project_members_user_id on public.project_members(user_id);
create index if not exists idx_project_stages_project_id on public.project_stages(project_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_stage_id on public.tasks(stage_id);

alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.project_stages enable row level security;
alter table public.tasks enable row level security;

create policy projects_select_for_owner_or_member
on public.projects
for select
to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = auth.uid()
  )
);

create policy projects_insert_owner_only
on public.projects
for insert
to authenticated
with check (owner_user_id = auth.uid());

create policy projects_update_owner_only
on public.projects
for update
to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy projects_delete_owner_only
on public.projects
for delete
to authenticated
using (owner_user_id = auth.uid());

create policy project_members_select_for_owner_or_member
on public.project_members
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm2
          where pm2.project_id = project_members.project_id
            and pm2.user_id = auth.uid()
        )
      )
  )
);

create policy project_members_insert_owner_only
on public.project_members
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_user_id = auth.uid()
  )
);

create policy project_members_update_owner_only
on public.project_members
for update
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_user_id = auth.uid()
  )
);

create policy project_members_delete_owner_only
on public.project_members
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_user_id = auth.uid()
  )
);

create policy project_stages_select_for_owner_or_member
on public.project_stages
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = project_stages.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
);

create policy project_stages_modify_for_owner_or_member
on public.project_stages
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = project_stages.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = project_stages.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = project_stages.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
);

create policy tasks_select_for_owner_or_member
on public.tasks
for select
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = tasks.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
);

create policy tasks_modify_for_owner_or_member
on public.tasks
for all
to authenticated
using (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = tasks.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = tasks.project_id
      and (
        p.owner_user_id = auth.uid()
        or exists (
          select 1
          from public.project_members pm
          where pm.project_id = tasks.project_id
            and pm.user_id = auth.uid()
        )
      )
  )
);
