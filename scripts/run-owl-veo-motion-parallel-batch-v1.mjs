#!/usr/bin/env node

/**
 * Gemini 영상 생성을 여러 장면 동시에(병렬 탭) 돌린다.
 *
 * 왜 필요한가:
 *   순차 실행은 장면 하나에 수 분(길면 8분 타임아웃)이 걸려 8장이면 오래 걸린다.
 *   Gemini 실행기(run-owl-veo-motion-execute-once-v1.mjs)는 매번 같은 CDP 포트로
 *   접속해 context.newPage() 로 "새 탭"을 여는 구조라, 여러 프로세스를 동시에
 *   띄우면 자연히 여러 탭이 병렬로 뜬다 — 이 스크립트는 그 여러 프로세스를
 *   한 번에 spawn 하는 얇은 래퍼일 뿐이다.
 *
 * 안전:
 *   - 각 장면은 독립된 자식 프로세스라 한 탭이 막혀도 다른 탭에 영향 없다.
 *   - 실패한 장면의 탭은 기존 정책대로 닫지 않는다(진행 중 결과를 잃지 않기 위해).
 *   - Gemini 하루 사용량 한도(약 4장)를 감안해 기본 동시 개수는 4개로 제한한다.
 *
 * 사용:
 *   node scripts/run-owl-veo-motion-parallel-batch-v1.mjs \
 *     --scenes s1_hook,s2_loss_aversion,s3_evidence_card,s4_background \
 *     --scene-prompts "scripts/_owl-ep2-veo-scene-prompts.mjs:OWL_EP2_VEO_SCENES" \
 *     --out-dir "C:/tmp/owl-ep2-veo-motion" \
 *     --owner-approved-once
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

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

const scenesArg = getArg("--scenes");
if (!scenesArg) {
  console.error("ABORT: --scenes 가 필요합니다(쉼표 구분).");
  process.exit(2);
}
const SCENES = scenesArg.split(",").map((s) => s.trim()).filter(Boolean);

// 동시 실행 개수를 제한한다 — Gemini 사용량 한도(하루 약 4장)를 넘겨 탭을
// 열어봤자 어차피 quota 에 걸린다. 기본값 4가 그 한도와 맞는다.
const MAX_CONCURRENT = Number(getArg("--max-concurrent") || "4");
if (SCENES.length > MAX_CONCURRENT) {
  console.error(
    `ABORT: 장면 ${SCENES.length}개가 동시 실행 한도(${MAX_CONCURRENT})를 넘습니다. ` +
      "--max-concurrent 를 늘리거나 --scenes 를 줄이세요.",
  );
  process.exit(2);
}

const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-veo-motion";
const scenePromptsArg = getArg("--scene-prompts");
const REPORT_PATH = getArg("--report") || path.join(OUT_DIR, "parallel-batch-report.json");

const GEMINI_RUNNER = "scripts/run-owl-veo-motion-execute-once-v1.mjs";

function log(message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][parallel-batch] ${message}`);
}

function runScene(sceneKey) {
  return new Promise((resolve) => {
    const promptArgs = scenePromptsArg ? ["--scene-prompts", scenePromptsArg] : [];
    const args = [GEMINI_RUNNER, "--scene", sceneKey, "--out-dir", OUT_DIR, ...promptArgs, "--owner-approved-once"];
    const startedAt = Date.now();
    const child = spawn(process.execPath, args, {
      env: { ...process.env, ALLOW_GEMINI_VEO: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    // 여러 탭이 동시에 로그를 쏟아내므로 장면 태그를 반드시 붙여 구분한다.
    child.stdout.on("data", (chunk) => process.stdout.write(`[${sceneKey}] ${chunk}`));
    child.stderr.on("data", (chunk) => process.stderr.write(`[${sceneKey}] ${chunk}`));
    child.on("exit", (code) => {
      resolve({ scene: sceneKey, exitCode: code ?? 1, elapsedMs: Date.now() - startedAt });
    });
  });
}

log(`동시 시작: ${SCENES.join(", ")} (${SCENES.length}개 탭)`);
const startedAt = Date.now();

// 전부 동시에 spawn 한다 — Promise.all 이 아니라 먼저 전체를 시작(sync)한 뒤
// 기다려야 진짜 "동시 시작"이 된다. map 의 콜백이 즉시 spawn 을 호출하므로
// 여기서는 map 한 번으로 충분하다.
const results = await Promise.all(SCENES.map(runScene));

const report = {
  schemaVersion: "owl_veo_parallel_batch_report_v1",
  scenes: SCENES,
  maxConcurrent: MAX_CONCURRENT,
  outDir: OUT_DIR,
  totalElapsedMs: Date.now() - startedAt,
  results,
  finishedAt: new Date().toISOString(),
};
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n", "utf8");

log("─".repeat(50));
for (const r of results) {
  log(`  ${r.scene}: exit=${r.exitCode} (${Math.round(r.elapsedMs / 1000)}s)`);
}
log(`전체 소요: ${Math.round(report.totalElapsedMs / 1000)}s`);
log(`리포트: ${REPORT_PATH}`);

const failedCount = results.filter((r) => r.exitCode !== 0).length;
process.exit(failedCount > 0 ? 1 : 0);
