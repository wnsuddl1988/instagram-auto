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
 * 스토리형: --format story 를 붙이거나, TTS 스크립트에 formatProfile "story_v1"이 있으면 자동으로 스토리형 기준
 *   (_story-script-standards.mjs, `_ai/story-format-structure-v1.md` v3)으로 검사한다(2026-10-07).
 * scenes.json = 씬별 narration 문자열 배열. 종료 코드: 반드시 수정 있으면 1.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { checkScriptStandards, formatScriptStandardsReport, scenesFromTtsScript } from "./_script-standards.mjs";
import { checkStoryScriptStandards, formatStoryScriptStandardsReport, loadStoryLedger } from "./_story-script-standards.mjs";

const argv = process.argv.slice(2);
const arg = (n, d = null) => (argv.includes(`--${n}`) ? argv[argv.indexOf(`--${n}`) + 1] : d);
const character = arg("character");
if (!["owl", "bull"].includes(character)) {
  console.error("ABORT: --character owl|bull 이 필요합니다.");
  process.exit(2);
}

let scenes;
let hookType = arg("hook-type");
let format = arg("format");
if (format && format !== "story") {
  console.error("ABORT: --format 은 story 만 허용합니다.");
  process.exit(2);
}
// 스토리형: 지난 편과 문장 틀 비교용 대본 경로, 설계 파일(§9). --design 으로 직접 주거나 TTS 스크립트의 storyDesignPath.
let scenesPath = null;
let designPath = arg("design");
let requireDesign = false;
if (arg("scenes")) {
  scenesPath = arg("scenes");
  scenes = JSON.parse(fs.readFileSync(arg("scenes"), "utf8")).map((t) => (typeof t === "string" ? t : t.narration));
} else if (arg("tts-script")) {
  const json = JSON.parse(fs.readFileSync(arg("tts-script"), "utf8"));
  scenes = scenesFromTtsScript(json);
  hookType = hookType ?? json.hookType ?? null;
  if (json.formatProfile === "story_v1") {
    format = "story";
    scenesPath = json.storyScenesPath ?? null;
    designPath = designPath ?? json.storyDesignPath ?? null;
    // 2026-10-07: 스토리형 TTS는 설계 파일이 있어야 한다(관심·긴장·반전·의미·출처를 건너뛰지 못하게). 이 규칙 이전에 TTS를 마친 1편은 대상 아님.
    requireDesign = !json.storyDesignExempt;
  }
} else if (arg("spec-module") && arg("spec-export")) {
  const mod = await import(pathToFileURL(path.resolve("scripts", arg("spec-module"))).href);
  const spec = mod[arg("spec-export")];
  scenes = spec.scenes.map((s) => s.narration);
  hookType = hookType ?? spec.hookType ?? null;
} else {
  console.error("ABORT: --scenes, --tts-script 또는 --spec-module/--spec-export 가 필요합니다.");
  process.exit(2);
}

let result;
if (format === "story") {
  const design = designPath && fs.existsSync(designPath) ? JSON.parse(fs.readFileSync(designPath, "utf8")) : null;
  if (designPath && !design) console.error(`경고: 설계 파일을 찾지 못함 ${designPath}`);
  result = checkStoryScriptStandards({ scenes, scenesPath, priorEpisodes: loadStoryLedger(), design, requireDesign });
} else {
  result = checkScriptStandards({ character, scenes, hookType });
  // 2026-10-14: 녹음(유료) 전에 자막이 규칙 안에서 나뉘는지 본다(부엉 TTS 스크립트만 — 화면 표시 문장 captionDisplayText 기준).
  // 못 풀면 문장을 고친다(어미 띄어쓰기·어절 쪼개기). 불가피한 예외는 TTS 스크립트에 captionFitException: "<사유>"로 이 검사만 건너뛴다.
  if (character === "owl" && arg("tts-script")) {
    const json = JSON.parse(fs.readFileSync(arg("tts-script"), "utf8"));
    if (typeof json.captionFitException === "string" && json.captionFitException.trim()) {
      console.error(`[caption-fit] 예외로 통과(사유): ${json.captionFitException.trim()}`);
    } else {
      const { checkCaptionFit } = await import("./_caption-fit-check.mjs");
      const problems = checkCaptionFit(json.scenes.map((s) => s.captionDisplayText ?? s.narration));
      if (problems.length) result.fix.push(...problems.map((p) => `자막 분할 불가(어미를 띄우거나 어절을 나누도록 문장 수정): ${p}`));
      else result.pass?.push?.("자막 분할 점검(금지 경계·폭)");
    }
  }
}
console.log(`\n${format === "story" ? formatStoryScriptStandardsReport(result) : formatScriptStandardsReport(result)}`);
process.exit(result.fix.length ? 1 : 0);
