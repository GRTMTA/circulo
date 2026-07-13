-- Redefine public.handle_new_user() trigger to use full_name for username generation
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_name_prefix text;
  v_suffix integer := 0;
begin
  -- Extract name from metadata first, fallback to email prefix
  v_name_prefix := coalesce(
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    split_part(new.email, '@', 1)
  );
  -- Replace spaces with underscores
  v_name_prefix := replace(v_name_prefix, ' ', '_');
  -- Clean to be lowercase alphanumeric and underscores only
  v_name_prefix := lower(regexp_replace(v_name_prefix, '[^a-zA-Z0-9_]', '', 'g'));
  if v_name_prefix = '' then
    v_name_prefix := 'user';
  end if;

  v_username := v_name_prefix;
  
  -- Loop until we find a unique username
  while exists(select 1 from public.profiles where username = v_username) loop
    v_suffix := v_suffix + 1;
    v_username := v_name_prefix || v_suffix::text;
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
