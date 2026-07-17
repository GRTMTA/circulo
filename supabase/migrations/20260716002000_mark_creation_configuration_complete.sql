-- The creation wizard already persists the contribution settings and payout
-- order. Mark existing draft circles as configuration-complete so they do not
-- remain blocked by legacy false lock flags in the activation gate.
update public.circles
set
  settings_locked = true,
  payout_order_locked = true,
  rules_locked = true
where status = 'draft';
