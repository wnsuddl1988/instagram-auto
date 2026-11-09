#!/usr/bin/env node
/**
 * 스토리형 배경음 생성 — ElevenLabs Music 1회 호출 (2026-10-07 Owner "1번 3번 진행해" 승인).
 * 배경음은 스토리형만 쓴다(설명형은 배경음 없음, 규칙 19). 편마다 소재·박자에 맞춰 새로 만든다(`_ai/story-format-structure-v1.md` §8).
 *
 * 입력 계획(json, 미디어 폴더 안):
 *   { "label": "story-ep1-gold", "positiveGlobalStyles": [...], "negativeGlobalStyles": [...],
 *     "sections": [{ "name": "crisis", "positive": [...], "negative": [...], "durationMs": 21000 }, ...] }
 *   섹션 길이 합 = 완성 음성 길이(1.15배 처리 뒤). 가사 없음(연주곡 강제).
 *
 * 안전: 호출 1회 예산 — 출력 폴더에 결과가 이미 있으면 다시 부르지 않는다. 키는 no-log 래퍼로만 주입, 출력에 남기지 않는다.
 * 사용: node scripts/run-owner-command-with-local-env-no-log.mjs story-bgm --plan <plan.json> --out-dir <미디어 폴더> --arm
 */

import fs from "node:fs";
import path from "node:path";

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const PLAN = arg("--plan");
const OUT = arg("--out-dir");
const ARMED = process.argv.includes("--arm");
if (!PLAN || !OUT || !fs.existsSync(PLAN)) {
  console.error("ABORT: --plan <plan.json> --out-dir <폴더> 필요");
  process.exit(2);
}
const plan = JSON.parse(fs.readFileSync(PLAN, "utf8"));
const sections = Array.isArray(plan.sections) ? plan.sections : [];
const totalMs = sections.reduce((s, x) => s + Number(x.durationMs || 0), 0);
const problems = [];
if (!sections.length || sections.length > 8) problems.push("섹션 1~8개");
for (const s of sections) {
  if (!(s.durationMs >= 3000 && s.durationMs <= 120000)) problems.push(`섹션 ${s.name} 길이 ${s.durationMs}ms(3~120초)`);
  if (!Array.isArray(s.positive) || !s.positive.length) problems.push(`섹션 ${s.name} positive 비어 있음`);
}
if (totalMs < 10000 || totalMs > 150000) problems.push(`전체 ${totalMs}ms(10~150초)`);
if (problems.length) {
  console.error("ABORT 계획 검증 실패: " + problems.join(" · "));
  process.exit(2);
}

const label = String(plan.label || "story-bgm").replace(/[^\w.-]/g, "_");
fs.mkdirSync(OUT, { recursive: true });
const audioOut = path.join(OUT, `${label}.bgm.mp3`);
const resultOut = path.join(OUT, `${label}.bgm-result.json`);
// 실패 기록(ok:false, 예: 키 권한 없음 401 — 과금 없음)만 있으면 다시 부를 수 있다. 성공 결과가 있으면 막는다.
const priorOk = fs.existsSync(resultOut) && JSON.parse(fs.readFileSync(resultOut, "utf8")).ok === true;
if (fs.existsSync(audioOut) || priorOk) {
  console.error(`ABORT: 이미 생성됨(호출 1회 예산) — ${audioOut}. 다시 만들려면 Owner 승인 후 새 폴더로.`);
  process.exit(2);
}

const compositionPlan = {
  positive_global_styles: plan.positiveGlobalStyles ?? [],
  negative_global_styles: [...new Set([...(plan.negativeGlobalStyles ?? []), "vocals", "singing", "lyrics", "spoken word"])],
  sections: sections.map((s) => ({
    section_name: s.name,
    positive_local_styles: s.positive,
    negative_local_styles: s.negative ?? [],
    duration_ms: Math.round(s.durationMs),
    lines: [],
  })),
};

console.log(`=== 스토리형 배경음 ${label} — 섹션 ${sections.length}개 · ${(totalMs / 1000).toFixed(1)}초 ===`);
for (const s of sections) console.log(`  ${s.name}: ${(s.durationMs / 1000).toFixed(1)}초 · ${s.positive.join(", ")}`);
if (!ARMED) {
  console.log("DRY-RUN: --arm 없이 호출하지 않음");
  process.exit(0);
}
const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("ABORT: 자격증명 없음 — no-log 래퍼로 실행");
  process.exit(2);
}

const res = await fetch("https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128", {
  method: "POST",
  headers: { "xi-api-key": apiKey, "content-type": "application/json", accept: "audio/mpeg" },
  body: JSON.stringify({ composition_plan: compositionPlan, model_id: "music_v1" }),
});
const meta = { label, requestedAt: new Date().toISOString(), status: res.status, totalMs, sections: sections.map((s) => ({ name: s.name, durationMs: s.durationMs })), plan: PLAN };
if (!res.ok) {
  const text = (await res.text()).slice(0, 600);
  fs.writeFileSync(resultOut, JSON.stringify({ ...meta, ok: false, error: text }, null, 2) + "\n");
  console.error(`FAIL: HTTP ${res.status} — ${text}`);
  process.exit(1);
}
const buf = Buffer.from(await res.arrayBuffer());
fs.writeFileSync(audioOut, buf);
fs.writeFileSync(resultOut, JSON.stringify({ ...meta, ok: true, audioPath: audioOut, bytes: buf.length }, null, 2) + "\n");
console.log(`OK 배경음 ${audioOut} (${(buf.length / 1024).toFixed(0)}KB)`);
