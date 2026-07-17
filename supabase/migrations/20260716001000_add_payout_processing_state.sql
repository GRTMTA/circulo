-- Server-side payout execution needs explicit processing and retry state so a
-- cron worker cannot submit the same round concurrently or silently lose a
-- failed submission.
alter table public.payout_schedule
  add column if not exists attempt_count integer not null default 0,
  add column if not exists processing_token text,
  add column if not exists last_error text,
  add column if not exists submitted_at timestamptz,
  add column if not exists processed_at timestamptz;

alter table public.payout_schedule
  drop constraint if exists payout_schedule_status_check;

alter table public.payout_schedule
  add constraint payout_schedule_status_check
  check (status in ('scheduled', 'ready', 'processing', 'paid', 'delayed', 'failed', 'disputed'));

create unique index if not exists payout_schedule_processing_token_idx
  on public.payout_schedule (processing_token)
  where processing_token is not null;
