import cutlineData from "./editorial-cutline-data.json";

export const CUTLINE_CONFIG_VERSION = "1.0.0";

export type EvidenceKind = "news" | "statistic" | "policy" | "background";

export type HookType =
  | "real_reason"
  | "info_gap"
  | "named_mistake"
  | "myth_bust"
  | "direct_callout";

export type BannedPhraseCategory =
  | "guarantee"
  | "profitImplication"
  | "fearMongering"
  | "benefitOverreach";

export type CutlineConfig = {
  version: string;
  hardCut: {
    hookMaxWords: number;
    hookMaxChars: number;
    requireTemporalToken: boolean;
    requireProperNoun: boolean;
    requireDisclaimer: boolean;
  };
  freshnessWindows: {
    news: number;
    policy: number;
    statisticMaxDays: number;
    background: null;
  };
  score: {
    maxScore: number;
    passThreshold: number;
    statisticOnlyTimelinessCap: number;
  };
  bannedPhrases: Record<BannedPhraseCategory, readonly string[]>;
  conditionalPhrases: readonly {
    phrase: string;
    condition: string;
    note: string;
  }[];
  temporalTokens: readonly string[];
  allowedHookTypes: readonly HookType[];
  disclaimerText: string;
  sceneStructure: readonly { scene: number; role: string }[];
  durationSeconds: { min: number; max: number };
};

export class CutlineConfigError extends Error {
  constructor(message: string) {
    super(`editorial cutline config invalid: ${message}`);
    this.name = "CutlineConfigError";
  }
}

const BANNED_CATEGORIES: readonly BannedPhraseCategory[] = [
  "guarantee",
  "profitImplication",
  "fearMongering",
  "benefitOverreach",
];

const HOOK_TYPES: readonly HookType[] = [
  "real_reason",
  "info_gap",
  "named_mistake",
  "myth_bust",
  "direct_callout",
];

function requirePositiveInt(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new CutlineConfigError(`${field} must be a positive integer`);
  }
  return value;
}

function requireNonEmptyStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CutlineConfigError(`${field} must be a non-empty array`);
  }
  return value.map((entry, index) => {
    if (typeof entry !== "string" || entry.trim() === "") {
      throw new CutlineConfigError(`${field}[${index}] must be a non-empty string`);
    }
    return entry;
  });
}

/**
 * Fails closed: a malformed config throws instead of falling back to defaults,
 * so the cutline can never be silently disabled.
 */
