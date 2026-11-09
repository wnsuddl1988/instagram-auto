// L2~L3 통합 CLI — Shorts Editorial OS V2 실시간 주제 파이프라인
//
// 두 서브커맨드:
//   generate  실시간 지표+뉴스를 수집해 LLM 프롬프트를 만든다. (네트워크 호출 — ECOS + 네이버)
//   verify    LLM이 돌려준 JSON 응답을 하드컷+스코어링으로 판정하고 순위를 매긴다. (네트워크 없음)
//
// generate는 라이브 API를 호출하므로 --confirm-live-call 플래그가 없으면 실행하지 않는다.
// (Ianpapa 워크플로우 원칙: 네트워크 호출은 매번 명시적 승인)
//
// 사용법:
//   node scripts/run-editorial-v2-live-topic-pipeline.mjs generate \
//     --topic living_finance --end-period 202609 --confirm-live-call
//   node scripts/run-editorial-v2-live-topic-pipeline.mjs verify \
//     --response-file path/to/llm-response.json --evidence-file path/to/evidence-pack.json
//
// generate가 만든 프롬프트와 evidence pack은 같은 디렉터리에 짝지어 저장된다.
// verify는 그 evidence pack 파일을 다시 읽어 대조하므로, LLM 호출 사이에 이 파이프라인이
// 별도로 데이터를 기억할 필요가 없다 — evidence pack 자체가 재현 가능한 상태 전부다.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const [, , subcommand, ...rest] = process.argv;

function argValue(flag, fallback) {
  const index = rest.indexOf(flag);
  if (index === -1 || index + 1 >= rest.length) return fallback;
  return rest[index + 1];
}
function hasFlag(flag) {
  return rest.includes(flag);
}

function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = /^([A-Za-z0-9_]+)=(.*)$/.exec(line);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

function printUsageAndExit() {
  console.log(`
사용법:
  generate  --topic <topicDomainId> --end-period <YYYYMM> --confirm-live-call
            [--indicators base_rate,cpi_total,fx_usd_krw] [--fx-end-date <YYYYMMDD>]
            [--research-cutoff YYYY-MM-DD] [--audience "..."] [--candidates N]
            [--out-dir <dir>]
  verify    --response-file <path> --evidence-file <path>

--indicators 생략 시 기본값은 base_rate 하나만(하위 호환). fx_usd_krw를 포함하면
--fx-end-date(일별 YYYYMMDD)가 별도로 필요하다 — 기준금리/CPI는 월별(YYYYMM)이라
--end-period를 공유하지만 환율은 일별 시리즈라 같은 값을 쓸 수 없다.

예시:
  node scripts/run-editorial-v2-live-topic-pipeline.mjs generate --topic living_finance --end-period 202609 --confirm-live-call
  node scripts/run-editorial-v2-live-topic-pipeline.mjs generate --topic macro_rate --end-period 202609 --indicators base_rate,cpi_total,fx_usd_krw --fx-end-date 20260917 --confirm-live-call
  node scripts/run-editorial-v2-live-topic-pipeline.mjs verify --response-file out/llm-response.json --evidence-file out/evidence-pack.json
`);
  process.exit(1);
}

if (subcommand !== "generate" && subcommand !== "verify") {
  printUsageAndExit();
}

// ── generate ────────────────────────────────────────────────────────────────

