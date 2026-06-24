import type { VideoBlueprint, VideoBlueprintScene } from "@/lib/blueprints/types";
import { SCRIPT_PACKAGE_SCHEMA_VERSION } from "./types";
import type {
  DurationScript,
  GeneratedScriptPackage,
  ScriptScene,
  ScriptSceneGoal,
  ScriptSceneVisualType,
} from "./types";

export interface ScriptGeneratorOptions {
  packageId?: string;
  /** ISO datetime string for deterministic output. Never call new Date() inside the generator. */
  createdAt?: string;
}

// ─── scene role → goal mapping ──────────────────────────────────────────────

function toSceneGoal(role: string): ScriptSceneGoal {
  switch (role) {
    case "hook":        return "hook";
    case "context":     return "context";
    case "problem":     return "problem";
    case "reason":      return "reason";
    case "structure":   return "structure";
    case "solution":    return "solution";
    case "example":     return "example";
    case "recap":       return "recap";
    case "money_os_cta": return "cta";
    default:            return "context";
  }
}

function toVisualType(role: string, blueprintVisualType: string): ScriptSceneVisualType {
  if (role === "money_os_cta") return "cta_card";
  switch (blueprintVisualType) {
    case "chart_card":  return "chart";
    case "cta_card":    return "cta_card";
    default:            return "number_card";
  }
}

// ─── single DurationScript from Blueprint scenes ─────────────────────────────

function buildDurationScript(
  blueprint: VideoBlueprint,
  targetDurationSec: 15 | 30 | 60,
  scenes: VideoBlueprintScene[],
): DurationScript {
  const scriptScenes: ScriptScene[] = scenes.map((s) => ({
    sceneIndex: s.sceneIndex,
    durationSec: s.estimatedDuration,
    startTimeSec: s.estimatedStartTime,
    sceneGoal: toSceneGoal(s.sceneRole),
    visualType: toVisualType(s.sceneRole, s.visualType),
    visualBrief: s.visualDescription,
    captionText: s.caption,
    narrationText: s.narration,
    sourceNote: s.sourceNote,
    riskNote: null,
    factCardId: s.factCardId,
  }));

  const fullNarration = scriptScenes
    .filter((s) => s.sceneGoal !== "cta")
    .map((s) => s.narrationText)
    .join(" ");

  return {
    targetDurationSec,
    fullNarration,
    scenes: scriptScenes,
  };
}

// ─── SNS copy helpers — all text derived from Blueprint/FactCard fields ──────

function buildYoutubeTitle(blueprint: VideoBlueprint): string {
  // Uses only blueprint.title (which is derived from indicatorName + dataPeriod)
  return `[${blueprint.targetDurationSec}초] ${blueprint.title}`;
}

function buildInstagramCaption(blueprint: VideoBlueprint): string {
  const lines: string[] = [
    blueprint.coreMessage,
    "",
    `📊 ${blueprint.sourceSummary}`,
  ];
  if (blueprint.moneyOsCta) {
    lines.push("", blueprint.moneyOsCta);
  }
  return lines.join("\n");
}

function buildDescription(blueprint: VideoBlueprint): string {
  const refs = blueprint.sourceReferences
    .map((r) => `• ${r.sourceName} (${r.publishedDate}): ${r.sourceUrl}`)
    .join("\n");
  return [
    blueprint.coreMessage,
    "",
    "출처:",
    refs,
    "",
    "※ 이 영상은 특정 종목 투자 권유가 아니며, 데이터 해석에 대한 자세한 판단은 공식 원자료를 확인하세요.",
  ].join("\n");
}

function buildHashtags(blueprint: VideoBlueprint): string[] {
  const base = ["#금융쇼츠", "#경제지표", "#머니쇼츠OS", "#재테크", "#경제공부"];
  // Add indicator-specific tags derived only from blueprint.topic (no invented text)
  const topicTag = `#${blueprint.topic.replace(/[\s/·]+/g, "")}`;
  const tags = [topicTag, ...base];
  // Deduplicate while preserving order
  return [...new Set(tags)];
}

// ─── public generator ─────────────────────────────────────────────────────────

/**
 * Creates a deterministic GeneratedScriptPackage from a VideoBlueprint.
 *
 * Guarantees:
 * - All narration/caption text comes from Blueprint scenes (which are already derived from the FactCard).
 * - No external API, AI, TTS, or render service is called.
 * - factCardIds and sourceCitationIds from the Blueprint are preserved.
 * - `new Date()` is never called; pass options.createdAt for a timestamp.
 */
export function generateScriptPackage(
  blueprint: VideoBlueprint,
  options: ScriptGeneratorOptions = {},
): GeneratedScriptPackage {
  const packageId = options.packageId ?? `pkg-${blueprint.videoId}`;
  const targetDur = blueprint.targetDurationSec;

  // Always include the blueprint's own duration script
  const scripts: DurationScript[] = [
    buildDurationScript(blueprint, targetDur, blueprint.scenes),
  ];

  const pkg: GeneratedScriptPackage = {
    schemaVersion: SCRIPT_PACKAGE_SCHEMA_VERSION,
    packageId,
    blueprintVideoId: blueprint.videoId,
    factCardIds: [...blueprint.factCardIds],
    sourceCitationIds: [...blueprint.sourceCitationIds],
    sourceSummary: blueprint.sourceSummary,
    sourceAttributions: blueprint.sourceReferences.map((r) => ({
      sourceName: r.sourceName,
      sourceUrl: r.sourceUrl,
      publishedDate: r.publishedDate,
      dataPeriod: r.dataPeriod,
    })),
    topic: blueprint.topic,
    title: blueprint.title,
    coreMessage: blueprint.coreMessage,
    scripts,
    youtubeTitle: buildYoutubeTitle(blueprint),
    instagramCaption: buildInstagramCaption(blueprint),
    description: buildDescription(blueprint),
    hashtags: buildHashtags(blueprint),
    moneyOsCta: blueprint.moneyOsCta,
    riskLevel: "unchecked",
  };

  if (options.createdAt !== undefined) {
    pkg.createdAt = options.createdAt;
  }

  return pkg;
}
