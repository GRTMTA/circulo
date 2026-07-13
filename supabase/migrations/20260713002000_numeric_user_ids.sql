-- Redefine public.handle_new_user() trigger to generate 6-digit numeric User IDs
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  -- Generate a random 6-digit number between 100000 and 999999
  v_username := floor(random() * (999999 - 100000 + 1) + 100000)::text;
  
  -- Loop until we find a unique username
  while exists(select 1 from public.profiles where username = v_username) loop
    v_username := floor(random() * (999999 - 100000 + 1) + 100000)::text;
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
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    -- Backfill username if it's currently null
    username = coalesce(public.profiles.username, excluded.username);

  return new;
end;
$$;
