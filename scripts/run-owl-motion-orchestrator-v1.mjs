#!/usr/bin/env node

/**
 * 부엉이 8장면 모션 생성 오케스트레이터 — Gemini 우선, quota 소진 시 Flow 자동 전환.
 *
 * 왜 필요한가:
 *   Gemini 내장 Veo와 labs.google/flow는 서로 다른 예산을 쓴다(Gemini 앱 사용량
 *   한도 vs Flow 크레딧). 실측상 Gemini는 1장에 약 23%를 소모해 하루 4장 남짓이
 *   한계이고, 그 뒤로는 Flow로 넘어가야 8장을 다 만들 수 있다. 사람이 매번
 *   화면을 보고 판단하지 않아도 되도록 이 전환을 자동화한다.
 *
 * 전환 규칙(2026-09-16 실전 관찰 기반):
 *   - exit 3 (quota)            → --on-quota 값에 따라 분기(아래 참조).
 *   - exit 1 (일시적 오류/타임아웃) → 같은 provider로 1회 재시도. 그래도 실패하면
 *                                 그 장면만 Flow로 넘긴다(Scene 3 사례: Gemini에서
 *                                 4회 연속 실패했지만 Flow에서는 한 번에 성공).
 *   - exit 2 (인자/가드 오류)    → 즉시 전체 중단. 재시도해도 같은 결과이고,
 *                                 설정 실수를 조용히 넘기면 안 된다.
 *
 * --on-quota (Gemini 한도 소진 시 동작, Owner 2026-09-17 선택制 요청):
 *   - flow (기본값)  → 즉시 Flow로 전환하고, 이후 장면도 전부 Flow로 간다.
 *                      (한 번 한도가 찼으면 다음 장면도 찰 것이므로 Gemini를
 *                       다시 시도해 시간을 낭비하지 않는다)
 *   - wait           → Flow로 넘어가지 않고 그 자리에서 실행을 멈춘다. 이미 끝난
 *                      장면은 최종 폴더에 남아있으므로, Gemini 하루 한도가 풀린
 *                      뒤(보통 익일) 사용자가 같은 명령을 다시 실행하면 끝난
 *                      장면은 건너뛰고 남은 장면부터 Gemini로 이어간다. 자동
 *                      sleep/재시도는 하지 않는다 — 터미널을 계속 띄워둘 필요가
 *                      없고, 실제 한도 해제 시점이 정확히 언제인지 알 수 없기
 *                      때문이다(리포트의 resumeHint 참조).
 *
 * Flow 모델은 Veo 3.1 - Lite로 고정한다. Omni 1.1 Flash와 Veo Fast는 참조 이미지의
 * 3D 애니메이션 스타일을 실사로 재해석하는 사례가 반복 관찰됐고, Lite + STYLE_LOCK
 * 프롬프트 조합에서만 스타일이 안정적으로 유지됐다.
 *
 * Flow 크레딧 정책(Owner 2026-09-17): Flow는 8초를 넘는 클립일수록 크레딧
 * 소모가 커진다. 이 오케스트레이터는 영상 길이를 직접 제어하지 않으므로(Flow UI
 * 에 길이 설정이 없음), 8초를 넘는 나레이션이 필요한 장면은 애초에 대본/스펙
 * 단계에서 장면을 둘로 쪼개 각각 8초 이내로 만들어야 한다 — _ai/OWL_SHORTS_
 * RUNBOOK_V1.md "장면 수와 길이" 절 참조.
 *
 * 사용:
 *   node scripts/run-owl-motion-orchestrator-v1.mjs \
 *     --scenes s1_hook,s2_loss_aversion,... --owner-approved-once [--on-quota wait|flow]
 *   (--scenes 생략 시 전체 장면. 장면 수는 8개로 고정되지 않는다 —
 *    OWL_VEO_SCENES 모듈에 정의된 개수를 그대로 따른다)
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { OWL_VEO_SCENES as OWL_VEO_SCENES_EP1 } from "./_owl-veo-scene-prompts.mjs";

if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: 차단됨 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1");
  process.exit(2);
}
if (!process.argv.includes("--owner-approved-once")) {
  console.error("ABORT: --owner-approved-once 플래그가 필요합니다 (실제 생성·크레딧 소비).");
  process.exit(2);
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// --scene-prompts 로 편(episode)별 프롬프트 모듈을 고른다. 기본은 1편(하위 호환).
// 2편은 --scene-prompts scripts/_owl-ep2-veo-scene-prompts.mjs:OWL_EP2_VEO_SCENES
// 형식으로 "경로:export명"을 지정한다 — export명이 편마다 다르기 때문이다.
const scenePromptsArg = getArg("--scene-prompts");
const OWL_VEO_SCENES = scenePromptsArg
  ? await (async () => {
      const [modulePath, exportName] = scenePromptsArg.split(":");
      if (!modulePath || !exportName) {
        console.error('ABORT: --scene-prompts 는 "경로:export명" 형식이어야 합니다.');
        process.exit(2);
      }
      const resolved = path.resolve(modulePath);
      if (!fs.existsSync(resolved)) {
        console.error(`ABORT: 프롬프트 모듈을 찾을 수 없습니다: ${resolved}`);
        process.exit(2);
      }
      const mod = await import(pathToFileURL(resolved).href);
      if (!mod[exportName]) {
        console.error(`ABORT: ${resolved} 에 export "${exportName}" 이 없습니다.`);
        process.exit(2);
      }
      return mod[exportName];
    })()
  : OWL_VEO_SCENES_EP1;

const ALL_SCENE_KEYS = Object.keys(OWL_VEO_SCENES);
const scenesArg = getArg("--scenes");
const SCENES = scenesArg
  ? scenesArg.split(",").map((s) => s.trim()).filter(Boolean)
  : ALL_SCENE_KEYS;

const unknown = SCENES.filter((s) => !OWL_VEO_SCENES[s]);
if (unknown.length > 0) {
  console.error(`ABORT: 알 수 없는 장면: ${unknown.join(", ")}. 사용 가능: ${ALL_SCENE_KEYS.join(", ")}`);
  process.exit(2);
}

const GEMINI_OUT_DIR = getArg("--gemini-out-dir") || "C:/tmp/owl-veo-motion";
const FLOW_OUT_DIR = getArg("--flow-out-dir") || "C:/tmp/owl-flow-motion";
// 완성본을 한곳에 모으는 폴더. 두 provider가 서로 다른 디렉토리에 떨어뜨리기
// 때문에, 이후 단계(조립·TTS·overlay)가 한 곳만 보면 되도록 여기로 복사한다.
// 이미 이 폴더에 있는 장면은 어떤 provider로 만들었든 재생성하지 않는다.
const FINAL_DIR = getArg("--final-dir") || "C:/tmp/owl-motion-final";
const REPORT_PATH = getArg("--report") || "C:/tmp/owl-motion-orchestrator-report.json";
const FLOW_MODEL = getArg("--flow-model") || "lite";
const ON_QUOTA = getArg("--on-quota") || "flow";
if (!["flow", "wait"].includes(ON_QUOTA)) {
  console.error(`ABORT: --on-quota 는 "flow" 또는 "wait"만 가능합니다 (입력값: ${ON_QUOTA})`);
  process.exit(2);
}
// quota 사전 감지가 사이드바 갤러리의 과거 실패 카드를 현재 상황으로 오탐하는
// 경우가 있다(2026-09-17). Owner가 실제 사용량에 문제없음을 확인했을 때만
// 켠다 — Gemini 실행기에만 전달되고, 진짜 거부/한도 소진이면 제출 이후
// 폴링 단계에서 여전히 감지된다.
const SKIP_QUOTA_CHECK = process.argv.includes("--skip-quota-check");

const GEMINI_RUNNER = "scripts/run-owl-veo-motion-execute-once-v1.mjs";
const FLOW_RUNNER = "scripts/run-owl-flow-motion-execute-once-v1.mjs";

function log(message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][orchestrator] ${message}`);
}

function runScene(runner, sceneKey, extraArgs) {
  return new Promise((resolve) => {
    const promptArgs = scenePromptsArg ? ["--scene-prompts", scenePromptsArg] : [];
    const skipQuotaArgs = runner === GEMINI_RUNNER && SKIP_QUOTA_CHECK ? ["--skip-quota-check"] : [];
    const args = [runner, "--scene", sceneKey, ...extraArgs, ...promptArgs, ...skipQuotaArgs, "--owner-approved-once"];
    const child = spawn(process.execPath, args, {
      env: { ...process.env, ALLOW_GEMINI_VEO: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    const tag = runner === GEMINI_RUNNER ? "gemini" : "flow";
    child.stdout.on("data", (chunk) => process.stdout.write(`[${tag}:${sceneKey}] ${chunk}`));
    child.stderr.on("data", (chunk) => process.stderr.write(`[${tag}:${sceneKey}] ${chunk}`));
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

function outputExists(sceneKey, dir) {
  const outputName = OWL_VEO_SCENES[sceneKey].outputName;
  return fs.existsSync(path.join(dir, outputName));
}

// provider별 출력 디렉토리에 생긴 결과물을 최종 폴더로 모은다. 복사(이동 아님)로
// 두어 provider별 원본과 실행 기록을 남긴다.
function collectToFinal(sceneKey, fromDir) {
  const outputName = OWL_VEO_SCENES[sceneKey].outputName;
  const src = path.join(fromDir, outputName);
  if (!fs.existsSync(src)) return false;
  fs.mkdirSync(FINAL_DIR, { recursive: true });
  fs.copyFileSync(src, path.join(FINAL_DIR, outputName));
  return true;
}

const results = [];
// 한 번 quota를 만나면 이후 장면은 Gemini를 건너뛰고 바로 Flow로 간다.
let geminiExhausted = false;

let aborted = false;

for (const sceneKey of SCENES) {
  // 이미 만들어진 장면은 건너뛴다 — 중복 생성은 예산 낭비이자 되돌릴 수 없다.
  if (outputExists(sceneKey, FINAL_DIR)) {
    log(`${sceneKey}: 최종 폴더에 이미 있어 건너뜁니다`);
    results.push({ scene: sceneKey, provider: "skipped", exitCode: 0, note: "already_in_final_dir" });
    continue;
  }
  // 최종 폴더엔 없지만 provider 폴더엔 있는 경우(이전 실행의 잔여물) 수집만 한다.
  for (const [dir, name] of [[GEMINI_OUT_DIR, "gemini"], [FLOW_OUT_DIR, "flow"]]) {
    if (outputExists(sceneKey, dir)) {
      collectToFinal(sceneKey, dir);
      log(`${sceneKey}: ${name} 폴더의 기존 산출물을 최종 폴더로 수집했습니다`);
      results.push({ scene: sceneKey, provider: name, exitCode: 0, note: "collected_existing_output" });
      break;
    }
  }
  if (results.some((r) => r.scene === sceneKey)) continue;

  let provider = null;
  let exitCode = null;

  if (!geminiExhausted) {
    log(`${sceneKey}: Gemini 시도`);
    provider = "gemini";
    exitCode = await runScene(GEMINI_RUNNER, sceneKey, ["--out-dir", GEMINI_OUT_DIR]);

    if (exitCode === 2) {
      log(`${sceneKey}: Gemini가 인자/가드 오류(exit 2)로 중단 — 전체 중단합니다`);
      results.push({ scene: sceneKey, provider, exitCode, note: "argument_or_guard_error" });
      aborted = true;
      break;
    }
    if (exitCode === 3) {
      if (ON_QUOTA === "wait") {
        log(`${sceneKey}: Gemini 한도 소진(exit 3) — --on-quota wait 이므로 여기서 멈춥니다`);
        results.push({ scene: sceneKey, provider, exitCode, note: "quota_wait_stop" });
        aborted = true;
        break;
      }
      log(`${sceneKey}: Gemini 한도 소진(exit 3) — 이후 전부 Flow로 전환합니다`);
      geminiExhausted = true;
    } else if (exitCode === 1 && !outputExists(sceneKey, GEMINI_OUT_DIR)) {
      // 일시적 오류일 수 있으므로 같은 provider로 1회만 더 시도한다.
      // 단, 산출물이 이미 있으면(다운로드 저장만 실패한 경우) 재시도하지 않는다.
      log(`${sceneKey}: Gemini 실패(exit 1) — 같은 경로로 1회 재시도`);
      exitCode = await runScene(GEMINI_RUNNER, sceneKey, ["--out-dir", GEMINI_OUT_DIR]);
      if (exitCode === 3) {
        if (ON_QUOTA === "wait") {
          log(`${sceneKey}: 재시도에서 한도 소진 — --on-quota wait 이므로 여기서 멈춥니다`);
          results.push({ scene: sceneKey, provider, exitCode, note: "quota_wait_stop" });
          aborted = true;
          break;
        }
        log(`${sceneKey}: 재시도에서 한도 소진 — 이후 전부 Flow로 전환합니다`);
        geminiExhausted = true;
      }
    }

    // exit 코드와 무관하게 파일이 실제로 생겼는지를 신뢰한다. 오늘 실제로
    // "exit 1인데 영상은 정상 생성" 사례가 여러 번 있었다.
    if (outputExists(sceneKey, GEMINI_OUT_DIR)) {
      collectToFinal(sceneKey, GEMINI_OUT_DIR);
      results.push({
        scene: sceneKey,
        provider: "gemini",
        exitCode: 0,
        note: exitCode === 0 ? undefined : "output_present_despite_nonzero_exit",
      });
      log(`${sceneKey}: 완료 provider=gemini`);
      continue;
    }
  }

  log(`${sceneKey}: Flow(${FLOW_MODEL}) 시도`);
  provider = "flow";
  exitCode = await runScene(FLOW_RUNNER, sceneKey, ["--out-dir", FLOW_OUT_DIR, "--model", FLOW_MODEL]);
  if (outputExists(sceneKey, FLOW_OUT_DIR)) {
    collectToFinal(sceneKey, FLOW_OUT_DIR);
    results.push({
      scene: sceneKey,
      provider: "flow",
      exitCode: 0,
      note: exitCode === 0 ? undefined : "output_present_despite_nonzero_exit",
    });
    log(`${sceneKey}: 완료 provider=flow`);
    continue;
  }

  results.push({ scene: sceneKey, provider, exitCode });
  log(`${sceneKey}: 실패 provider=${provider} exit=${exitCode}`);
}

const succeeded = results.filter((r) => r.exitCode === 0);
const failed = results.filter((r) => r.exitCode !== 0);

const quotaWaitStopped = results.some((r) => r.note === "quota_wait_stop");
const remainingScenes = SCENES.filter((s) => !results.some((r) => r.scene === s));
const report = {
  schemaVersion: "owl_motion_orchestrator_report_v1",
  flowModel: FLOW_MODEL,
  onQuota: ON_QUOTA,
  finalDir: FINAL_DIR,
  geminiExhausted,
  aborted,
  requested: SCENES.length,
  succeeded: succeeded.length,
  failed: failed.length,
  results,
  resumeHint: quotaWaitStopped
    ? `Gemini 한도 소진으로 대기 중입니다. 한도가 풀린 뒤(보통 익일) 같은 명령을 다시 실행하면 ` +
      `완료된 장면은 건너뛰고 남은 장면(${remainingScenes.join(", ")})부터 이어갑니다.`
    : null,
  finishedAt: new Date().toISOString(),
};
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

log("─".repeat(50));
for (const r of results) log(`  ${r.scene}: ${r.provider} exit=${r.exitCode}${r.note ? ` (${r.note})` : ""}`);
log(`성공 ${succeeded.length}/${SCENES.length}, 리포트: ${REPORT_PATH}`);
if (report.resumeHint) log(`RESUME HINT: ${report.resumeHint}`);

process.exit(failed.length === 0 ? 0 : 1);
