import { createClient, type User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { getIsSupabaseConfigured } from "@/lib/env";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  username: string | null;
  wallet_address: string | null;
  created_at: string;
  updated_at: string;
  onboarding_completed_at: string | null;
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

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dbClient = serviceRoleKey
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : supabase;

  let profile: Profile | null = null;
  const { data, error: selectError } = await dbClient
    .from("profiles")
    .select("id,email,full_name,username,wallet_address,created_at,updated_at,onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle<Profile>();

  profile = data;

  if (selectError) {
    console.error("getOptionalAuthContext - selectError:", selectError.message);
  }

  if (user && !profile) {
    let resolvedUsername = "";
    let attempts = 0;
    while (attempts < 100) {
      const candidate = String(Math.floor(Math.random() * (999999 - 100000 + 1) + 100000));
      const { data: existing, error: existError } = await dbClient
        .from("profiles")
        .select("id")
        .eq("username", candidate)
        .maybeSingle();

      if (existError) {
        console.error("getOptionalAuthContext - existError:", existError.message);
      }

      if (!existing) {
        resolvedUsername = candidate;
        break;
      }
      attempts++;
    }

    const { data: newProfile, error: insertError } = await dbClient
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || null,
        username: resolvedUsername || null,
      })
      .select("id,email,full_name,username,wallet_address,created_at,updated_at,onboarding_completed_at")
      .maybeSingle<Profile>();

    if (insertError) {
      console.error("getOptionalAuthContext - insertError:", insertError.message);
    }

    if (newProfile) {
      profile = newProfile;
      revalidatePath("/", "layout");
    }
  }

  if (profile && (!profile.username || !/^\d{6}$/.test(profile.username))) {
    let resolvedUsername = "";
    let attempts = 0;

    while (attempts < 100) {
      const candidate = String(Math.floor(Math.random() * (999999 - 100000 + 1) + 100000));
      const { data: existing, error: existCheckError } = await dbClient
        .from("profiles")
        .select("id")
        .eq("username", candidate)
        .maybeSingle();

      if (existCheckError) {
        console.error("getOptionalAuthContext - existCheckError:", existCheckError.message);
      }

      if (!existing) {
        resolvedUsername = candidate;
        break;
      }
      attempts++;
    }

    if (resolvedUsername) {
      const { error: updateError } = await dbClient
        .from("profiles")
        .update({ username: resolvedUsername })
        .eq("id", profile.id);

      if (updateError) {
        console.error("getOptionalAuthContext - updateError:", updateError.message);
      } else {
        profile.username = resolvedUsername;
        revalidatePath("/", "layout");
      }
    }
  }

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