export function parseCutlineConfig(raw: unknown): CutlineConfig {
  if (typeof raw !== "object" || raw === null) {
    throw new CutlineConfigError("root must be an object");
  }
  const root = raw as Record<string, unknown>;

  if (root.version !== CUTLINE_CONFIG_VERSION) {
    throw new CutlineConfigError(
      `version mismatch: expected ${CUTLINE_CONFIG_VERSION}, got ${String(root.version)}`,
    );
  }

  const hardCutRaw = root.hardCut;
  if (typeof hardCutRaw !== "object" || hardCutRaw === null) {
    throw new CutlineConfigError("hardCut must be an object");
  }
  const hc = hardCutRaw as Record<string, unknown>;
  for (const flag of ["requireTemporalToken", "requireProperNoun", "requireDisclaimer"]) {
    if (typeof hc[flag] !== "boolean") {
      throw new CutlineConfigError(`hardCut.${flag} must be a boolean`);
    }
  }
  const hardCut = {
    hookMaxWords: requirePositiveInt(hc.hookMaxWords, "hardCut.hookMaxWords"),
    hookMaxChars: requirePositiveInt(hc.hookMaxChars, "hardCut.hookMaxChars"),
    requireTemporalToken: hc.requireTemporalToken as boolean,
    requireProperNoun: hc.requireProperNoun as boolean,
    requireDisclaimer: hc.requireDisclaimer as boolean,
  };

  const fwRaw = root.freshnessWindows;
  if (typeof fwRaw !== "object" || fwRaw === null) {
    throw new CutlineConfigError("freshnessWindows must be an object");
  }
  const fw = fwRaw as Record<string, unknown>;
  if (fw.background !== null) {
    throw new CutlineConfigError("freshnessWindows.background must be null");
  }
  const freshnessWindows = {
    news: requirePositiveInt(fw.news, "freshnessWindows.news"),
    policy: requirePositiveInt(fw.policy, "freshnessWindows.policy"),
    statisticMaxDays: requirePositiveInt(
      fw.statisticMaxDays,
      "freshnessWindows.statisticMaxDays",
    ),
    background: null as null,
  };

  const scoreRaw = root.score;
  if (typeof scoreRaw !== "object" || scoreRaw === null) {
    throw new CutlineConfigError("score must be an object");
  }
  const sc = scoreRaw as Record<string, unknown>;
  const score = {
    maxScore: requirePositiveInt(sc.maxScore, "score.maxScore"),
    passThreshold: requirePositiveInt(sc.passThreshold, "score.passThreshold"),
    statisticOnlyTimelinessCap: requirePositiveInt(
      sc.statisticOnlyTimelinessCap,
      "score.statisticOnlyTimelinessCap",
    ),
  };
  if (score.passThreshold > score.maxScore) {
    throw new CutlineConfigError("score.passThreshold cannot exceed score.maxScore");
  }

  const bannedRaw = root.bannedPhrases;
  if (typeof bannedRaw !== "object" || bannedRaw === null) {
    throw new CutlineConfigError("bannedPhrases must be an object");
  }
  const banned = bannedRaw as Record<string, unknown>;
  const bannedPhrases = {} as Record<BannedPhraseCategory, readonly string[]>;
  for (const category of BANNED_CATEGORIES) {
    bannedPhrases[category] = requireNonEmptyStrings(
      banned[category],
      `bannedPhrases.${category}`,
    );
  }

  if (!Array.isArray(root.conditionalPhrases)) {
    throw new CutlineConfigError("conditionalPhrases must be an array");
  }
  const conditionalPhrases = root.conditionalPhrases.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new CutlineConfigError(`conditionalPhrases[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    for (const field of ["phrase", "condition", "note"]) {
      if (typeof e[field] !== "string" || (e[field] as string).trim() === "") {
        throw new CutlineConfigError(
          `conditionalPhrases[${index}].${field} must be a non-empty string`,
        );
      }
    }
    return {
      phrase: e.phrase as string,
      condition: e.condition as string,
      note: e.note as string,
    };
  });

  const temporalTokens = requireNonEmptyStrings(root.temporalTokens, "temporalTokens");

  const allowedHookTypesRaw = requireNonEmptyStrings(
    root.allowedHookTypes,
    "allowedHookTypes",
  );
  const allowedHookTypes = allowedHookTypesRaw.map((value) => {
    if (!HOOK_TYPES.includes(value as HookType)) {
      throw new CutlineConfigError(`allowedHookTypes contains unknown type: ${value}`);
    }
    return value as HookType;
  });

  if (typeof root.disclaimerText !== "string" || root.disclaimerText.trim() === "") {
    throw new CutlineConfigError("disclaimerText must be a non-empty string");
  }

  if (!Array.isArray(root.sceneStructure) || root.sceneStructure.length === 0) {
    throw new CutlineConfigError("sceneStructure must be a non-empty array");
  }
  const sceneStructure = root.sceneStructure.map((entry, index) => {
    if (typeof entry !== "object" || entry === null) {
      throw new CutlineConfigError(`sceneStructure[${index}] must be an object`);
    }
    const e = entry as Record<string, unknown>;
    const scene = requirePositiveInt(e.scene, `sceneStructure[${index}].scene`);
    if (scene !== index + 1) {
      throw new CutlineConfigError(
        `sceneStructure[${index}].scene must be ${index + 1}, got ${scene}`,
      );
    }
    if (typeof e.role !== "string" || e.role.trim() === "") {
      throw new CutlineConfigError(`sceneStructure[${index}].role must be a non-empty string`);
    }
    return { scene, role: e.role };
  });

  const durationRaw = root.durationSeconds;
  if (typeof durationRaw !== "object" || durationRaw === null) {
    throw new CutlineConfigError("durationSeconds must be an object");
  }
  const dr = durationRaw as Record<string, unknown>;
  const durationSeconds = {
    min: requirePositiveInt(dr.min, "durationSeconds.min"),
    max: requirePositiveInt(dr.max, "durationSeconds.max"),
  };
  if (durationSeconds.min > durationSeconds.max) {
    throw new CutlineConfigError("durationSeconds.min cannot exceed durationSeconds.max");
  }

  return {
    version: root.version,
    hardCut,
    freshnessWindows,
    score,
    bannedPhrases,
    conditionalPhrases,
    temporalTokens,
    allowedHookTypes,
    disclaimerText: root.disclaimerText,
    sceneStructure,
    durationSeconds,
  };
}

export function loadCutlineConfig(): CutlineConfig {
  return parseCutlineConfig(cutlineData);
}

export function getFreshnessWindowDays(
  config: CutlineConfig,
  kind: EvidenceKind,
): number | null {
  switch (kind) {
    case "news":
      return config.freshnessWindows.news;
    case "policy":
      return config.freshnessWindows.policy;
    case "statistic":
      return config.freshnessWindows.statisticMaxDays;
    case "background":
      return null;
  }
}

export function collectBannedPhraseHits(
  config: CutlineConfig,
  text: string,
): { category: BannedPhraseCategory; phrase: string }[] {
  const hits: { category: BannedPhraseCategory; phrase: string }[] = [];
  for (const category of BANNED_CATEGORIES) {
    for (const phrase of config.bannedPhrases[category]) {
      if (text.includes(phrase)) hits.push({ category, phrase });
    }
  }
  return hits;
}

export function hasTemporalToken(config: CutlineConfig, text: string): boolean {
  return config.temporalTokens.some((token) => text.includes(token));
}
