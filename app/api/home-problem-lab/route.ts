import { NextResponse } from "next/server";
import { createFiveHomeProblemLabDryRunSamples } from "@/lib/home-problem-lab/dry-run";

export const runtime = "nodejs";

export async function POST() {
  if (process.env.DRY_RUN !== "true") {
    return NextResponse.json({ error: "HOME_PROBLEM_LAB_DRY_RUN_REQUIRED" }, { status: 403 });
  }
  const samples = createFiveHomeProblemLabDryRunSamples();
  return NextResponse.json({
    engineId: "home_problem_lab",
    uploadProfile: "home_problem_lab",
    dryRun: true,
    externalCalls: 0,
    instagramUpload: false,
    youtubeUpload: false,
    credentialFallback: false,
    ttsMode: "mock_preflight_only",
    audioGenerated: false,
    samples,
  });
}
