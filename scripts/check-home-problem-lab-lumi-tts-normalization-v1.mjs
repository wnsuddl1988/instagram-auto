import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const source = readFileSync(resolve(root, "lib/home-problem-lab/tts-normalization.ts"), "utf8");
const fixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_lumi_tts_normalization.v1.json"), "utf8"));
const transpiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString("base64")}`;
const { normalizeLumiTtsText } = await import(moduleUrl);
const failures = fixture.cases
  .filter((item) => !item.expectedIncludes.every((value) => normalizeLumiTtsText(item.input).includes(value)))
  .map((item) => item.id);

if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_LUMI_TTS_NORMALIZATION_FAIL: ${failures.join(",")}`);
  process.exit(1);
}
console.log(`HOME_PROBLEM_LAB_LUMI_TTS_NORMALIZATION_PASS: ${fixture.cases.length} fixture cases`);
