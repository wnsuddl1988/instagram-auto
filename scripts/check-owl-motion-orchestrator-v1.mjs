#!/usr/bin/env node

/**
 * 오케스트레이터 폴백 분기 검증 — 실제 Gemini/Flow 호출 없이 exit 코드만 흉내낸다.
 *
 * 실제 러너를 스텁으로 갈아끼우고(임시 디렉토리에 같은 파일명으로 배치), 시나리오별
 * 종료 코드와 산출물 생성 여부를 조작해 오케스트레이터가 의도대로 분기하는지 본다.
 * 크레딧이나 API 한도를 전혀 쓰지 않는다.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const REPO = process.cwd();
const ORCHESTRATOR = path.join(REPO, "scripts/run-owl-motion-orchestrator-v1.mjs");
// Windows 절대경로는 ESM import에서 file:// URL이어야 한다(c:\... 는 프로토콜로 오인됨).
const SCENES_MODULE_URL = pathToFileURL(path.join(REPO, "scripts/_owl-veo-scene-prompts.mjs")).href;

let passed = 0;
let failed = 0;
function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

/**
 * 스텁 러너를 만든다. behavior 맵: sceneKey -> { exit, createOutput }
 * 실제 러너와 같은 인터페이스(--scene, --out-dir)를 받아 동작을 흉내낸다.
 */
function writeStub(filePath, behaviorByScene) {
  const src = `
import fs from "node:fs";
import path from "node:path";
import { OWL_VEO_SCENES } from ${JSON.stringify(SCENES_MODULE_URL)};
const argv = process.argv;
function arg(n) { const i = argv.indexOf(n); return i !== -1 ? argv[i + 1] : null; }
const scene = arg("--scene");
const outDir = arg("--out-dir");
const behavior = ${JSON.stringify(behaviorByScene)};
const b = behavior[scene] ?? { exit: 0, createOutput: true };
// 호출 횟수를 기록해 재시도 동작을 검증할 수 있게 한다.
const callLog = path.join(outDir, "_calls.log");
fs.mkdirSync(outDir, { recursive: true });
fs.appendFileSync(callLog, scene + "\\n");
const callCount = fs.readFileSync(callLog, "utf8").split("\\n").filter((l) => l === scene).length;
const eff = Array.isArray(b) ? (b[callCount - 1] ?? b[b.length - 1]) : b;
if (eff.createOutput) {
  fs.writeFileSync(path.join(outDir, OWL_VEO_SCENES[scene].outputName), "stub");
}
process.exit(eff.exit);
`;
  fs.writeFileSync(filePath, src, "utf8");
}

function runScenario(name, { geminiBehavior, flowBehavior, scenes }) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "owl-orch-test-"));
  const geminiDir = path.join(tmp, "gemini");
  const flowDir = path.join(tmp, "flow");
  const finalDir = path.join(tmp, "final");
  const reportPath = path.join(tmp, "report.json");

  // 스텁을 scripts/ 안에 임시 이름으로 두고, 오케스트레이터가 참조하는 경로를
  // 환경변수로 바꿀 수 없으므로 복사본 오케스트레이터를 만들어 경로만 치환한다.
  const geminiStub = path.join(tmp, "stub-gemini.mjs");
  const flowStub = path.join(tmp, "stub-flow.mjs");
  writeStub(geminiStub, geminiBehavior);
  writeStub(flowStub, flowBehavior);

  const orchSrc = fs.readFileSync(ORCHESTRATOR, "utf8")
    .replace('const GEMINI_RUNNER = "scripts/run-owl-veo-motion-execute-once-v1.mjs";',
      `const GEMINI_RUNNER = ${JSON.stringify(geminiStub.replace(/\\/g, "/"))};`)
    .replace('const FLOW_RUNNER = "scripts/run-owl-flow-motion-execute-once-v1.mjs";',
      `const FLOW_RUNNER = ${JSON.stringify(flowStub.replace(/\\/g, "/"))};`)
    .replace('import { OWL_VEO_SCENES } from "./_owl-veo-scene-prompts.mjs";',
      `import { OWL_VEO_SCENES } from ${JSON.stringify(SCENES_MODULE_URL)};`);
  const orchCopy = path.join(tmp, "orch.mjs");
  fs.writeFileSync(orchCopy, orchSrc, "utf8");

  const result = spawnSync(process.execPath, [
    orchCopy,
    "--scenes", scenes.join(","),
    "--gemini-out-dir", geminiDir,
    "--flow-out-dir", flowDir,
    "--final-dir", finalDir,
    "--report", reportPath,
    "--owner-approved-once",
  ], { env: { ...process.env, ALLOW_GEMINI_VEO: "1" }, encoding: "utf8" });

  const report = fs.existsSync(reportPath) ? JSON.parse(fs.readFileSync(reportPath, "utf8")) : null;
  return { result, report, finalDir, tmp };
}

