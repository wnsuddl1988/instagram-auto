#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-elevenlabs-tts-v3-1-patch-static.mjs
//
// TTS v3.1 PATCH — STRUCTURE/SAFETY GUARD (no execution, no ffmpeg, no API)
//
// v3.1 patch 검증:
//   - v3.1 TTS script: Scene 1/2/3/5 ttsText === v3 (재사용 안전), Scene 4 v3보다 길어짐,
//     Scene 6 soft ending 포함 + 직접 CTA 금지어 없음(구독/좋아요/알림/계속 봐/다음 영상 봐).
//   - patch runner: PATCHED_SCENES=[4,6], REUSED_SCENES=[1,2,3,5], API_CALL_BUDGET_MAX=2, no retry,
//     reuse copyFileSync, mux-compatible summary schema, secret masking 유지.
//   - selected image set / caption v3 render manifest 변경 없음.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const TTS_V3_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json");
const TTS_V31_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3-1.json");
const V3_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3.json");
const PATCH_RUNNER_PATH = join(__dirname, "patch-elevenlabs-scene-paced-tts-v3-1.mjs");
const SELF_PATH = join(__dirname, "check-elevenlabs-tts-v3-1-patch-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

let ttsV3, ttsV31, v3Manifest, patchRunnerText, selfText;
try {
  ttsV3 = JSON.parse(readFileSync(TTS_V3_PATH, "utf8"));
  ttsV31 = JSON.parse(readFileSync(TTS_V31_PATH, "utf8"));
  v3Manifest = JSON.parse(readFileSync(V3_MANIFEST_PATH, "utf8"));
  patchRunnerText = readFileSync(PATCH_RUNNER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const byNum = (scenes) => new Map((scenes || []).map((s) => [s.sceneNumber, s]));
const v3Scenes = byNum(ttsV3.scenes);
const v31Scenes = byNum(ttsV31.scenes);

// ═══════════════════════════════════════════════════════════════════════════
// § A. v3.1 TTS script: reuse safety + scene 4/6 patch
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: v3.1 schemaVersion === money_shorts_tts_script_v1", ttsV31.schemaVersion === "money_shorts_tts_script_v1");
check("A-02: v3.1 ttsMode === elevenlabs_scene_paced", ttsV31.ttsMode === "elevenlabs_scene_paced");
check("A-03: v3.1 voiceProfile === yohan_koo", ttsV31.voiceProfile === "yohan_koo");
check("A-04: v3.1 voicePreset === confident_v3 (동일 유지)", ttsV31.voicePreset === "confident_v3");
check("A-05: v3.1 has 6 scenes", (ttsV31.scenes || []).length === 6);
check("A-06: v3.1 duration sum === 30", (ttsV31.scenes || []).reduce((s, sc) => s + sc.durationSec, 0) === 30);
check("A-07: v3.1 supersedes v3 scriptId", ttsV31.supersedes?.scriptId === ttsV3.scriptId);
check("A-08: v3.1 patchInfo.reusedScenes === [1,2,3,5]", JSON.stringify(ttsV31.patchInfo?.reusedScenes) === JSON.stringify([1, 2, 3, 5]));
check("A-09: v3.1 patchInfo.patchedScenes === [4,6]", JSON.stringify(ttsV31.patchInfo?.patchedScenes) === JSON.stringify([4, 6]));
check("A-10: v3.1 patchInfo.apiCallBudgetMax === 2", ttsV31.patchInfo?.apiCallBudgetMax === 2);

// reuse safety: Scene 1/2/3/5 ttsText === v3 (바이트 동일)
for (const n of [1, 2, 3, 5]) {
  const a = (v3Scenes.get(n)?.ttsText || "").trim();
  const b = (v31Scenes.get(n)?.ttsText || "").trim();
  check(`A-11: scene ${n} ttsText identical to v3 (재사용 안전)`, a === b && a.length > 0);
  check(`A-12: scene ${n} reuseFromV3 === true`, v31Scenes.get(n)?.reuseFromV3 === true);
}
// Scene 1/2/3/5 caption/narration/duration도 동일 (완전 재사용)
for (const n of [1, 2, 3, 5]) {
  const a = v3Scenes.get(n), b = v31Scenes.get(n);
  check(`A-13: scene ${n} captionText identical to v3`, a?.captionText === b?.captionText);
  check(`A-14: scene ${n} durationSec identical to v3`, a?.durationSec === b?.durationSec);
}

// Scene 4: v3.1이 v3보다 길어짐 (여백 축소 목표)
{
  const l3 = (v3Scenes.get(4)?.ttsText || "").trim().length;
  const l31 = (v31Scenes.get(4)?.ttsText || "").trim().length;
  check(`A-15: scene 4 ttsText v3.1(${l31}) > v3(${l3}) — 여백 축소 위해 확장`, l31 > l3, `v3=${l3}, v3.1=${l31}`);
  check(`A-16: scene 4 reuseFromV3 === false (재호출 대상)`, v31Scenes.get(4)?.reuseFromV3 === false);
}
// Scene 6: 변경됨 + soft ending 마커
{
  const a = (v3Scenes.get(6)?.ttsText || "").trim();
  const b = (v31Scenes.get(6)?.ttsText || "").trim();
  check("A-17: scene 6 ttsText changed from v3", a !== b && b.length > 0);
  check("A-18: scene 6 softEnding === true", v31Scenes.get(6)?.softEnding === true);
  check("A-19: scene 6 reuseFromV3 === false (재호출 대상)", v31Scenes.get(6)?.reuseFromV3 === false);
  // soft ending 의도: 시리즈 지속감 표현 포함
  check("A-20: scene 6 conveys series continuity (다음 흐름/이어)", /다음 흐름|이어가|이어서/.test(b), b);
}

// Scene 6: 직접 CTA 금지어 없음
const BANNED_CTA = ["구독", "좋아요", "알림", "계속 봐", "다음 영상 봐"];
{
  const b = (v31Scenes.get(6)?.ttsText || "");
  const bCap = (v31Scenes.get(6)?.captionText || "");
  const hit = BANNED_CTA.filter((w) => b.includes(w) || bCap.includes(w));
  check(`A-21: scene 6 has NO direct CTA banned words (${BANNED_CTA.join("/")})`, hit.length === 0, hit.join(","));
}
// 전 scene 금지 CTA 없음 (안전망)
{
  const allHit = [];
  for (const s of (ttsV31.scenes || [])) {
    for (const w of BANNED_CTA) {
      if ((s.ttsText || "").includes(w) || (s.captionText || "").includes(w)) allHit.push(`s${s.sceneNumber}:${w}`);
    }
  }
  check("A-22: no scene contains banned CTA words", allHit.length === 0, allHit.join(","));
}

// factual meaning 유지 (patch가 sourceFact를 바꾸지 않음)
check("A-23: v3.1 sourceFact currentValueText === v3 (2.5%)", ttsV31.sourceFact?.currentValueText === ttsV3.sourceFact?.currentValueText);
check("A-24: v3.1 sourceFact latestPeriod === v3 (202605)", ttsV31.sourceFact?.latestPeriod === ttsV3.sourceFact?.latestPeriod);
check("A-25: v3.1 isPublishable === false", ttsV31.sourceFact?.isPublishable === false);

// ═══════════════════════════════════════════════════════════════════════════
// § B. patch runner: budget 2, reuse, no retry, secret safety, mux-compatible summary
// ═══════════════════════════════════════════════════════════════════════════
check("B-01: runner PATCHED_SCENES = [4, 6]", /PATCHED_SCENES\s*=\s*\[4,\s*6\]/.test(patchRunnerText));
check("B-02: runner REUSED_SCENES = [1, 2, 3, 5]", /REUSED_SCENES\s*=\s*\[1,\s*2,\s*3,\s*5\]/.test(patchRunnerText));
check("B-03: runner API_CALL_BUDGET_MAX = 2", /API_CALL_BUDGET_MAX\s*=\s*2/.test(patchRunnerText));
check("B-04: runner has budget guard (apiCallCount >= API_CALL_BUDGET_MAX)", /apiCallCount\s*>=\s*API_CALL_BUDGET_MAX/.test(patchRunnerText));
check("B-05: runner has NO retry loop", !/for\s*\([^)]*retry/i.test(patchRunnerText) && !/while\s*\([^)]*retry/i.test(patchRunnerText));
check("B-06: runner reuses via copyFileSync", /copyFileSync/.test(patchRunnerText));
check("B-07: runner masks voice ID (maskVoiceId)", /maskVoiceId/.test(patchRunnerText));
check("B-08: runner records voiceIdMasked in summary", /voiceIdMasked/.test(patchRunnerText));
check("B-09: runner does NOT console.log/error bare apiKey",
  !/console\.(log|error)\(\s*apiKey\s*\)/.test(patchRunnerText) &&
  !/console\.(log|error)\(\s*`[^`]*\$\{apiKey\}/.test(patchRunnerText));
check("B-10: runner does NOT log voiceId directly", !/console\.(log|error)\(\s*voiceId\s*\)/.test(patchRunnerText));
check("B-11: runner summary schemaVersion is scene-paced (mux-compatible)", /money_shorts_elevenlabs_scene_paced_tts_summary_v1/.test(patchRunnerText));
check("B-12: runner summary provider === elevenlabs", /provider:\s*["']elevenlabs["']/.test(patchRunnerText));
check("B-13: runner summary liveApiCallPerformed: true", /liveApiCallPerformed:\s*true/.test(patchRunnerText));
check("B-14: runner summary qualityAccepted: false", /qualityAccepted:\s*false/.test(patchRunnerText));
check("B-15: runner summary ownerListeningRequired: true", /ownerListeningRequired:\s*true/.test(patchRunnerText));
check("B-16: runner writes timelineAudioPath in summary", /timelineAudioPath/.test(patchRunnerText));
check("B-17: runner uses concat demuxer (-f concat -safe 0 -c copy)",
  /"-f",\s*"concat"/.test(patchRunnerText) && /"-safe",\s*"0"/.test(patchRunnerText) && /"-c",\s*"copy"/.test(patchRunnerText));
check("B-18: runner uses shell:false on spawnSync", /shell:\s*false/.test(patchRunnerText));
check("B-19: runner out-dir repo guard present", /outDirAbs\.startsWith\(REPO_ROOT/.test(patchRunnerText));
check("B-20: runner .money-shorts-local forbidden", /\.money-shorts-local/.test(patchRunnerText) && /forbidden/.test(patchRunnerText));
check("B-21: runner readiness failure path (no API call when env missing)", /READINESS FAILURE/.test(patchRunnerText) && /liveApiCallPerformed:\s*false/.test(patchRunnerText));
check("B-22: runner does NOT call voices list endpoint", !/\/voices\b/.test(patchRunnerText) && !/v1\/voices/.test(patchRunnerText));
check("B-23: runner does NOT import openai/playwright/node-fetch", !/(import|require)[^\n]*['"`](openai|playwright|node-fetch)['"`]/.test(patchRunnerText));
check("B-24: runner uses eleven_multilingual_v2 default model", /eleven_multilingual_v2/.test(patchRunnerText));
check("B-25: runner uses voice_settings in body", /voice_settings/.test(patchRunnerText));

// ═══════════════════════════════════════════════════════════════════════════
// § C. selected image / caption v3 manifest 변경 없음 (참조 무결성)
// ═══════════════════════════════════════════════════════════════════════════
check("C-01: caption v3 manifest still fontSize 104 (자막 스타일 재실험 없음)", v3Manifest.outputSpec?.captionFontSize === 104);
check("C-02: caption v3 manifest still outline 6 / shadow 3", v3Manifest.outputSpec?.captionOutline === 6 && v3Manifest.outputSpec?.captionShadow === 3);
check("C-03: caption v3 manifest imageInputs count === 6", (v3Manifest.imageInputs || []).length === 6);
check("C-04: caption v3 manifest scene 2 retry-01 unchanged", /retry-01\.png$/.test((v3Manifest.imageInputs || []).find((i) => i.sceneIndex === 2)?.assetPath || ""));
// v3.1 patch는 render manifest를 새로 만들지 않음 (caption v3 재사용)
check("C-05: v3.1 does NOT introduce a new caption v3.1 manifest fixture (caption v3 reused)",
  !existsSync(join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3-1.json")));

// ═══════════════════════════════════════════════════════════════════════════
// § E. no-live tail-preserving normalization (atempo) 보강 검증
// ═══════════════════════════════════════════════════════════════════════════
check("E-01: runner supports --reuse-existing-raw (no-live mode)", /--reuse-existing-raw/.test(patchRunnerText));
check("E-02: runner supports --raw-dir for no-live raw source", /--raw-dir/.test(patchRunnerText));
check("E-03: no-live mode requires --raw-dir (guarded)", /--reuse-existing-raw requires --raw-dir/.test(patchRunnerText));
// no-live mode: fetch/endpoint 경로 차단 — endpoint는 no-live에서 null
check("E-04: endpoint is null in no-live mode (fetch path blocked)", /endpoint\s*=\s*\(!reuseExistingRaw/.test(patchRunnerText));
check("E-05: no-live reuses existing raw via copyFileSync (reused_existing_raw_no_live)", /reused_existing_raw_no_live/.test(patchRunnerText));
check("E-06: no-live branch skips fetch (reuseExistingRaw guards the ElevenLabs call)", /if\s*\(reuseExistingRaw\)/.test(patchRunnerText));
// atempo tail-preserving: over-target moderate ratio는 hard trim 대신 atempo
check("E-07: over-target uses atempo (NOT hard trim) for tail-preserving", /atempo=\$\{atempoFactor\}/.test(patchRunnerText));
check("E-08: normalize status uses tempo_fit for over-target", /normalizeStatus\s*=\s*["']tempo_fit["']/.test(patchRunnerText));
check("E-09: ATEMPO_MAX_RATIO = 1.18 threshold present", /ATEMPO_MAX_RATIO\s*=\s*1\.18/.test(patchRunnerText));
check("E-10: over ATEMPO_MAX_RATIO aborts (no auto-process for extreme ratio)", /exceeds ATEMPO_MAX_RATIO/.test(patchRunnerText) && /process\.exit\(1\)/.test(patchRunnerText));
check("E-11: atempo is pitch-preserving tempo fit (documented, not hard trim)", /pitch-preserving/.test(patchRunnerText) && /tail[- ]?cut/i.test(patchRunnerText));
// no-live mode: 이번 run 실제 호출 0 기록
check("E-12: summary records apiCallCountThisRun (honest per-run call count)", /apiCallCountThisRun/.test(patchRunnerText));
check("E-13: summary records noLiveTailPreservingRun flag", /noLiveTailPreservingRun/.test(patchRunnerText));
check("E-14: summary tailfit mode string present", /elevenlabs_scene_paced_patch_v3_1_tailfit_no_live/.test(patchRunnerText));
check("E-15: summary records atempoFactor per scene", /atempoFactor/.test(patchRunnerText));
// no-live mode: env readiness를 요구하지 않음 (fetch 안 하므로)
check("E-16: no-live mode does not require env readiness (readiness gated by !reuseExistingRaw)", /!reuseExistingRaw\s*&&\s*\(!apiKeyConfigured/.test(patchRunnerText));
// Scene 6 soft ending raw text가 여전히 기존 v3.1 (script 문구 변경 없음)
check("E-17: v3.1 script Scene 6 soft ending unchanged (script 문구 변경 없음)",
  (v31Scenes.get(6)?.ttsText || "").includes("다음 흐름도 생활 기준으로 이어가겠습니다"));
check("E-18: v3.1 script Scene 6 softEnding flag still true", v31Scenes.get(6)?.softEnding === true);

// ── self-guard ──────────────────────────────────────────────────────────────
check("D-01: guard does NOT import openai/playwright/node-fetch",
  !/(import|require)[^\n]*['"`](openai|playwright|node-fetch)['"`]/.test(selfText));

// ── result ────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  TTS v3.1 PATCH — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? `  [${r.detail}]` : "";
  console.log(`  ${mark}  ${r.name}${detail}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: TTS v3.1 patch structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