async function runGenerate() {
  const topicDomainId = argValue("--topic", null);
  const endPeriod = argValue("--end-period", null);
  // fx_usd_krw/treasury_bond_3y/kospi are daily ECOS series (YYYYMMDD), unlike
  // base_rate/cpi_total (YYYYMM monthly) — they share this end date, never
  // derived from --end-period to avoid inventing a date. Required when
  // --indicators includes any of the three daily indicators.
  const fxEndDate = argValue("--fx-end-date", null);
  const researchCutoffDate = argValue("--research-cutoff", "2026-09-16");
  const audience = argValue("--audience", "30대 직장인, 금융 상품을 처음 접해보는 시청자");
  const candidateCount = Number.parseInt(argValue("--candidates", "5"), 10);
  const outDir = argValue("--out-dir", path.join(ROOT, "_ai", "live-topic-runs"));
  // 도메인의 기본 지표 세트를 --indicators로 오버라이드할 수 있게 한다.
  // 쉼표 구분 목록, 예: "base_rate,cpi_total,fx_usd_krw"
  const indicatorsArg = argValue("--indicators", null);
  const indicatorIds = indicatorsArg
    ? indicatorsArg.split(",").map((s) => s.trim()).filter(Boolean)
    : null;

  if (!topicDomainId || !endPeriod) {
    console.log("generate에는 --topic과 --end-period가 필요합니다.");
    printUsageAndExit();
  }
  const DAILY_INDICATOR_IDS = ["fx_usd_krw", "treasury_bond_3y", "kospi"];
  if (indicatorIds && indicatorIds.some((id) => DAILY_INDICATOR_IDS.includes(id)) && !fxEndDate) {
    console.log(`--indicators에 일별 지표(${DAILY_INDICATOR_IDS.join(", ")}) 중 하나가 있으면 --fx-end-date (YYYYMMDD)가 필요합니다.`);
    process.exit(2);
  }
  if (!hasFlag("--confirm-live-call")) {
    console.log("generate는 ECOS·네이버 라이브 API를 호출합니다.");
    console.log("실행하려면 --confirm-live-call 플래그를 명시적으로 붙이세요.");
    process.exit(2);
  }

  loadLocalEnv();

  const probe = `
import { generateTopicPrompt } from "./live-topic-pipeline.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";
import { createEcosLiveTransport } from "../source-facts/ecos-live-transport.js";
import { resolveEcosApiKey } from "../source-facts/ecos-live-transport.js";
import { resolveNaverCredentials, createNaverNewsLiveTransport } from "../source-facts/naver-news-live-transport.js";
import { createKosisLiveTransport, resolveKosisApiKey } from "../source-facts/kosis-live-transport.js";

const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();

const ecosKey = resolveEcosApiKey();
const naverCreds = resolveNaverCredentials();
const kosisKey = resolveKosisApiKey();
const requestedIndicators = ${JSON.stringify(indicatorIds ?? ["base_rate"])} as any[];
const needsKosis = requestedIndicators.some((id) => id === "employment_rate" || id === "unemployment_rate");
if (ecosKey === null) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_ecos_key" }));
} else if (naverCreds === null) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_naver_credentials" }));
} else if (needsKosis && kosisKey === null) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_kosis_key" }));
} else {
  const fetchedAt = new Date().toISOString();
  const result = await generateTopicPrompt({
    projectId: "shorts-editorial-os-v2",
    topicDomainId: ${JSON.stringify(topicDomainId)},
    registry, cutline,
    researchCutoffDate: ${JSON.stringify(researchCutoffDate)},
    audience: ${JSON.stringify(audience)},
    targetDurationSeconds: 45,
    candidateCount: ${JSON.stringify(candidateCount)},
    rawHash: \`live-\${fetchedAt}\`,
    normalizedHash: \`live-\${fetchedAt}\`,
    ecosTransport: createEcosLiveTransport(fetchedAt),
    kosisTransport: needsKosis ? createKosisLiveTransport(fetchedAt) : undefined,
    ecosEndPeriod: ${JSON.stringify(fxEndDate
      ? { base_rate: endPeriod, cpi_total: endPeriod, current_account: endPeriod, trade_balance: endPeriod, employment_rate: endPeriod, unemployment_rate: endPeriod, fx_usd_krw: fxEndDate, treasury_bond_3y: fxEndDate, kospi: fxEndDate }
      : endPeriod)},
    ecosIndicatorIds: requestedIndicators,
    naverTransport: createNaverNewsLiveTransport({ credentials: naverCreds }),
    // 라이브 수집 draft는 기본적으로 게시 불가다. 이 CLI 실행 한 번의 결과물은
    // Owner가 프롬프트→LLM→verify까지 직접 검토할 리허설이므로 여기서 명시적으로
    // 승격한다 — 실제 배포 파이프라인에서는 이 승격을 별도 심사 단계로 분리해야 한다.
    promoteFactCardsToPublishable: true,
  });

  if (!result.ok) {
    process.stdout.write(JSON.stringify({ status: "FAILED", reason: result.reason }));
  } else {
    process.stdout.write(JSON.stringify({
      status: "OK",
      promptPackage: result.promptPackage,
      indicatorsCollected: result.indicatorsCollected,
      indicatorFailures: result.indicatorFailures,
      newsCollected: result.newsCollected,
      newsUntiered: result.newsUntiered,
      newsFailures: result.newsFailures,
      evidenceSkipped: result.evidenceSkipped,
    }));
  }
}
`;

  const result = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
    extraJsFiles: [
      "live-topic-pipeline.js",
      "live-evidence-adapter.js",
      "live-topic-prompt.js",
      "live-topic-cutline-check.js",
      "live-topic-score.js",
    ],
  });

  if (result.status === "BLOCKED") {
    console.log(`BLOCKED: ${result.reason}`);
    process.exit(2);
  }
  if (result.status === "FAILED") {
    console.log(`FAILED at stage "${result.reason.stage}":`);
    console.log(JSON.stringify(result.reason, null, 2));
    process.exit(1);
  }

  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const promptPath = path.join(outDir, `${stamp}-prompt.md`);
  const evidencePath = path.join(outDir, `${stamp}-evidence-pack.json`);

  writeFileSync(
    promptPath,
    [
      `# Live topic prompt — ${topicDomainId} (${stamp})`,
      "",
      `packageId: \`${result.promptPackage.packageId}\``,
      `지표 수집: ${result.indicatorsCollected}건 (실패 ${result.indicatorFailures.length}건)`,
      `뉴스 수집: ${result.newsCollected}건, T3(힌트 전용) ${result.newsUntiered}건, 실패 키워드 ${result.newsFailures.length}건`,
      "",
      "아래 텍스트를 그대로 복사해 LLM에 붙여넣으세요.",
      "",
      "```text",
      result.promptPackage.instructions,
      "```",
    ].join("\n"),
    "utf8",
  );
  // instructions 안의 UNTRUSTED_SESSION_INPUT 블록에 evidence pack JSON이 이미
  // 들어있지만, verify 단계에서 그 JSON을 다시 파싱하기보다 원본을 그대로 저장해
  // 둔다 — 마커 이스케이프로 변형된 텍스트를 재파싱하는 것보다 안전하다.
  const evidenceJsonMatch = result.promptPackage.instructions.match(
    /UNTRUSTED_SESSION_INPUT_START\n([\s\S]*)\nUNTRUSTED_SESSION_INPUT_END/,
  );
  if (evidenceJsonMatch) {
    writeFileSync(evidencePath, evidenceJsonMatch[1], "utf8");
  }

  console.log("=== generate 완료 ===\n");
  console.log(`프롬프트 파일   : ${promptPath}`);
  console.log(`근거 팩 파일    : ${evidencePath}`);
  console.log(`지표 수집       : ${result.indicatorsCollected}건 (실패 ${result.indicatorFailures.length}건)`);
  console.log(`뉴스 수집       : ${result.newsCollected}건, T3 ${result.newsUntiered}건, 실패 ${result.newsFailures.length}건`);
  if (result.evidenceSkipped.length > 0) {
    console.log(`제외된 근거     : ${result.evidenceSkipped.length}건`);
    for (const s of result.evidenceSkipped) {
      console.log(`  [${s.reason}] ${s.label}`);
    }
  }
  console.log("\n다음: 프롬프트 파일 내용을 LLM에 붙여넣고, 응답 JSON을 저장한 뒤");
  console.log(`  node scripts/run-editorial-v2-live-topic-pipeline.mjs verify --response-file <응답.json> --evidence-file ${evidencePath}`);
}

