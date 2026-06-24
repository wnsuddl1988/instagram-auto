import {
  inflationScriptPackage30,
  exchangeRateScriptPackage15,
  dartDisclosureScriptPackage60,
} from "@/lib/scripts/fixtures";
import type { GeneratedScriptPackage } from "@/lib/scripts/types";
import type { DurationScript } from "@/lib/scripts/types";

/**
 * Safe fixture packages — expected scan result: overallRiskLevel "low", findings [].
 * These come directly from the blueprint fixtures (clean financial data narrations).
 */
export const SAFE_FIXTURE_PACKAGES: GeneratedScriptPackage[] = [
  inflationScriptPackage30,
  exchangeRateScriptPackage15,
  dartDisclosureScriptPackage60,
];

/**
 * Builds a minimal DurationScript for use in risky fixtures.
 */
function makeRiskyScript(
  targetDurationSec: 30,
  narration: string,
  captionText: string,
): DurationScript {
  return {
    targetDurationSec,
    fullNarration: narration,
    scenes: [
      {
        sceneIndex: 0,
        durationSec: 15,
        startTimeSec: 0,
        sceneGoal: "hook",
        visualType: "number_card",
        visualBrief: "테스트 씬",
        captionText,
        narrationText: narration,
        sourceNote: "테스트 출처",
        riskNote: "",
        factCardId: "fc-risky-test",
      },
    ],
  };
}

/**
 * Risky fixture — contains blocked/high-risk required detection examples:
 * 매수하세요, 무조건 오릅니다, 수익 보장, 급등 확정, 지금 안 사면 늦습니다,
 * 100% 돈 법니다, 이 종목 사면 됩니다
 *
 * Expected scan result: overallRiskLevel "blocked", isBlocked true,
 * findings.length >= 7 (one per required example).
 */
export const RISKY_BLOCKED_PACKAGE: GeneratedScriptPackage = {
  schemaVersion: "money_shorts_script_package_v1",
  packageId: "pkg-risky-blocked-test",
  blueprintVideoId: "vid-risky-test",
  factCardIds: ["fc-risky-test"],
  sourceCitationIds: ["cite-risky-test"],
  sourceSummary: "리스크 스캐너 테스트용 더미 출처",
  sourceAttributions: [
    { sourceName: "테스트 출처", sourceUrl: "https://example.com", publishedDate: "2026-06-25" },
  ],
  topic: "위험한 금융 표현 테스트",
  // required detection: 이 종목 사면 됩니다
  title: "이 종목 사면 됩니다 — 지금 안 사면 늦습니다",
  coreMessage: "수익 보장, 급등 확정 테스트 메시지",
  scripts: [
    makeRiskyScript(
      30,
      // required: 매수하세요, 무조건 오릅니다, 100% 돈 법니다
      "지금 매수하세요! 무조건 오릅니다. 100% 돈 법니다.",
      "급등 확정 — 담아두세요",
    ),
  ],
  // required: 지금 안 사면 늦습니다
  youtubeTitle: "지금 안 사면 늦습니다 | 무조건 오릅니다",
  instagramCaption: "수익 보장 정보 공유합니다 🔥",
  description: "이 영상에 나온 종목은 급등 확정입니다. 매수하세요.",
  hashtags: ["#수익보장", "#급등확정", "#매수하세요"],
  moneyOsCta: "지금 안 사면 늦습니다. 100% 돈 법니다.",
  riskLevel: "unchecked",
};

/**
 * Risky fixture — HIGH level (no blocked patterns, but has high-level expressions).
 * Expected scan result: overallRiskLevel "high", isBlocked false.
 */
export const RISKY_HIGH_PACKAGE: GeneratedScriptPackage = {
  schemaVersion: "money_shorts_script_package_v1",
  packageId: "pkg-risky-high-test",
  blueprintVideoId: "vid-risky-high-test",
  factCardIds: ["fc-risky-test"],
  sourceCitationIds: ["cite-risky-test"],
  sourceSummary: "리스크 스캐너 테스트용 더미 출처",
  sourceAttributions: [
    { sourceName: "테스트 출처", sourceUrl: "https://example.com", publishedDate: "2026-06-25" },
  ],
  topic: "높은 위험 금융 표현 테스트",
  title: "목표 주가 분석",
  coreMessage: "무조건 안전한 투자 방법",
  scripts: [
    makeRiskyScript(
      30,
      "무조건 안전한 자산입니다. 위험 없음.",
      "목표 주가 달성 확실",
    ),
  ],
  youtubeTitle: "목표가 달성 예정 | 리스크 없음",
  instagramCaption: "절대 안전한 투자 상품입니다",
  description: "무조건 오르는 자산. 손해 없음 보장.",
  hashtags: ["#무조건안전", "#목표주가"],
  moneyOsCta: "",
  riskLevel: "unchecked",
};
