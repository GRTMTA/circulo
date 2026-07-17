-- Migration: Add delete policies to allow creators to delete their circles and related events/notifications
-- This fixes the issue where the "Delete Circle" action would fail on the backend due to RLS constraint violations.

-- 1. Allow creators to delete their circles
drop policy if exists "Creators can delete own circles" on public.circles;
create policy "Creators can delete own circles"
on public.circles
for delete
to authenticated
using (creator_id = auth.uid());

-- 2. Allow creators to delete audit events associated with their circles
drop policy if exists "Creators can delete circle audit events" on public.audit_events;
create policy "Creators can delete circle audit events"
on public.audit_events
for delete
to authenticated
using (public.is_circle_creator(circle_id));

-- 3. Allow creators to delete member notifications associated with their circles
drop policy if exists "Creators can delete circle notifications" on public.member_notifications;
create policy "Creators can delete circle notifications"
on public.member_notifications
for delete
to authenticated
using (public.is_circle_creator(circle_id));