// ── verify ──────────────────────────────────────────────────────────────────

async function runVerify() {
  const responseFile = argValue("--response-file", null);
  const evidenceFile = argValue("--evidence-file", null);
  if (!responseFile || !evidenceFile) {
    console.log("verify에는 --response-file과 --evidence-file이 필요합니다.");
    printUsageAndExit();
  }
  if (!existsSync(responseFile) || !existsSync(evidenceFile)) {
    console.log(`파일을 찾을 수 없습니다: ${!existsSync(responseFile) ? responseFile : evidenceFile}`);
    process.exit(1);
  }

  let responseJson;
  let evidencePackJson;
  try {
    responseJson = JSON.parse(readFileSync(responseFile, "utf8"));
  } catch (error) {
    console.log(`--response-file이 유효한 JSON이 아닙니다: ${error.message}`);
    process.exit(1);
  }
  try {
    evidencePackJson = JSON.parse(readFileSync(evidenceFile, "utf8"));
  } catch (error) {
    console.log(`--evidence-file이 유효한 JSON이 아닙니다: ${error.message}`);
    process.exit(1);
  }
  if (!Array.isArray(responseJson?.candidates)) {
    console.log('--response-file에 "candidates" 배열이 없습니다.');
    process.exit(1);
  }
  // evidence-file은 프롬프트에 그대로 박혔던 { evidencePack, audience } 구조다.
  const evidencePack = evidencePackJson?.evidencePack ?? evidencePackJson;

  const probe = `
import { verifyLlmResponse } from "./live-topic-pipeline.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";

const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();
const response: any = ${JSON.stringify(responseJson)};
const evidencePack: any = ${JSON.stringify(evidencePack)};

const result = verifyLlmResponse(response, evidencePack, cutline, registry);
process.stdout.write(JSON.stringify(result));
`;

  const result = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
    extraJsFiles: [
      "live-topic-pipeline.js",
      "live-evidence-adapter.js",
      "live-topic-prompt.js",
      "live-topic-cutline-check.js",
      "live-topic-score.js",
    ],
  });

  console.log(`=== verify 결과: ${result.verdict.candidateCount}건 중 ${result.verdict.passedCount}건 하드컷 통과 ===\n`);
  for (const v of result.verdict.verdicts) {
    const scoreEntry = result.scores.find((s) => s.candidateId === v.candidateId);
    const scoreText = scoreEntry ? `${scoreEntry.total}/${scoreEntry.totalPossible}점` : "—";
    console.log(`${v.passed ? "PASS" : "FAIL"}  ${v.candidateId}  (${scoreText})`);
    for (const violation of v.violations) console.log(`       - ${violation.id}: ${violation.detail}`);
    if (v.selfCheckMismatches.length > 0) {
      console.log(`       selfCheck 불일치: ${v.selfCheckMismatches.join(", ")}`);
    }
  }

  console.log(`\n추천 후보 (하드컷 통과 + 점수 ${result.recommended[0]?.score ? "" : ""}합격선 이상):`);
  if (result.recommended.length === 0) {
    console.log("  없음 — 전부 하드컷에 걸렸거나 합격선 미달입니다.");
  } else {
    for (const rec of result.recommended) {
      console.log(`  ${rec.candidateId}  총점 ${rec.score.total}/${rec.score.totalPossible}`);
    }
  }
}

if (subcommand === "generate") {
  await runGenerate();
} else {
  await runVerify();
}
