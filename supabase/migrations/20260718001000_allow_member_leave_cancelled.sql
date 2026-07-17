-- Migration: Allow members to delete their own circle membership record when a circle is cancelled
-- This enables members to remove cancelled circles from their dashboards.

drop policy if exists "Members can leave cancelled circles" on public.circle_members;
create policy "Members can leave cancelled circles"
on public.circle_members
for delete
to authenticated
using (
  profile_id = auth.uid()
  and exists (
    select 1 from public.circles
    where circles.id = circle_members.circle_id
      and circles.status = 'cancelled'
  )
);
