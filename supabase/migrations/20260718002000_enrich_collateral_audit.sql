-- Store the verified member-specific collateral transfer in the audit ledger.
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
  target_wallet text;
  target_payout_round integer;
  target_member_count integer;
  target_cycle_count integer;
  target_contribution numeric;
  target_asset text;
  target_amount numeric;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(transaction_hash) <> 64 or transaction_hash ~ '[^0-9a-fA-F]' then
    raise exception 'Invalid transaction hash';
  end if;

  if exists (select 1 from public.audit_events where tx_hash = transaction_hash) then
    raise exception 'Transaction already recorded';
  end if;

  select cm.id, cm.wallet_address, cm.payout_round,
         c.member_count, c.cycle_count, c.contribution_amount, c.contribution_asset
    into target_member_id, target_wallet, target_payout_round,
         target_member_count, target_cycle_count, target_contribution, target_asset
  from public.circle_members cm
  join public.circles c on c.id = cm.circle_id
  where cm.circle_id = target_circle_id
    and cm.profile_id = auth.uid()
    and cm.role = 'member'
    and cm.invite_status = 'invited'
  for update of cm;

  if target_member_id is null then
    raise exception 'No pending invitation found';
  end if;

  target_amount := greatest(
    0,
    (target_member_count * coalesce(target_cycle_count, 1) - target_payout_round)
      * target_contribution
  );

  update public.circle_members
  set invite_status = 'accepted', agreement_status = 'accepted',
      collateral_status = 'posted', joined_at = now()
  where id = target_member_id;

  if target_notification_id is not null then
    update public.member_notifications
    set read_at = now()
    where id = target_notification_id
      and circle_id = target_circle_id
      and profile_id = auth.uid();
  end if;

  insert into public.audit_events (circle_id, member_id, event_type, tx_hash, metadata)
  values (
    target_circle_id,
    target_member_id,
    'collateral_posted',
    transaction_hash,
    jsonb_build_object(
      'amount', target_amount,
      'asset', target_asset,
      'from_wallet', target_wallet,
      'to_wallet', 'circle_escrow',
      'payer_member_id', target_member_id,
      'role', 'member'
    )
  );
end;
$accept$;
