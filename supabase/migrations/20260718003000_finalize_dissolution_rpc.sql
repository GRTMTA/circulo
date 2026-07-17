-- Dissolution settlement may be completed by the final voting member, not only the creator.
drop policy if exists "Members can add dissolution events" on public.audit_events;
create policy "Members can add dissolution events"
on public.audit_events
for insert
to authenticated
with check (
  public.is_circle_member(circle_id)
  and event_type in ('delete_proposed', 'delete_voted', 'circle_cancelled', 'collateral_refunded')
);

create or replace function public.reject_circle_dissolution(
  target_circle_id uuid,
  proposal_event_id uuid,
  rejecting_member_id uuid,
  rejection_transaction_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $reject$
begin
  if not exists (
    select 1 from public.circle_members
    where id = rejecting_member_id
      and circle_id = target_circle_id
      and profile_id = auth.uid()
  ) then
    raise exception 'Dissolution voter is not a member of this circle';
  end if;

  update public.audit_events
  set metadata = metadata || jsonb_build_object(
    'status', 'rejected',
    'rejected_by', rejecting_member_id,
    'rejection_tx_hash', rejection_transaction_hash
  )
  where id = proposal_event_id
    and circle_id = target_circle_id
    and event_type = 'delete_proposed'
    and metadata ->> 'status' = 'pending';

  if not found then
    raise exception 'Dissolution proposal is no longer active';
  end if;
end;
$reject$;

grant execute on function public.reject_circle_dissolution(uuid, uuid, uuid, text) to authenticated;

create or replace function public.finalize_circle_dissolution(
  target_circle_id uuid,
  proposal_event_id uuid,
  settlement_transaction_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $finalize$
begin
  if not public.is_circle_member(target_circle_id) then
    raise exception 'Only circle members can finalize dissolution';
  end if;

  update public.circles
  set status = 'cancelled'
  where id = target_circle_id and status = 'active';

  if not found then
    raise exception 'Circle is no longer active';
  end if;

  update public.audit_events
  set metadata = metadata || jsonb_build_object(
    'status', 'approved',
    'settlement_tx_hash', settlement_transaction_hash
  )
  where id = proposal_event_id
    and circle_id = target_circle_id
    and event_type = 'delete_proposed'
    and metadata ->> 'status' = 'pending';

  if not found then
    raise exception 'Dissolution proposal is no longer active';
  end if;
end;
$finalize$;

grant execute on function public.finalize_circle_dissolution(uuid, uuid, text) to authenticated;
