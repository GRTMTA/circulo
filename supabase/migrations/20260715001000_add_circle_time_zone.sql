-- A named IANA timezone keeps all circle members aligned on one schedule,
-- even when their devices are set to different local timezones.
alter table public.circles
  add column if not exists time_zone text not null default 'Asia/Manila';
