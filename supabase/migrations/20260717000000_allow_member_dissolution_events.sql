-- Migration: Allow circle members to insert dissolution-related audit events
-- This enables the democratic deletion voting flow where any member can propose
-- and vote on circle dissolution.

-- Allow members to insert audit events for dissolution votes
drop policy if exists "Members can add dissolution events" on public.audit_events;
create policy "Members can add dissolution events"
on public.audit_events
for insert
to authenticated
with check (
  public.is_circle_member(circle_id)
  and event_type in ('delete_proposed', 'delete_voted')
);
