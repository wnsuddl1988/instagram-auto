#!/usr/bin/env node

/**
 * 부엉이 애널리스트 보이스 캐스팅 도구.
 *
 * 두 가지 모드가 있다:
 *   --mode list    : 계정 보이스 + (선택) 공식 라이브러리 검색. 생성 크레딧을 쓰지 않는다.
 *   --mode sample  : 지정한 보이스 ID들로 짧은 훅 한 문장씩 생성해 비교 청취용 파일을 만든다.
 *
 * sample 모드는 유료 호출이므로 --arm 없이는 계획만 출력한다. 후보 수에 상한을 두어
 * 실수로 수십 건을 생성하는 사고를 막는다.
 *
 * 시크릿은 process.env 에서만 받고 절대 로그에 남기지 않는다. 출력 경로는
 * C:\tmp\money-shorts-os\ 하위로 강제한다(다른 러너와 동일 규약).
 *
 * 사용:
 *   node scripts/build-owl-voice-casting-samples-v1.mjs --mode list --out-dir "C:/tmp/money-shorts-os/owl-voice-casting"
 *   node scripts/build-owl-voice-casting-samples-v1.mjs --mode sample --voice-ids "id1,id2,id3" --out-dir "..." --arm
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const MAX_SAMPLE_VOICES = 6;
const MODEL_ID = "eleven_v3";

// 캐스팅 판단용 대사. 실제 1번 장면 훅을 그대로 쓴다 — 톤·속도·숫자 발음까지
// 최종 결과와 같은 조건에서 비교해야 의미가 있다.
// --line 으로 재정의 가능(Owner 2026-09-18: 짧은 문장으로는 톤 판단이 어려워
// 더 긴 실제 대본으로 재확인 요청 — 파일명이 겹치지 않도록 line 지정 시 접미사
// "-longer"를 붙인다).
const DEFAULT_CASTING_LINE = "카드론 기사만 보면 놓치는 기준금리 숫자가 있어.";

const args = process.argv.slice(2);
function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

const mode = getArg("--mode");
const outDirArg = getArg("--out-dir");
const armed = args.includes("--arm");
const CASTING_LINE = getArg("--line") || DEFAULT_CASTING_LINE;
const usingCustomLine = Boolean(getArg("--line"));

if (!mode || !["list", "sample"].includes(mode)) {
  console.error("ABORT: --mode 는 list 또는 sample 이어야 합니다.");
  process.exit(2);
}
if (!outDirArg) {
  console.error("ABORT: --out-dir 가 필요합니다.");
  process.exit(2);
}

const outDir = resolve(outDirArg);
if (!MEDIA_ROOT_RE.test(outDir + "\\")) {
  console.error("ABORT: --out-dir 는 C:\\tmp\\money-shorts-os\\ 하위여야 합니다.");
  process.exit(2);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ABORT: ELEVENLABS_API_KEY 가 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
  process.exit(2);
}

const authHeaders = { "xi-api-key": apiKey };

function fail(message) {
  console.error(`ABORT: ${message}`);
  process.exit(1);
}

/** 한국어 지원 여부를 여러 필드에서 관대하게 판정한다(응답 스키마가 버전마다 다르다). */
function looksKorean(voice) {
  const haystack = JSON.stringify({
    labels: voice?.labels ?? null,
    languages: voice?.verified_languages ?? voice?.languages ?? null,
    description: voice?.description ?? null,
    name: voice?.name ?? null,
  }).toLowerCase();
  return haystack.includes("korean") || haystack.includes("\"ko\"") || haystack.includes("ko-kr");
}

function summarizeVoice(voice, source) {
  const labels = voice?.labels ?? {};
  return {
    source,
    voiceId: voice?.voice_id ?? null,
    name: voice?.name ?? null,
    gender: labels.gender ?? null,
    age: labels.age ?? null,
    accent: labels.accent ?? null,
    descriptive: labels.descriptive ?? labels.description ?? null,
    useCase: labels.use_case ?? null,
    previewUrl: voice?.preview_url ?? null,
    korean: looksKorean(voice),
  };
}

/**
 * 응답 본문에서 provider가 준 사유만 추출한다. 키 값이 본문에 포함될 일은 없지만,
 * 혹시 모를 노출을 막기 위해 길이를 제한하고 그대로 흘리지 않는다.
 */
async function failureDetail(response) {
  try {
    const text = await response.text();
    const parsed = JSON.parse(text);
    const status = parsed?.detail?.status ?? parsed?.detail?.message ?? parsed?.detail;
    return typeof status === "string" ? status.slice(0, 200) : JSON.stringify(status ?? "").slice(0, 200);
  } catch {
    return "";
  }
}

