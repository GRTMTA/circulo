create table if not exists public.circles (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'delayed', 'completed', 'disputed', 'cancelled')),
  contribution_amount numeric(18, 7) not null default 0,
  contribution_asset text not null default 'USDC',
  interval_seconds integer not null default 86400,
  member_count integer not null default 0,
  collateral_amount numeric(18, 7) not null default 0,
  current_round integer not null default 1,
  total_rounds integer not null default 1,
  start_date timestamptz,
  settings_locked boolean not null default false,
  payout_order_locked boolean not null default false,
  rules_locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.circle_members (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  display_name text not null,
  wallet_address text not null,
  role text not null default 'member' check (role in ('creator', 'member')),
  invite_status text not null default 'invited' check (invite_status in ('invited', 'accepted', 'declined', 'expired')),
  agreement_status text not null default 'pending' check (agreement_status in ('accepted', 'pending')),
  collateral_status text not null default 'not_posted' check (collateral_status in ('not_posted', 'posted', 'partially_slashed', 'fully_slashed')),
  payment_status text not null default 'pending' check (payment_status in ('paid', 'pending', 'late', 'missed', 'not_due', 'disputed')),
  payout_round integer not null default 1,
  restriction_status text not null default 'clear' check (restriction_status in ('clear', 'warning', 'restricted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, wallet_address)
);

create table if not exists public.circle_rounds (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  round_number integer not null,
  due_at timestamptz,
  payout_member_id uuid references public.circle_members(id) on delete set null,
  expected_amount numeric(18, 7) not null default 0,
  collected_amount numeric(18, 7) not null default 0,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'late', 'grace_period', 'paid', 'delayed', 'disputed', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, round_number)
);

create table if not exists public.circle_contributions (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  round_id uuid not null references public.circle_rounds(id) on delete cascade,
  member_id uuid not null references public.circle_members(id) on delete cascade,
  amount_due numeric(18, 7) not null default 0,
  status text not null default 'pending' check (status in ('not_due', 'due_soon', 'due_now', 'verifying', 'paid', 'pending', 'late', 'grace_period', 'missed', 'disputed')),
  tx_hash text,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (round_id, member_id)
);

create table if not exists public.payout_schedule (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  round_number integer not null,
  recipient_member_id uuid references public.circle_members(id) on delete set null,
  expected_payout_at timestamptz,
  status text not null default 'scheduled' check (status in ('scheduled', 'ready', 'paid', 'delayed', 'disputed')),
  tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (circle_id, round_number)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  member_id uuid references public.circle_members(id) on delete set null,
  event_type text not null,
  round_number integer,
  tx_hash text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.member_notifications (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  member_id uuid references public.circle_members(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_rounds enable row level security;
alter table public.circle_contributions enable row level security;
alter table public.payout_schedule enable row level security;
alter table public.audit_events enable row level security;
alter table public.member_notifications enable row level security;

create or replace function public.is_circle_creator(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circles c
    where c.id = target_circle_id
      and c.creator_id = auth.uid()
  );
$$;

create or replace function public.is_circle_member(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_members cm
    where cm.circle_id = target_circle_id
      and cm.profile_id = auth.uid()
  );
$$;

create or replace function public.can_read_circle(target_circle_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.is_circle_creator(target_circle_id)
    or public.is_circle_member(target_circle_id);
$$;

drop trigger if exists set_circles_updated_at on public.circles;
create trigger set_circles_updated_at
before update on public.circles
for each row
execute function public.set_updated_at();

drop trigger if exists set_circle_members_updated_at on public.circle_members;
create trigger set_circle_members_updated_at
before update on public.circle_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_circle_rounds_updated_at on public.circle_rounds;
create trigger set_circle_rounds_updated_at
before update on public.circle_rounds
for each row
execute function public.set_updated_at();

drop trigger if exists set_circle_contributions_updated_at on public.circle_contributions;
create trigger set_circle_contributions_updated_at
before update on public.circle_contributions
for each row
execute function public.set_updated_at();

drop trigger if exists set_payout_schedule_updated_at on public.payout_schedule;
create trigger set_payout_schedule_updated_at
before update on public.payout_schedule
for each row
execute function public.set_updated_at();

drop policy if exists "Creators and members can read circles" on public.circles;
create policy "Creators and members can read circles"
on public.circles
for select
to authenticated
using (creator_id = auth.uid() or public.is_circle_member(id));

drop policy if exists "Creators can create circles" on public.circles;
create policy "Creators can create circles"
on public.circles
for insert
to authenticated
with check (creator_id = auth.uid());

drop policy if exists "Creators can update own circles" on public.circles;
create policy "Creators can update own circles"
on public.circles
for update
to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "Creators and members can read circle members" on public.circle_members;
create policy "Creators and members can read circle members"
on public.circle_members
for select
to authenticated
using (public.can_read_circle(circle_id));

drop policy if exists "Creators can manage circle members" on public.circle_members;
create policy "Creators can manage circle members"
on public.circle_members
for all
to authenticated
using (public.is_circle_creator(circle_id))
with check (public.is_circle_creator(circle_id));

drop policy if exists "Circle participants can read rounds" on public.circle_rounds;
create policy "Circle participants can read rounds"
on public.circle_rounds
for select
to authenticated
using (public.can_read_circle(circle_id));

drop policy if exists "Creators can manage rounds" on public.circle_rounds;
create policy "Creators can manage rounds"
on public.circle_rounds
for all
to authenticated
using (public.is_circle_creator(circle_id))
with check (public.is_circle_creator(circle_id));

drop policy if exists "Creators and owners can read contributions" on public.circle_contributions;
create policy "Creators and owners can read contributions"
on public.circle_contributions
for select
to authenticated
using (public.can_read_circle(circle_id));

drop policy if exists "Creators can manage contributions" on public.circle_contributions;
create policy "Creators can manage contributions"
on public.circle_contributions
for all
to authenticated
using (public.is_circle_creator(circle_id))
with check (public.is_circle_creator(circle_id));

drop policy if exists "Circle participants can read payout schedule" on public.payout_schedule;
create policy "Circle participants can read payout schedule"
on public.payout_schedule
for select
to authenticated
using (public.can_read_circle(circle_id));

drop policy if exists "Creators can manage payout schedule" on public.payout_schedule;
create policy "Creators can manage payout schedule"
on public.payout_schedule
for all
to authenticated
using (public.is_circle_creator(circle_id))
with check (public.is_circle_creator(circle_id));

drop policy if exists "Circle participants can read audit events" on public.audit_events;
create policy "Circle participants can read audit events"
on public.audit_events
for select
to authenticated
using (public.can_read_circle(circle_id));

drop policy if exists "Creators can add audit events" on public.audit_events;
create policy "Creators can add audit events"
on public.audit_events
for insert
to authenticated
with check (public.is_circle_creator(circle_id));

drop policy if exists "Members can read own notifications" on public.member_notifications;
create policy "Members can read own notifications"
on public.member_notifications
for select
to authenticated
using (profile_id = auth.uid() or public.is_circle_creator(circle_id));

drop policy if exists "Members can update own notifications" on public.member_notifications;
create policy "Members can update own notifications"
on public.member_notifications
for update
to authenticated
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

drop policy if exists "Creators can create notifications" on public.member_notifications;
create policy "Creators can create notifications"
on public.member_notifications
for insert
to authenticated
with check (public.is_circle_creator(circle_id));
