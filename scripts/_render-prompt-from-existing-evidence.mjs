// 기존 evidence pack 파일을 재사용해 강화된 live-topic-prompt를 다시 생성한다.
// 새 라이브 호출(ECOS/네이버) 없이 순수하게 "프롬프트 지시 변경 효과"만 비교하기 위함.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const [, , evidenceFile] = process.argv;
if (!evidenceFile) {
  console.log("사용법: node scripts/_render-prompt-from-existing-evidence.mjs <evidence-pack.json>");
  process.exit(1);
}

const evidenceJson = JSON.parse(readFileSync(evidenceFile, "utf8"));

const probe = `
import { buildLiveTopicPrompt } from "./live-topic-prompt.js";
import { loadCutlineConfig } from "./editorial-cutline.js";

const cutline = loadCutlineConfig();
const evidenceJson: any = ${JSON.stringify(evidenceJson)};
const evidencePack = evidenceJson.evidencePack;

const pkg = buildLiveTopicPrompt({
  projectId: "shorts-editorial-os-v2",
  evidencePack,
  cutline,
  blockedClaims: ["금리 급등락", "폭등", "폭락", "지금 대출", "지금 투자", "금리 전망"],
  candidateCount: 5,
  audience: evidenceJson.audience,
});

process.stdout.write(JSON.stringify({ packageId: pkg.packageId, instructions: pkg.instructions }));
`;

const result = runTsProbe({
  root: ROOT,
  probeDir: "lib/editorial-v2",
  probeSource: probe,
  extraJsFiles: ["live-topic-prompt.js"],
});

const outPath = evidenceFile.replace("-evidence-pack.json", "-prompt-v2.md");
const content = [
  `# Live topic prompt v2 (강화된 loss_aversion/twist 지시) — ${path.basename(evidenceFile)}`,
  "",
  `packageId: \`${result.packageId}\``,
  "",
  "동일한 evidence pack으로 재생성. loss_aversion/twist 장면 지시가 강화됨.",
  "",
  "```text",
  result.instructions,
  "```",
].join("\n");
writeFileSync(outPath, content, "utf8");
console.log(`OK — saved to ${outPath}`);
