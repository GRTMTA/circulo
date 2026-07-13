-- Add username and wallet_address columns to profiles table
alter table public.profiles add column if not exists username text unique;
alter table public.profiles add column if not exists wallet_address text;

-- Create index for fast lookups by username
create index if not exists profiles_username_idx on public.profiles (username);

-- Update the new user trigger function to automatically generate a unique username
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_email_prefix text;
  v_suffix integer := 0;
begin
  -- Extract email prefix
  v_email_prefix := split_part(new.email, '@', 1);
  -- Clean prefix to be safe for usernames (alphanumeric and underscores only)
  v_email_prefix := regexp_replace(v_email_prefix, '[^a-zA-Z0-9_]', '', 'g');
  if v_email_prefix = '' then
    v_email_prefix := 'user';
  end if;

  v_username := v_email_prefix;
  
  -- Loop until we find a unique username
  while exists(select 1 from public.profiles where username = v_username) loop
    v_suffix := v_suffix + 1;
    v_username := v_email_prefix || v_suffix::text;
  end loop;

  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    v_username
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name);

  return new;
end;
$$;

-- Run a one-time migration to assign unique usernames to all existing profiles
do $$
declare
  r record;
  v_email_prefix text;
  v_username text;
  v_suffix integer;
begin
  for r in select id, email from public.profiles where username is null loop
    v_email_prefix := regexp_replace(split_part(r.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g');
    if v_email_prefix = '' then
      v_email_prefix := 'user';
    end if;
    v_username := v_email_prefix;
    v_suffix := 0;
    while exists(select 1 from public.profiles where username = v_username) loop
      v_suffix := v_suffix + 1;
      v_username := v_email_prefix || v_suffix::text;
    end loop;
    update public.profiles set username = v_username where id = r.id;
  end loop;
end;
$$;
