-- Update select policy on profiles to allow all authenticated users to read profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read profiles"
on public.profiles
for select
to authenticated
using (true);
