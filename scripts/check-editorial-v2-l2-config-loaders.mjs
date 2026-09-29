// L2-1 검증: 커트라인 설정 + 출처 레지스트리 로더
//
// 검증 항목
//   1. tsc 타입체크
//   2. 정상 설정이 로드되는가
//   3. 망가진 설정이 조용히 통과하지 않는가 (fail-closed)
//   4. 출처 티어 판정 / 고유명사 / 금칙어 동작

import { existsSync } from "node:fs";
import path from "node:path";
import { runTsProbe, typecheck } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const failures = [];
const passes = [];

function check(label, fn) {
  try {
    fn();
    passes.push(label);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function expectThrow(fn, mustInclude) {
  let threw = null;
  try {
    fn();
  } catch (error) {
    threw = error;
  }
  if (!threw) throw new Error(`expected throw, got none (${mustInclude})`);
  if (!threw.message.includes(mustInclude)) {
    throw new Error(`expected message to include "${mustInclude}", got "${threw.message}"`);
  }
}

const TARGET_FILES = [
  "lib/editorial-v2/editorial-cutline.ts",
  "lib/editorial-v2/editorial-cutline-data.json",
  "lib/editorial-v2/economic-source-registry.ts",
  "lib/editorial-v2/economic-source-registry-data.json",
];

// --- 1. 파일 존재 -----------------------------------------------------------
check("target files exist", () => {
  for (const file of TARGET_FILES) {
    assert(existsSync(path.join(ROOT, file)), `missing ${file}`);
  }
});

// --- 2. 타입체크 ------------------------------------------------------------
check("typecheck passes", () => {
  typecheck(ROOT, [
    "lib/editorial-v2/editorial-cutline.ts",
    "lib/editorial-v2/economic-source-registry.ts",
  ]);
});

// --- 런타임 검증용 로드 (tsx 경유) ------------------------------------------
const probe = `
import {
  loadCutlineConfig, parseCutlineConfig, CutlineConfigError,
  collectBannedPhraseHits, hasTemporalToken, getFreshnessWindowDays,
} from "./editorial-cutline.js";
import {
  loadSourceRegistry, parseSourceRegistry, SourceRegistryError,
  resolvePublisherTier, findProperNouns, getEnabledTopicDomains, getTopicDomain,
} from "./economic-source-registry.js";
import cutlineData from "./editorial-cutline-data.json";
import registryData from "./economic-source-registry-data.json";

const results: Record<string, any> = {};
const clone = (value: any) => JSON.parse(JSON.stringify(value));

const cutline = loadCutlineConfig();
results.cutlineVersion = cutline.version;
results.passThreshold = cutline.score.passThreshold;
results.newsWindow = getFreshnessWindowDays(cutline, "news");
results.statWindow = getFreshnessWindowDays(cutline, "statistic");
results.backgroundWindow = getFreshnessWindowDays(cutline, "background");
results.sceneCount = cutline.sceneStructure.length;

results.bannedHit = collectBannedPhraseHits(cutline, "이건 무조건 오릅니다").map((h) => h.phrase);
results.bannedClean = collectBannedPhraseHits(cutline, "금리가 동결됐습니다").length;
results.benefitOverreach = collectBannedPhraseHits(cutline, "전 국민 누구나 받는다").length;
results.temporalYes = hasTemporalToken(cutline, "오늘 발표된 내용");
results.temporalNo = hasTemporalToken(cutline, "금리는 중요합니다");

// fail-closed
const badVersion = clone(cutlineData); badVersion.version = "9.9.9";
try { parseCutlineConfig(badVersion); results.badVersion = "NO_THROW"; }
catch (e) { results.badVersion = e instanceof CutlineConfigError ? "THREW" : "WRONG_TYPE"; }

const badThreshold = clone(cutlineData); badThreshold.score.passThreshold = 999;
try { parseCutlineConfig(badThreshold); results.badThreshold = "NO_THROW"; }
catch { results.badThreshold = "THREW"; }

const emptyBanned = clone(cutlineData); emptyBanned.bannedPhrases.guarantee = [];
try { parseCutlineConfig(emptyBanned); results.emptyBanned = "NO_THROW"; }
catch { results.emptyBanned = "THREW"; }

const badScene = clone(cutlineData); badScene.sceneStructure[2].scene = 7;
try { parseCutlineConfig(badScene); results.badScene = "NO_THROW"; }
catch { results.badScene = "THREW"; }

try { parseCutlineConfig(null); results.nullCutline = "NO_THROW"; }
catch { results.nullCutline = "THREW"; }

// registry
const registry = loadSourceRegistry();
results.registryVersion = registry.version;
results.t1Count = registry.publishers.T1.length;
results.t2Count = registry.publishers.T2.length;
results.enabledDomains = getEnabledTopicDomains(registry).map((d) => d.id);
results.allDomains = registry.topicDomains.map((d) => d.id);

results.tierBok = resolvePublisherTier(registry, "https://www.bok.or.kr/portal/main/main.do");
results.tierYna = resolvePublisherTier(registry, "https://www.yna.co.kr/view/AKR123");
results.tierSub = resolvePublisherTier(registry, "https://imnews.imbc.com/news/2026/econo/article.html");
results.tierUnknown = resolvePublisherTier(registry, "https://some-random-blog.tistory.com/123");
results.tierMalformed = resolvePublisherTier(registry, "not a url at all");

results.properNouns = findProperNouns(registry, "리볼빙 수수료와 국민연금 수령액을 확인하세요");
results.properNounsNone = findProperNouns(registry, "돈을 아끼는 방법");

const living = getTopicDomain(registry, "living_finance");
results.livingEnabled = living?.enabled ?? null;
results.livingConnectors = living ? [...living.connectors] : null;
const insurance = getTopicDomain(registry, "insurance");
results.insuranceEnabled = insurance?.enabled ?? null;
results.insuranceBlocked = Boolean(insurance?.blockedReason);

// registry fail-closed
const badConnectorRef = clone(registryData);
badConnectorRef.topicDomains[0].connectors = ["does_not_exist"];
try { parseSourceRegistry(badConnectorRef); results.badConnectorRef = "NO_THROW"; }
catch (e) { results.badConnectorRef = e instanceof SourceRegistryError ? "THREW" : "WRONG_TYPE"; }

const dupDomain = clone(registryData);
dupDomain.publishers.T2.push({ name: "중복매체", domains: ["yna.co.kr"] });
try { parseSourceRegistry(dupDomain); results.dupDomain = "NO_THROW"; }
catch { results.dupDomain = "THREW"; }

const dupConnector = clone(registryData);
dupConnector.connectors.push({ ...dupConnector.connectors[0] });
try { parseSourceRegistry(dupConnector); results.dupConnector = "NO_THROW"; }
catch { results.dupConnector = "THREW"; }

const disabledNoReason = clone(registryData);
const target = disabledNoReason.topicDomains.find((d: any) => !d.enabled);
delete target.blockedReason;
try { parseSourceRegistry(disabledNoReason); results.disabledNoReason = "NO_THROW"; }
catch { results.disabledNoReason = "THREW"; }

const unknownPublisher = clone(registryData);
unknownPublisher.connectors[0].publisherName = "존재하지않는기관";
try { parseSourceRegistry(unknownPublisher); results.unknownPublisher = "NO_THROW"; }
catch { results.unknownPublisher = "THREW"; }

process.stdout.write(JSON.stringify(results));
`;

let runtime = null;
check("runtime probe executes", () => {
  runtime = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
  });
});

