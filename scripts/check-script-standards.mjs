#!/usr/bin/env node
/**
 * 대본 기준 대조 검사기 CLI (2026-09-30 밤, 최우선 규칙 26). 규칙 본체는 scripts/_script-standards.mjs.
 *
 * 배경: 부엉 18편 대본을 기준 문서 §1 표를 읽지 않고 요약 메모리로 써서 위반 6개가 나왔다. A-2 "요건은 나중에 대조한다" 단계를
 * 사람 기억이 아니라 코드로 강제한다. 같은 검사가 TTS 생성(no-log 래퍼 owl-tts)과 편 QA(run-episode-qa-once.mjs)에도 자동으로
 * 걸려 있어, 통과하지 못하면 음성 생성과 QA가 멈춘다.
 *
 * 사용:
 *   node scripts/check-script-standards.mjs --character owl|bull --scenes <scenes.json> [--hook-type T3]
 *   node scripts/check-script-standards.mjs --character owl|bull --tts-script <tts-script.json> [--hook-type T3]
 *   node scripts/check-script-standards.mjs --character owl|bull --spec-module ./_owl-v2-ep19-assembly-spec.mjs --spec-export OWL_EP19_ASSEMBLY_SPEC
 * scenes.json = 씬별 narration 문자열 배열. 종료 코드: 반드시 수정 있으면 1.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkScriptStandards, formatScriptStandardsReport, scenesFromTtsScript } from "./_script-standards.mjs";

const argv = process.argv.slice(2);
const arg = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const character = arg("character");
if (!["owl", "bull"].includes(character)) {
  console.error("ABORT: --character owl|bull 이 필요합니다.");
  process.exit(2);
}

let scenes;
let hookType = arg("hook-type");
if (arg("scenes")) {
  scenes = JSON.parse(fs.readFileSync(arg("scenes"), "utf8")).map((t) => (typeof t === "string" ? t : t.narration));
} else if (arg("tts-script")) {
  const json = JSON.parse(fs.readFileSync(arg("tts-script"), "utf8"));
  scenes = scenesFromTtsScript(json);
  hookType = hookType ?? json.hookType ?? null;
} else if (arg("spec-module") && arg("spec-export")) {
  const mod = await import(pathToFileURL(path.resolve("scripts", arg("spec-module"))).href);
  const spec = mod[arg("spec-export")];
  scenes = spec.scenes.map((s) => s.narration);
  hookType = hookType ?? spec.hookType ?? null;
} else {
  console.error("ABORT: --scenes, --tts-script 또는 --spec-module/--spec-export 가 필요합니다.");
  process.exit(2);
}

const result = checkScriptStandards({ character, scenes, hookType });
console.log(`\n${formatScriptStandardsReport(result)}`);
process.exit(result.fix.length ? 1 : 0);