console.log("시나리오 1: Gemini가 3번째 장면에서 quota(exit 3) — 이후 전부 Flow로 전환");
{
  const scenes = ["s1_hook", "s2_loss_aversion", "s3_evidence_card", "s4_background"];
  const { report } = runScenario("quota-switch", {
    geminiBehavior: {
      s1_hook: { exit: 0, createOutput: true },
      s2_loss_aversion: { exit: 0, createOutput: true },
      s3_evidence_card: { exit: 3, createOutput: false },
      s4_background: { exit: 3, createOutput: false },
    },
    flowBehavior: {
      s3_evidence_card: { exit: 0, createOutput: true },
      s4_background: { exit: 0, createOutput: true },
    },
    scenes,
  });
  check("리포트 생성됨", report !== null);
  check("geminiExhausted=true", report?.geminiExhausted === true);
  check("s1/s2는 gemini", report?.results[0].provider === "gemini" && report?.results[1].provider === "gemini");
  check("s3는 flow로 전환", report?.results[2].provider === "flow", JSON.stringify(report?.results[2]));
  check("s4도 flow(재시도 없이 바로)", report?.results[3].provider === "flow");
  check("전체 성공", report?.failed === 0, JSON.stringify(report?.results));
}

console.log("시나리오 2: Gemini 일시 실패(exit 1) 후 재시도로 성공 — Flow로 안 넘어감");
{
  const { report } = runScenario("retry-success", {
    geminiBehavior: {
      // 1회차 실패(산출물 없음), 2회차 성공
      s1_hook: [{ exit: 1, createOutput: false }, { exit: 0, createOutput: true }],
    },
    flowBehavior: { s1_hook: { exit: 0, createOutput: true } },
    scenes: ["s1_hook"],
  });
  check("gemini로 성공", report?.results[0].provider === "gemini", JSON.stringify(report?.results[0]));
  check("geminiExhausted=false", report?.geminiExhausted === false);
}

console.log("시나리오 3: Gemini 2회 연속 실패 — 그 장면만 Flow로 넘어감(전체 전환은 아님)");
{
  const { report } = runScenario("persistent-fail", {
    geminiBehavior: {
      s1_hook: [{ exit: 1, createOutput: false }, { exit: 1, createOutput: false }],
      s2_loss_aversion: { exit: 0, createOutput: true },
    },
    flowBehavior: { s1_hook: { exit: 0, createOutput: true } },
    scenes: ["s1_hook", "s2_loss_aversion"],
  });
  check("s1은 flow로 폴백", report?.results[0].provider === "flow", JSON.stringify(report?.results[0]));
  check("s2는 다시 gemini(전체 전환 아님)", report?.results[1].provider === "gemini");
  check("geminiExhausted=false", report?.geminiExhausted === false);
}

console.log("시나리오 4: exit 1이지만 산출물은 생성됨 — 성공으로 간주, 재시도/폴백 없음");
{
  const { report } = runScenario("output-despite-fail", {
    geminiBehavior: { s1_hook: { exit: 1, createOutput: true } },
    flowBehavior: { s1_hook: { exit: 0, createOutput: true } },
    scenes: ["s1_hook"],
  });
  check("gemini 성공 처리", report?.results[0].provider === "gemini", JSON.stringify(report?.results[0]));
  check("note에 근거 기록", report?.results[0].note === "output_present_despite_nonzero_exit");
}

console.log("시나리오 5: exit 2(가드 오류) — 즉시 전체 중단");
{
  const { report } = runScenario("guard-abort", {
    geminiBehavior: {
      s1_hook: { exit: 2, createOutput: false },
      s2_loss_aversion: { exit: 0, createOutput: true },
    },
    flowBehavior: {},
    scenes: ["s1_hook", "s2_loss_aversion"],
  });
  check("aborted=true", report?.aborted === true);
  check("s2는 시도조차 안 함", report?.results.length === 1, JSON.stringify(report?.results));
}

console.log("시나리오 6: 최종 폴더 수집 — 성공한 장면이 final dir로 복사됨");
{
  const { report, finalDir } = runScenario("collect", {
    geminiBehavior: { s1_hook: { exit: 0, createOutput: true } },
    flowBehavior: {},
    scenes: ["s1_hook"],
  });
  check("final dir에 파일 존재", fs.existsSync(path.join(finalDir, "owl_s1_hook_motion.mp4")));
  check("리포트에 finalDir 기록", typeof report?.finalDir === "string");
}

console.log("");
console.log(`결과: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
