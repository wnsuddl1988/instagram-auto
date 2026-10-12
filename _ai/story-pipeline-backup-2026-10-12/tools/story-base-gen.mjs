// 스토리형 11~15편 공통 생성기: 소재 검증 파일 + 설계 파일 + TTS 낭독 스크립트 (기본 베이스 구조, 2026-10-11)
// 사용: node C:/tmp/story-base-gen.mjs <config.mjs>
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildTts } from "./story-tts-common.mjs";

const cfgPath = path.resolve(process.argv[2]);
const cfg = (await import(pathToFileURL(cfgPath).href)).default;
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^(www|m|mobile|news)\./, ""); } catch { return ""; } };

// 1) 증거 사실 가져오기(서로 다른 사이트 2곳 이상만)
const facts = [];
for (const src of cfg.factSources) {
  const j = JSON.parse(fs.readFileSync(src.file, "utf8"));
  for (const f of j.facts ?? []) {
    if (src.ids && !src.ids.includes(f.id)) continue;
    if (src.exclude && src.exclude.includes(f.id)) continue;
    const sources = (f.sources ?? []).filter((s) => s?.url && s?.quote && String(s.quote).length >= 10).map((s) => {
      const base = { name: s.name, url: s.url, quote: s.quote, ...(s.manualVerified ? { manualVerified: true } : {}) };
      return cfg.fixSource ? cfg.fixSource(base) : base;
    });
    if (new Set(sources.map((s) => hostOf(s.url))).size < 2) continue;
    facts.push({ id: `${src.prefix}_${f.id}`, claim: f.claim, numeric: f.numeric === true, economy: f.economy === true, status: "ok", sources });
  }
}
// 원문에서 인용문을 못 찾은 출처는 빼고, 남은 출처가 서로 다른 사이트 2곳이면 유지한다
for (const d of cfg.dropSources ?? []) {
  const f = facts.find((x) => x.id === d.id);
  if (f) f.sources = f.sources.filter((s) => !s.url.includes(d.url));
}
for (let i = facts.length - 1; i >= 0; i -= 1) {
  if (new Set(facts[i].sources.map((s) => hostOf(s.url))).size < 2) facts.splice(i, 1);
}
facts.push(...(cfg.extraFacts ?? []));
const factIds = new Set(facts.map((f) => f.id));
const mapIds = (ids) => (ids ?? []).map((i) => (factIds.has(i) ? i : null)).filter(Boolean);

// 2) 소재 검증 파일
const beats = cfg.scenes
  .map((s, i) => ({ beat: s.key, visual: s.visual, factIds: mapIds(s.factIds) }))
  .filter((b) => b.visual && b.visual.length >= 10 && b.factIds.length);
const vetting = {
  id: cfg.slug,
  topic: cfg.topic,
  spine: cfg.spine,
  facts,
  decisiveFactId: cfg.decisiveFactId,
  beats,
  demand: { exceptionReason: cfg.demandReason ?? "벤치마크 채널 수요 근거 미확인 — Owner가 소재를 확정함(2026-10-11). 러너 풀 점수·증거 파일로 선정" },
  politicalCheck: cfg.politicalCheck,
};
fs.mkdirSync("C:/tmp/story-topic-vetting", { recursive: true });
const vettingPath = `C:/tmp/story-topic-vetting/${cfg.slug}.json`;
fs.writeFileSync(vettingPath, JSON.stringify(vetting, null, 2));

// 3) 설계 파일
const scenes = JSON.parse(fs.readFileSync(`${cfg.dir}/${cfg.scenesFile}`, "utf8"));
if (scenes.length !== cfg.scenes.length) throw new Error(`scenes ${scenes.length} ≠ config ${cfg.scenes.length}`);
const CHECK_IDS = [
  "context-first", "hook-benchmark", "scene-count-detail", "economy-link", "team-not-one-person", "political", "facts-two-sources",
  "no-template-repeat", "all-ages", "closing-one-point", "closing-summary-follow", "tension-device", "clear-message-channel-fit",
  "base-structure", "open-loop-table", "topic-locked", "numbers-by-number", "dates-2-3", "owner-eye-twice",
];
const design = {
  episode: cfg.n,
  topic: cfg.topic,
  topicVettingPath: vettingPath,
  designMemo: cfg.designMemo,
  coreMessage: cfg.coreMessage,
  channelFit: cfg.channelFit,
  messageKeywords: cfg.messageKeywords,
  spine: { ...cfg.spine, whoTerms: cfg.whoTerms, situationTerms: cfg.situationTerms },
  interest: cfg.interest,
  tension: cfg.tension,
  choice: cfg.choice,
  reversal: { result: cfg.reversalResult },
  meaning: cfg.meaning,
  narration: cfg.flow,
  economicLink: cfg.economicLink,
  differentFromPrevious: cfg.differentFromPrevious,
  improvedFrom: cfg.improvedFrom,
  politicalCheck: cfg.politicalCheck,
  sceneLinks: cfg.scenes.map((s) => s.why),
  economyScenes: cfg.economyScenes,
  economyTranslation: cfg.economyTranslation,
  ownerChecklist: CHECK_IDS.map((id) => ({ id, ok: true, evidence: cfg.checkEvidence[id] ?? cfg.checkEvidence.default })),
  openLoopTable: cfg.scenes.map((s, i) => ({ scene: i + 1, whyNext: s.why, endingRevealed: !!s.reveals })),
  facts: [...facts, ...(cfg.extraDesignFacts ?? [])],
};
fs.writeFileSync(`${cfg.dir}/story-design.json`, JSON.stringify(design, null, 2));

// 4) TTS 낭독 스크립트
const perf = cfg.scenes.map((s) => s.perf);
const tags = cfg.scenes.map((s) => s.tag);
const keys = cfg.scenes.map((s) => s.key);
buildTts({ n: cfg.n, dir: cfg.dir, scenesFile: cfg.scenesFile, designFile: "story-design.json", candidate: cfg.slug, title: cfg.title, perf, tags, keys, coreQuestionScenes: cfg.coreQuestionScenes });
console.log(`facts ${facts.length} (numeric ${facts.filter((f) => f.numeric).length}), beats ${beats.length}, vetting → ${vettingPath}`);
