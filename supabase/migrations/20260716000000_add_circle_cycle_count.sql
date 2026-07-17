-- A cycle is one complete pass through the roster. Existing circles retain
-- their original single-rotation behavior.
alter table public.circles
  add column if not exists cycle_count integer not null default 1
  check (cycle_count between 1 and 12);

-- Existing rows already have total_rounds equal to their member count. Newly
-- created circles persist member_count * cycle_count as total_rounds.
