-- Add policy and tracking fields to existing tables

-- =============================================================================
-- circles: add governance/policy columns + allow 'paused' status
-- =============================================================================

alter table public.circles
  add column if not exists max_member_count         integer            not null default 20,
  add column if not exists grace_period_hours        integer            not null default 4,
  add column if not exists slash_percentage          integer            not null default 100,
  add column if not exists warning_threshold         integer            not null default 2,
  add column if not exists auto_slash_enabled        boolean            not null default true,
  add column if not exists payout_order_mode         text               not null default 'creator',
  add column if not exists reminder_schedule_hours   integer[]          not null default '{24,1}';

alter table public.circles
  add constraint circles_payout_order_mode_check
  check (payout_order_mode in ('creator', 'voting'));

-- expand status check to include 'paused'
do $$
begin
  alter table public.circles drop constraint if exists circles_status_check;
exception
  when undefined_object then null;
end $$;

alter table public.circles
  add constraint circles_status_check
  check (status in ('draft', 'active', 'paused', 'delayed', 'completed', 'disputed', 'cancelled'));

-- =============================================================================
-- circle_members: add tracking fields
-- =============================================================================

alter table public.circle_members
  add column if not exists late_count       integer            not null default 0,
  add column if not exists slashed_amount   numeric(18, 7)     not null default 0,
  add column if not exists joined_at        timestamptz;

-- =============================================================================
-- circle_contributions: add slash and reminder tracking
-- =============================================================================

alter table public.circle_contributions
  add column if not exists slashed_amount   numeric(18, 7)     not null default 0,
  add column if not exists slashed_at       timestamptz,
  add column if not exists reminders_sent   integer            not null default 0;

-- =============================================================================
-- payout_schedule: add amount tracking
-- =============================================================================

alter table public.payout_schedule
  add column if not exists payout_amount    numeric(18, 7)     not null default 0,
  add column if not exists withheld_amount  numeric(18, 7)     not null default 0;
