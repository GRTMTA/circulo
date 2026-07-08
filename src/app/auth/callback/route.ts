import { type NextRequest, NextResponse } from "next/server";

import { getIsSupabaseConfigured } from "@/lib/env";
import { getSafeNextPath } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const nextPath = getSafeNextPath(requestUrl.searchParams.get("next"));

  if (!getIsSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const supabase = await createServerSupabaseClient();

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  } else if (tokenHash && (type === "signup" || type === "recovery")) {
    await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
  }

  return NextResponse.redirect(new URL(nextPath, request.url));
}
