-- Drop the problematic recursive policy
drop policy if exists project_members_select_for_owner_or_member on public.project_members;

-- Create a simplified non-recursive policy
-- Users can see project_members if:
-- 1. They own the project, OR
-- 2. The membership row is their own (user_id = auth.uid())
create policy project_members_select_for_owner_or_member
on public.project_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.projects p
    where p.id = project_members.project_id
      and p.owner_user_id = auth.uid()
  )
);
