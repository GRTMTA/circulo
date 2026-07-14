-- Cycle start is now an explicit creator action (see activateCircleAction),
-- gated on a minimum number of members with validated collateral. Accepting an
-- invitation should therefore only validate the member and record the join;
-- it must no longer auto-activate the circle.

create or replace function public.accept_circle_invitation(
  target_circle_id uuid,
  target_notification_id uuid,
  transaction_hash text
)
returns void
language plpgsql
security definer
set search_path = public
as $accept$
declare
  target_member_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(transaction_hash) <> 64
    or transaction_hash ~ '[^0-9a-fA-F]'
  then
    raise exception 'Invalid transaction hash';
  end if;

  if exists (
    select 1 from public.audit_events where tx_hash = transaction_hash
  ) then
    raise exception 'Transaction already recorded';
  end if;

  select id into target_member_id
  from public.circle_members
  where circle_id = target_circle_id
    and profile_id = auth.uid()
    and role = 'member'
    and invite_status = 'invited'
  for update;

  if target_member_id is null then
    raise exception 'No pending invitation found';
  end if;

  update public.circle_members
  set invite_status = 'accepted',
      agreement_status = 'accepted',
      collateral_status = 'posted',
      joined_at = now()
  where id = target_member_id;

  if target_notification_id is not null then
    update public.member_notifications
    set read_at = now()
    where id = target_notification_id
      and circle_id = target_circle_id
      and profile_id = auth.uid();
  end if;

  -- Record the validated join. The creator activates the cycle separately once
  -- enough members have validated collateral.
  insert into public.audit_events (
    circle_id, member_id, event_type, tx_hash, metadata
  ) values (
    target_circle_id,
    target_member_id,
    'collateral_posted',
    transaction_hash,
    jsonb_build_object('collateral', 'posted')
  );
end;
$accept$;
