import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "circulo",
    sourceOfTruth: "soroban-contract",
  });
}
