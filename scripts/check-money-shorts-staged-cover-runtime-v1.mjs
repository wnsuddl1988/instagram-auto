#!/usr/bin/env node
/** No-network runtime guard for the staged-cover TTS contract. */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BUILDER = resolve(__dirname, "build-elevenlabs-korean-director-tts-from-script.mjs");
const OUT_ROOT = "C:\\tmp\\money-shorts-os\\staged-cover-runtime-check-v1";
const CONTRACT = "money_shorts_staged_prehook_cover_v1";

let passed = 0;
let failed = 0;
function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${label}${detail ? ` - ${detail}` : ""}`);
  }
}

function speechDirection(performanceText, tag) {
  return {
    engineVersion: "money_shorts_speech_direction_v2",
    v3AudioTag: tag,
    performanceText,
    segments: performanceText.split(/\n+/u).map((text) => ({ text, cadence: "firm_land", pauseAfterMs: 0 })),
  };
}

const coverLines = [
  { spokenText: "생활비가 새는 진짜 이유", displayText: "생활비가 새는 진짜 이유???", emphasis: "topic" },
  { spokenText: "그냥 넘기면 안 돼", displayText: "그냥 넘기면 안 돼...!", emphasis: "tension" },
  { spokenText: "월말 저축이 먼저 사라져", displayText: "월말 저축이 먼저 사라져!!!", emphasis: "impact" },
];
const coverSpoken = coverLines.map((line) => line.spokenText).join("\n");
const sceneTexts = [
  coverSpoken,
  "장바구니에서 한 번의 큰 사치보다 매주 반복하는 작은 결제가 생활비를 더 오래 가져가",
  "가격과 횟수를 같이 보지 않으면 월말 저축이 줄어든 원인을 계속 놓치게 돼",
  "오늘 영수증 세 장을 열고 가장 자주 산 품목의 가격과 횟수를 한 줄에 같이 적어",
];

function buildInput(lines = coverLines) {
  const spokenText = lines.map((line) => line.spokenText).join("\n");
  const displayText = lines.map((line) => line.displayText).join("\n");
  return {
    schemaVersion: "money_shorts_tts_script_v1",
    ttsEngineVersion: "money_shorts_korean_director_v2",
    modelId: "eleven_v3",
    prosodyPolicy: "korean_native_cadence_v2",
    wizardTopicId: "runtime-cover-check",
    wizardScriptFingerprint: "runtime-cover-check-v1",
    openingVoiceContract: { v3AudioTag: "confidently", speedCap: 0.98 },
    topicSpeechProfile: {
      id: "economic_authority",
      globalV3Tag: "confidently",
      baseSpeed: 0.98,
      baseStability: 0.5,
      baseSimilarityBoost: 0.87,
    },
    coverContract: {
      enabled: true,
      contractVersion: CONTRACT,
      sceneNumber: 1,
      spokenText,
      displayText,
      lines,
      visualOnlyPunctuation: true,
    },
    scenes: sceneTexts.map((text, index) => ({
      sceneNumber: index + 1,
      sceneRole: index === 0 ? "hook" : index === 3 ? "habit" : "situation",
      narration: index === 0 ? spokenText : text,
      speechDirection: speechDirection(index === 0 ? spokenText : text, index === 0 ? "confidently" : "conversationally"),
    })),
  };
}

function runCase(name, input) {
  const caseRoot = join(OUT_ROOT, name);
  const inputPath = join(caseRoot, "tts-script.json");
  const outDir = join(caseRoot, "out");
  mkdirSync(caseRoot, { recursive: true });
  writeFileSync(inputPath, JSON.stringify(input, null, 2), "utf8");
  const env = Object.fromEntries(
    ["PATH", "Path", "SystemRoot", "WINDIR", "ComSpec", "TEMP", "TMP"]
      .filter((key) => typeof process.env[key] === "string")
      .map((key) => [key, process.env[key]]),
  );
  const result = spawnSync(process.execPath, [BUILDER, "--tts-script", inputPath, "--out-dir", outDir], {
    cwd: ROOT,
    env,
    encoding: "utf8",
  });
  return { result, outDir };
}

const valid = runCase("valid-no-env", buildInput());
const validSummaryPath = join(valid.outDir, "elevenlabs-scene-paced-tts-summary.json");
const validSummary = existsSync(validSummaryPath) ? JSON.parse(readFileSync(validSummaryPath, "utf8")) : null;
check("valid staged cover reaches the no-key readiness boundary", valid.result.status === 3,
  `exit ${valid.result.status}; ${String(valid.result.stderr).trim()}`);
check("valid staged cover performs zero external calls", validSummary?.apiCallCount === 0 && validSummary?.liveApiCallPerformed === false);
check("valid staged cover preserves the confident 0.98 opening audit",
  validSummary?.coverContractVersion === CONTRACT &&
  validSummary?.openingVoiceAudit?.confidentFirstTag === true &&
  validSummary?.openingVoiceAudit?.speedWithinCap === true &&
  validSummary?.openingVoiceAudit?.passed === true);

const invalidLines = coverLines.map((line, index) => index === 1
  ? { ...line, displayText: "그냥 넘기면...!" }
  : line);
const invalid = runCase("invalid-word-drop", buildInput(invalidLines));
const invalidSummaryPath = join(invalid.outDir, "elevenlabs-scene-paced-tts-summary.json");
check("a dropped display word is blocked before readiness or API handling",
  invalid.result.status === 2 && /staged cover spoken\/display contract is invalid/u.test(String(invalid.result.stderr)),
  `exit ${invalid.result.status}; ${String(invalid.result.stderr).trim()}`);
check("invalid staged cover cannot produce a summary", !existsSync(invalidSummaryPath));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
