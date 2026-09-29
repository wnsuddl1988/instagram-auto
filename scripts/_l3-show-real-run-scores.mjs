import { readFileSync } from "node:fs";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const response = JSON.parse(readFileSync(new URL("../_ai/live-topic-runs/2026-09-15T15-20-11-679Z-llm-response-v2.json", import.meta.url), "utf8"));
const evidenceJson = JSON.parse(readFileSync(new URL("../_ai/live-topic-runs/2026-09-15T15-20-11-679Z-evidence-pack.json", import.meta.url), "utf8"));

const probe = `
import { scoreAndRankCandidates } from "./live-topic-score.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";

const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();
const response: any = ${JSON.stringify(response)};
const evidencePack: any = ${JSON.stringify(evidenceJson.evidencePack)};

const scores = scoreAndRankCandidates(response.candidates, evidencePack, cutline, registry);
process.stdout.write(JSON.stringify(scores));
`;

const scores = runTsProbe({
  root: ROOT, probeDir: "lib/editorial-v2", probeSource: probe,
  extraJsFiles: ["live-topic-score.js", "live-topic-cutline-check.js", "live-evidence-adapter.js", "live-topic-prompt.js"],
});

console.log("=== 실제 라이브 실행 응답 채점 상세 ===\n");
for (const s of scores) {
  console.log(`${s.candidateId}  총점 ${s.total}/${s.totalPossible}`);
  for (const item of s.items) {
    const pts = item.points === null ? "—" : item.points;
    console.log(`  ${item.id} [${pts}] (${item.confidence})  ${item.rationale}`);
  }
  console.log();
}
