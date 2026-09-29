#!/usr/bin/env node

/**
 * 여러 owl Veo 장면을 각각 별도 탭에서 병렬로 제출한다.
 * run-owl-veo-motion-execute-once-v1.mjs를 자식 프로세스로 여러 개 띄우는
 * 방식 — 각 자식이 context.newPage()로 새 탭을 여니 탭끼리는 독립적이다.
 *
 * 한도 소진을 놓치지 않기 위해 완전 동시 전송이 아니라 90초 간격으로
 * 순차 시작한다(첫 번째가 quota에 걸리면 이후 시작을 스킵할 여지를 둔다).
 * 이미 시작한 자식은 중간에 죽이지 않는다 — 중단이 더 위험하다(탭에 남은
 * 진행 중 생성을 확인할 수 없게 됨, Scene 3 사고와 동일한 패턴).
 *
 * 사용: node run-owl-veo-motion-batch-v1.mjs --scenes s3_evidence_card,s4_background --owner-approved-once
 */

import { spawn } from "node:child_process";

if (!process.argv.includes("--owner-approved-once")) {
  console.error("ABORT: --owner-approved-once flag is required for live submissions.");
  process.exit(2);
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const scenesArg = getArg("--scenes");
if (!scenesArg) {
  console.error("ABORT: --scenes <comma,separated,keys> is required");
  process.exit(2);
}
const scenes = scenesArg.split(",").map((s) => s.trim()).filter(Boolean);
const STAGGER_MS = 90_000;

function log(message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][batch] ${message}`);
}

function runScene(sceneKey) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["scripts/run-owl-veo-motion-execute-once-v1.mjs", "--scene", sceneKey, "--owner-approved-once"],
      { env: { ...process.env, ALLOW_GEMINI_VEO: "1" }, stdio: ["ignore", "pipe", "pipe"] },
    );
    child.stdout.on("data", (chunk) => process.stdout.write(`[${sceneKey}] ${chunk}`));
    child.stderr.on("data", (chunk) => process.stderr.write(`[${sceneKey}] ${chunk}`));
    child.on("exit", (code) => resolve({ sceneKey, code }));
  });
}

const running = [];
for (let i = 0; i < scenes.length; i += 1) {
  const sceneKey = scenes[i];
  log(`starting ${sceneKey} (${i + 1}/${scenes.length})`);
  running.push(runScene(sceneKey));
  if (i < scenes.length - 1) {
    log(`waiting ${STAGGER_MS / 1000}s before starting next scene (stagger, not full sequential wait)`);
    await new Promise((r) => setTimeout(r, STAGGER_MS));
  }
}

const results = await Promise.all(running);
log("all scenes finished submission attempts:");
for (const r of results) log(`  ${r.sceneKey}: exit=${r.code}`);

const anyQuota = results.some((r) => r.code === 3);
if (anyQuota) log("NOTE: at least one scene hit quota (exit 3) — consider switching remaining scenes to Flow.");

process.exit(results.every((r) => r.code === 0) ? 0 : 1);
