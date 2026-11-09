import { NextResponse } from "next/server";
import { evaluateLegacyExternalRouteHardBlock } from "@/lib/legacy-external-route-hard-block";

export function POST() {
  const blocked = evaluateLegacyExternalRouteHardBlock("/api/generate");
  return NextResponse.json(blocked.body, {
    status: blocked.status,
    headers: { "Cache-Control": "no-store" },
  });
}
