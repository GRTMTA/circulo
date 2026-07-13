-- Add missing onboarding_completed_at column to profiles table
alter table public.profiles add column if not exists onboarding_completed_at timestamptz;
