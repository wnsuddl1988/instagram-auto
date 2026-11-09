#!/usr/bin/env node

/**
 * 부엉이 쇼츠 Veo 모션 프롬프트를 사람이 직접 복사해 쓸 수 있게 화면에 출력한다.
 *
 * 배경: 자동화(run-owl-motion-orchestrator-v1.mjs / run-owl-veo-motion-execute-once-v1.mjs)로
 * Gemini Veo를 돌리면 "분석 중" 무한 대기가 반복 재현됐지만(2026-09-17~18),
 * Owner가 같은 프롬프트를 브라우저에 직접 붙여넣어 제출하면 정상 생성됐다.
 * 그래서 Gemini는 당분간 수동 진행, Flow만 자동화하는 것으로 방향을 정했다
 * (Owner 2026-09-18) — 이 스크립트는 그 수동 진행을 위한 조회 전용 도구다.
 * 생성·제출은 하지 않는다. 읽기 전용이라 ALLOW_GEMINI_VEO 게이트가 필요 없다.
 *
 * 사용:
 *   node scripts/show-owl-veo-scene-prompt-v1.mjs --scene-prompts "scripts/_owl-ep3-veo-scene-prompts.mjs:OWL_EP3_VEO_SCENES"
 *     → 그 편의 모든 씬을 요약 목록으로 보여준다(씬 id, refImage 존재 여부, outputName).
 *   node scripts/show-owl-veo-scene-prompt-v1.mjs --scene-prompts "...:OWL_EP3_VEO_SCENES" --scene s2_loss_aversion
 *     → 그 씬 하나의 기준 이미지 경로와 전체 프롬프트 텍스트를 그대로 출력한다(복사해서 Gemini에 붙여넣기용).
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const scenePromptsArg = getArg("--scene-prompts");
if (!scenePromptsArg) {
  console.error(
    'Usage: node scripts/show-owl-veo-scene-prompt-v1.mjs --scene-prompts "<경로>:<export명>" [--scene <sceneKey>]\n' +
      '예: node scripts/show-owl-veo-scene-prompt-v1.mjs --scene-prompts "scripts/_owl-ep3-veo-scene-prompts.mjs:OWL_EP3_VEO_SCENES"',
  );
  process.exit(2);
}

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

const SCENES = mod[exportName];
const sceneKeys = Object.keys(SCENES);
const wanted = getArg("--scene");

if (wanted) {
  const scene = SCENES[wanted];
  if (!scene) {
    console.error(`ABORT: "${wanted}" 을(를) 찾을 수 없습니다. 사용 가능: ${sceneKeys.join(", ")}`);
    process.exit(2);
  }
  const refExists = fs.existsSync(scene.refImage);
  console.log("=".repeat(78));
  console.log(`씬: ${wanted}  (id: ${scene.id})`);
  console.log(`기준 이미지: ${scene.refImage}  ${refExists ? "✅ 존재" : "❌ 없음"}`);
  console.log(`저장할 파일명: ${scene.outputName}`);
  console.log("=".repeat(78));
  console.log();
  console.log("--- 프롬프트 (아래 전체를 복사해서 Gemini에 붙여넣기) ---");
  console.log();
  console.log(scene.prompt);
  console.log();
  console.log("-".repeat(78));
  console.log("체크리스트: 세로 모드(9:16) 켜져 있는지 반드시 확인 후 제출할 것");
  console.log(`완료 후 저장 경로: <out-dir>/${scene.outputName}`);
  process.exit(0);
}

console.log(`모듈: ${resolved}  (export: ${exportName})`);
console.log(`총 ${sceneKeys.length}개 씬\n`);
for (const key of sceneKeys) {
  const scene = SCENES[key];
  const refExists = fs.existsSync(scene.refImage);
  console.log(`  ${key.padEnd(20)} id=${scene.id.padEnd(24)} ref=${refExists ? "✅" : "❌"}  → ${scene.outputName}`);
}
console.log(`\n특정 씬의 전체 프롬프트를 보려면: --scene <위 목록의 씬 이름>`);