if (runtime) {
  check("cutline loads with expected values", () => {
    assert(runtime.cutlineVersion === "1.0.0", `version ${runtime.cutlineVersion}`);
    assert(runtime.passThreshold === 14, `passThreshold ${runtime.passThreshold}`);
    assert(runtime.sceneCount === 8, `sceneCount ${runtime.sceneCount}`);
  });

  check("freshness windows differ by evidence kind", () => {
    assert(runtime.newsWindow === 7, `news ${runtime.newsWindow}`);
    assert(runtime.statWindow === 400, `statistic ${runtime.statWindow}`);
    assert(runtime.backgroundWindow === null, `background ${runtime.backgroundWindow}`);
  });

  check("banned phrase detection works", () => {
    assert(runtime.bannedHit.includes("무조건"), `hits ${JSON.stringify(runtime.bannedHit)}`);
    assert(runtime.bannedClean === 0, `clean text flagged ${runtime.bannedClean}`);
    assert(runtime.benefitOverreach >= 1, "benefit overreach not detected");
  });

  check("temporal token detection works", () => {
    assert(runtime.temporalYes === true, "failed to detect 오늘");
    assert(runtime.temporalNo === false, "false positive on timeless text");
  });

  check("cutline fails closed on malformed config", () => {
    for (const key of ["badVersion", "badThreshold", "emptyBanned", "badScene", "nullCutline"]) {
      assert(runtime[key] === "THREW", `${key} = ${runtime[key]}`);
    }
  });

  check("registry loads with expected shape", () => {
    assert(runtime.registryVersion === "1.0.0", `version ${runtime.registryVersion}`);
    assert(runtime.t1Count >= 10, `T1 count ${runtime.t1Count}`);
    assert(runtime.t2Count === 29, `T2 count ${runtime.t2Count}`);
    // 2026-09-17: 도메인 확장(real_estate, investing 신설)으로 5→7개.
    assert(runtime.allDomains.length === 7, `domains ${runtime.allDomains.length}`);
  });

  check("living_finance/macro_rate/real_estate/investing are enabled", () => {
    // 2026-09-17: 도메인 확장 — living_finance만 활성화하던 이전 상태에서
    // macro_rate(물가·환율·기준금리 등 ECOS 실연동), real_estate·investing
    // (뉴스 전용 신규 도메인)까지 4개로 확장. gov_benefit/industry_outlook/
    // insurance는 여전히 커넥터 미구현이라 비활성 상태 유지.
    assert(
      JSON.stringify(runtime.enabledDomains) ===
        JSON.stringify(["living_finance", "macro_rate", "real_estate", "investing"]),
      `enabled = ${JSON.stringify(runtime.enabledDomains)}`,
    );
    assert(runtime.livingEnabled === true, "living_finance not enabled");
    assert(runtime.insuranceEnabled === false, "insurance should be disabled");
    assert(runtime.insuranceBlocked === true, "insurance missing blockedReason");
  });

  check("publisher tier resolution is whitelist-based", () => {
    assert(runtime.tierBok.tier === "T1", `bok = ${runtime.tierBok.tier}`);
    assert(runtime.tierYna.tier === "T2", `yna = ${runtime.tierYna.tier}`);
    assert(runtime.tierSub.tier === "T2", `imbc subdomain = ${runtime.tierSub.tier}`);
    assert(runtime.tierUnknown.tier === "T3", `unknown = ${runtime.tierUnknown.tier}`);
    assert(runtime.tierMalformed.tier === "T3", `malformed = ${runtime.tierMalformed.tier}`);
  });

  check("proper noun dictionary works", () => {
    assert(runtime.properNouns.includes("리볼빙"), `got ${JSON.stringify(runtime.properNouns)}`);
    assert(runtime.properNouns.includes("국민연금"), "국민연금 not found");
    assert(runtime.properNounsNone.length === 0, "false positive on generic text");
  });

  check("registry fails closed on malformed config", () => {
    for (const key of [
      "badConnectorRef", "dupDomain", "dupConnector",
      "disabledNoReason", "unknownPublisher",
    ]) {
      assert(runtime[key] === "THREW", `${key} = ${runtime[key]}`);
    }
  });
}

// --- 결과 ------------------------------------------------------------------
console.log("=== L2-1 config loader check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
