import type { GeneratedScriptPackage } from "@/lib/scripts/types";
import { RISK_PATTERNS, maxRiskLevel } from "./patterns";
import { RISK_REVIEW_SCHEMA_VERSION } from "./types";
import type { RiskFinding, RiskReviewResult } from "./types";
import type { RiskLevel } from "@/lib/source-facts/types";

export interface ScanOptions {
  reviewedAt?: string;
}

function scanText(
  text: string,
  field: string,
  findings: RiskFinding[],
): void {
  const lower = text.toLowerCase();
  for (const rule of RISK_PATTERNS) {
    const match = lower.match(rule.pattern);
    if (match) {
      // Extract the original-case matched text using the match index
      const matchedText = text.slice(
        match.index ?? 0,
        (match.index ?? 0) + match[0].length,
      );
      findings.push({
        field,
        code: rule.code,
        riskLevel: rule.riskLevel,
        matchedText,
        message: rule.message,
        saferWording: rule.saferWording,
      });
    }
  }
}

/**
 * Scans a GeneratedScriptPackage for risky financial expressions.
 *
 * - Fully deterministic and local — no external API or AI is called.
 * - Scans: title, youtubeTitle, instagramCaption, description, hashtags,
 *   moneyOsCta, coreMessage, and all per-script narration + per-scene
 *   narrationText and captionText.
 */
export function scanScriptPackage(
  pkg: GeneratedScriptPackage,
  options: ScanOptions = {},
): RiskReviewResult {
  const findings: RiskFinding[] = [];

  // ── Root text fields ───────────────────────────────────────────────────────
  scanText(pkg.title, "title", findings);
  scanText(pkg.youtubeTitle, "youtubeTitle", findings);
  scanText(pkg.instagramCaption, "instagramCaption", findings);
  scanText(pkg.description, "description", findings);
  scanText(pkg.coreMessage, "coreMessage", findings);

  if (pkg.moneyOsCta) {
    scanText(pkg.moneyOsCta, "moneyOsCta", findings);
  }

  // ── Hashtags ───────────────────────────────────────────────────────────────
  pkg.hashtags.forEach((tag, i) => {
    scanText(tag, `hashtags[${i}]`, findings);
  });

  // ── Scripts → scenes ──────────────────────────────────────────────────────
  pkg.scripts.forEach((script, si) => {
    scanText(script.fullNarration, `scripts[${si}].fullNarration`, findings);

    script.scenes.forEach((scene, sci) => {
      scanText(
        scene.narrationText,
        `scripts[${si}].scenes[${sci}].narrationText`,
        findings,
      );
      scanText(
        scene.captionText,
        `scripts[${si}].scenes[${sci}].captionText`,
        findings,
      );
    });
  });

  // ── Aggregate risk level ──────────────────────────────────────────────────
  let overallRiskLevel: RiskLevel = findings.length === 0 ? "low" : "low";
  for (const f of findings) {
    overallRiskLevel = maxRiskLevel(
      overallRiskLevel as Exclude<RiskLevel, "unchecked">,
      f.riskLevel,
    ) as RiskLevel;
  }

  const result: RiskReviewResult = {
    schemaVersion: RISK_REVIEW_SCHEMA_VERSION,
    packageId: pkg.packageId,
    overallRiskLevel,
    findings,
    isBlocked: overallRiskLevel === "blocked",
  };

  if (options.reviewedAt !== undefined) {
    result.reviewedAt = options.reviewedAt;
  }

  return result;
}
