import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";

import { getIsSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

interface OptionalAuthContext {
  configured: boolean;
  user: User | null;
  profile: Profile | null;
}

export function getSafeNextPath(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//") || value.startsWith("/\\") || value.includes("://")) {
    return "/dashboard";
  }

  return value;
}

export async function getOptionalAuthContext(): Promise<OptionalAuthContext> {
  if (!getIsSupabaseConfigured()) {
    return {
      configured: false,
      user: null,
      profile: null,
    };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      configured: true,
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,email,full_name,created_at,updated_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  return {
    configured: true,
    user,
    profile: profile ?? null,
  };
}

export async function redirectAuthenticatedUserHome() {
  const context = await getOptionalAuthContext();

  if (context.user) {
    redirect("/dashboard");
  }
}

export async function requireAuthenticatedUser(nextPath = "/dashboard") {
  const context = await getOptionalAuthContext();

  if (!context.configured) {
    return context;
  }

  if (!context.user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return context;
}
