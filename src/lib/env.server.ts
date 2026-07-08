import "server-only";

export function getServerEnv() {
  return {
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  };
}

export function getHasSupabaseServiceRole() {
  return Boolean(getServerEnv().supabaseServiceRoleKey);
}
