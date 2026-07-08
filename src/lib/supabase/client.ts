"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabaseConfig, env } from "@/lib/env";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

export function createBrowserSupabaseClient() {
  assertSupabaseConfig();

  if (!browserClient) {
    browserClient = createBrowserClient(
      env.supabaseUrl,
      env.supabasePublishableKey
    );
  }

  return browserClient;
}
