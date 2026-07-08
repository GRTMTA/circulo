import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    synced: false,
    message:
      "Placeholder for a serverless cron job that polls Soroban RPC getEvents and refreshes the Supabase cache.",
  });
}
