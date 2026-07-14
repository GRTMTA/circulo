create unique index if not exists audit_events_tx_hash_unique
on public.audit_events (tx_hash)
where tx_hash is not null;

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
  all_accepted boolean;
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

  select bool_and(invite_status = 'accepted') into all_accepted
  from public.circle_members
  where circle_id = target_circle_id;

  if coalesce(all_accepted, false) then
    update public.circles
    set status = 'active',
        current_round = 1,
        start_date = coalesce(start_date, now())
    where id = target_circle_id
      and status = 'draft';

    insert into public.audit_events (
      circle_id, member_id, event_type, tx_hash, metadata
    ) values (
      target_circle_id,
      target_member_id,
      'circle_activated',
      transaction_hash,
      jsonb_build_object('reason', 'All participants accepted')
    );
  else
    insert into public.audit_events (
      circle_id, member_id, event_type, tx_hash, metadata
    ) values (
      target_circle_id,
      target_member_id,
      'member_joined',
      transaction_hash,
      jsonb_build_object('collateral', 'posted')
    );
  end if;
end;
$accept$;

revoke all on function public.accept_circle_invitation(uuid, uuid, text) from public;
grant execute on function public.accept_circle_invitation(uuid, uuid, text) to authenticated;