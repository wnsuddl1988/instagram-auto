import { inflationFactCard } from "@/lib/source-facts/fixtures";
import { assembleContentPackage } from "./assembler";
import type { AssembledContentPackage } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/**
 * Mock assembled content package for the inflation 30s short.
 * Uses the inflation Fact Card fixture and injects a mock audio duration.
 * Expected: finalQa.readyForRender=true.
 */
export const inflationContentPackage30: AssembledContentPackage = assembleContentPackage(
  inflationFactCard,
  {
    videoId: "bp-mock-inflation-cp-30s",
    targetDurationSec: 30,
    createdAt: MOCK_CREATED_AT,
  },
  {
    contentPackageId: "cp-mock-inflation-30s",
    qaRunId: "qa-cp-mock-inflation-30s",
    measuredAudioDurationSec: 28.4,
    createdAt: MOCK_CREATED_AT,
  },
);