async function listMode() {
  mkdirSync(outDir, { recursive: true });

  // v2 가 권한 부족으로 막히는 키가 있어 v1 으로 폴백한다(둘 다 읽기 전용).
  let owned = [];
  let ownedOk = false;
  for (const url of [
    "https://api.elevenlabs.io/v2/voices?page_size=100",
    "https://api.elevenlabs.io/v1/voices",
  ]) {
    const response = await fetch(url, { headers: authHeaders });
    if (response.ok) {
      const json = await response.json();
      owned = (json?.voices ?? []).map((voice) => summarizeVoice(voice, "account"));
      ownedOk = true;
      break;
    }
    console.error(`WARN: 계정 보이스 조회 실패(HTTP ${response.status}) ${await failureDetail(response)}`);
  }
  if (!ownedOk) {
    fail("계정 보이스를 조회하지 못했습니다. API 키에 voices_read 권한이 있는지 확인하세요.");
  }

  // 공식 라이브러리에서 한국어 남성 보이스를 검색한다. 검색만으로는 과금되지 않는다.
  const libraryParams = new URLSearchParams({
    page_size: "60",
    language: "ko",
    gender: "male",
  });
  const libraryResponse = await fetch(
    `https://api.elevenlabs.io/v1/shared-voices?${libraryParams.toString()}`,
    { headers: authHeaders },
  );
  let library = [];
  if (libraryResponse.ok) {
    const libraryJson = await libraryResponse.json();
    library = (libraryJson?.voices ?? []).map((voice) => summarizeVoice(voice, "library"));
  } else {
    console.error(
      `WARN: 공식 라이브러리 조회 실패(HTTP ${libraryResponse.status}) ${await failureDetail(libraryResponse)} — 계정 보이스만 보고합니다.`,
    );
  }

  const report = {
    schemaVersion: "owl_voice_casting_list_v1",
    generatedAt: new Date().toISOString(),
    castingLine: CASTING_LINE,
    accountVoiceCount: owned.length,
    libraryVoiceCount: library.length,
    accountVoices: owned,
    koreanLibraryVoices: library.filter((voice) => voice.korean),
    otherLibraryVoices: library.filter((voice) => !voice.korean),
  };

  const outPath = resolve(outDir, "owl-voice-candidates.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n", "utf8");

  console.log(`[casting] 계정 보이스 ${owned.length}개, 라이브러리 ${library.length}개`);
  console.log("");
  console.log("── 계정 보이스 ──");
  for (const voice of owned) {
    console.log(`  ${voice.name} | ${voice.gender ?? "-"} / ${voice.age ?? "-"} / ${voice.descriptive ?? "-"}${voice.korean ? " | KO" : ""}`);
    console.log(`    ${voice.voiceId}`);
  }
  const koreanLibrary = report.koreanLibraryVoices;
  if (koreanLibrary.length > 0) {
    console.log("");
    console.log("── 라이브러리(한국어) ──");
    for (const voice of koreanLibrary) {
      console.log(`  ${voice.name} | ${voice.gender ?? "-"} / ${voice.age ?? "-"} / ${voice.descriptive ?? "-"}`);
      console.log(`    ${voice.voiceId}`);
    }
  }
  console.log("");
  console.log(`전체 결과: ${outPath}`);
}

async function sampleMode() {
  const voiceIdsArg = getArg("--voice-ids");
  if (!voiceIdsArg) fail("--voice-ids 가 필요합니다(쉼표 구분).");
  const voiceIds = voiceIdsArg.split(",").map((value) => value.trim()).filter(Boolean);
  if (voiceIds.length === 0) fail("--voice-ids 에 유효한 값이 없습니다.");
  if (voiceIds.length > MAX_SAMPLE_VOICES) {
    fail(`--voice-ids 는 최대 ${MAX_SAMPLE_VOICES}개까지만 허용합니다(현재 ${voiceIds.length}개).`);
  }
  if (new Set(voiceIds).size !== voiceIds.length) fail("--voice-ids 에 중복이 있습니다.");

  console.log(`[casting] 샘플 대상 ${voiceIds.length}개, 대사: "${CASTING_LINE}"`);
  if (!armed) {
    console.log("[casting] --arm 이 없어 생성하지 않습니다(드라이런).");
    return;
  }

  mkdirSync(outDir, { recursive: true });
  const results = [];

  for (const voiceId of voiceIds) {
    const endpoint =
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}` +
      "?output_format=mp3_44100_128";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { ...authHeaders, "content-type": "application/json" },
      body: JSON.stringify({
        text: CASTING_LINE,
        model_id: MODEL_ID,
        voice_settings: { stability: 0.5, similarity_boost: 0.87, style: 0, use_speaker_boost: true },
      }),
    });
    if (!response.ok) {
      // 한 보이스가 실패해도 나머지는 계속 — 라이브러리 보이스는 접근 제한이 있을 수 있다.
      console.error(`  FAIL ${voiceId.slice(0, 6)}***: HTTP ${response.status}`);
      results.push({ voiceId, ok: false, status: response.status });
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    const suffix = usingCustomLine ? "-longer" : "";
    const outPath = resolve(outDir, `owl-casting${suffix}-${voiceId.slice(0, 8)}.mp3`);
    writeFileSync(outPath, buffer);
    console.log(`  OK   ${voiceId.slice(0, 6)}*** → ${outPath}`);
    results.push({ voiceId, ok: true, path: outPath, bytes: buffer.length });
  }

  const summaryPath = resolve(outDir, "owl-casting-samples-summary.json");
  writeFileSync(
    summaryPath,
    JSON.stringify({
      schemaVersion: "owl_voice_casting_samples_v1",
      generatedAt: new Date().toISOString(),
      castingLine: CASTING_LINE,
      modelId: MODEL_ID,
      requested: voiceIds.length,
      succeeded: results.filter((item) => item.ok).length,
      results: results.map((item) => ({ ...item, voiceId: item.voiceId.slice(0, 8) + "***" })),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log(`요약: ${summaryPath}`);
}

try {
  if (mode === "list") await listMode();
  else await sampleMode();
} catch (error) {
  fail(error?.message ?? String(error));
}
