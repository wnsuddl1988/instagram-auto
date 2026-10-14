#!/usr/bin/env node
/**
 * Gemini(Veo 10초) 상시 감독(2026-10-14, Owner "제미나이도 한도 있는 건 계속 활용해").
 * 어제(10/13)의 실수 — 한도 소진 중 반복 실행 — 를 피하는 설계:
 *  - 5시간 창당 영상 4개 한도를 성공 기록(gemini-state.json)으로 추적해, 남은 한도만큼만 한 번에 맡긴다. 같은 창에서 재시도 루프 없음.
 *  - 한 개도 못 받으면(한도·동의 대화상자 등) 간격을 늘려 기다린다: 1회 연속 2.5시간, 2회 이상 5시간. 영구 중단하지 않고 계속 이어 간다.
 *  - Gemini의 내용 거부(refusal)는 한도가 아니므로 그 장면만 gemini-refused에 올려 다시 맡기지 않는다(Flow가 대신 만든다).
 * 대상(우선순위): ① 부엉박사 10초 카드 장면(--owl-eps, 뒤 장면 번호부터 — Flow 러너는 앞 장면부터라 겹치지 않음) ② 스토리형 10초 장면(--story-eps, 8초는 Flow 몫).
 * 중단: C:/tmp/money-shorts-os/flow-queue/STOP 파일(Flow 감독과 공용).
 * 사용: node scripts/gemini-clips-supervisor.mjs --owl-eps 33,32,31 --story-eps 25,24,23,22,21,20,19,18,17
 */
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const A = process.argv.slice(2);
const arg = (n, d) => { const i = A.indexOf(n); return i >= 0 ? A[i + 1] : d; };
const nums = (s) => (s || "").split(",").map(Number).filter(Boolean);
const OWL_EPS = nums(arg("--owl-eps", ""));
const STORY_EPS = nums(arg("--story-eps", ""));
const STATE_DIR = "C:/tmp/money-shorts-os/flow-queue";
const STOP = `${STATE_DIR}/STOP`;
const SKIP_FILE = `${STATE_DIR}/owl-skip.txt`;
const STATE_FILE = `${STATE_DIR}/gemini-state.json`;
const LOG = `${STATE_DIR}/gemini-supervisor.log`;
const ROOT = "C:/Users/PC/jjy/instagram-auto";
// Gemini 한도(Owner 10/14 확인): 5시간마다 **고정된 시각**에 초기화되고 창마다 영상 4개까지. 다음 초기화 17:10 KST → 22:10 → 03:10 → 08:10 → 13:10 → 18:10 …
// 기준 시각 + 5시간×N 으로 계산하므로 컴퓨터를 껐다 켜도 언제든 현재 창·다음 초기화를 알 수 있다(마지막 실행 시각과 무관).
const ANCHOR_MS = Date.parse("2026-10-14T17:10:00+09:00");
const WINDOW_MS = 5 * 3600 * 1000;
const QUOTA_PER_WINDOW = 4;
const windowStart = (t = Date.now()) => ANCHOR_MS + Math.floor((t - ANCHOR_MS) / WINDOW_MS) * WINDOW_MS;
const nextReset = (t = Date.now()) => windowStart(t) + WINDOW_MS;
const kst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(5, 16).replace("T", " ") + " KST";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => { const l = `[${new Date().toISOString()}] ${m}`; console.log(l); fs.appendFileSync(LOG, l + "\n"); };

// 상태: successes = [{ t(ms), n }], lastAttempt(ms), consecutiveZero, refused = ["owl32-3", "story20-5" …]
// 처음 시작할 때는 10/14 10:45 KST 실행(성공 3개)을 반영한다.
let state = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) : { successes: [{ t: Date.parse("2026-10-14T01:45:00Z"), n: 3 }], lastAttempt: Date.parse("2026-10-14T01:45:00Z"), consecutiveZero: 0, refused: ["owl32-3"] };
const save = () => fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 1));
save();

const readSkip = () => new Set(fs.existsSync(SKIP_FILE) ? fs.readFileSync(SKIP_FILE, "utf8").split(/\s+/).filter(Boolean) : []);
const writeSkip = (set) => fs.writeFileSync(SKIP_FILE, [...set].join("\n") + (set.size ? "\n" : ""));

function owlRows(ep) {
  const md = `${ROOT}/_ai/owl-ep${ep}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  return [...fs.readFileSync(md, "utf8").matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)]
    .map((m) => ({ scene: Number(m[1]), image: m[2], video: m[3], tier: Number(m[4]) }));
}
function storyRows(ep) {
  const md = `${ROOT}/_ai/story-ep${ep}-video-generation-prompts.md`;
  if (!fs.existsSync(md)) return [];
  return [...fs.readFileSync(md, "utf8").matchAll(/^\|\s*s(\d+) [^|]*\|\s*`([^`]+)`\s*\|[^|]*\|[^|]*\|\s*\*{0,2}(8|10)초\*{0,2}\s*\|/gm)]
    .map((m) => ({ scene: Number(m[1]), image: m[2], tier: Number(m[3]) }));
}
const owlClip = (ep, r) => `C:/tmp/owl-ep${ep}-videos/${r.video}`;
const storyClip = (ep, r) => `C:/tmp/money-shorts-os/story-clips-backup/ep${ep}/${r.scene}.mp4`;
const storyClipAlt = (ep, r) => `C:/Users/PC/Downloads/스토리 ${ep}편/${r.scene}.mp4`;

/** 맡길 후보 한 묶음(한 편의 10초 장면들, 뒤 번호부터). 없으면 null. */
function nextBatch(max) {
  const skip = readSkip();
  state.refusedRetried ??= [];
  for (const ep of OWL_EPS) {
    // 2026-10-14 Owner "오류 난 건 다시 시도하든지 프롬프트 바꿔서": 내용 거부 장면은 '문구 비인용' 프롬프트로 한 번 더 맡긴다(거부는 한도가 아니라 손해 없음).
    // 다시 거부되면 refusedRetried에 남아 더는 맡기지 않는다(Flow가 만든다). 재시도 장면은 같은 편 일반 장면보다 먼저, 따로 한 묶음으로 보낸다.
    const base = (r) => r.tier === 10 && !fs.existsSync(owlClip(ep, r)) && fs.existsSync(`C:/tmp/owl-ep${ep}-images/${r.image}`) && !skip.has(`${ep}-${r.scene}`);
    const retry = owlRows(ep).filter((r) => base(r) && state.refused.includes(`owl${ep}-${r.scene}`) && !state.refusedRetried.includes(`owl${ep}-${r.scene}`)).sort((a, b) => b.scene - a.scene);
    if (retry.length) return { kind: "owl", ep, scenes: retry.slice(0, max).map((r) => r.scene), rows: retry, noQuote: true };
    const c = owlRows(ep).filter((r) => base(r) && !state.refused.includes(`owl${ep}-${r.scene}`)).sort((a, b) => b.scene - a.scene);
    if (c.length) return { kind: "owl", ep, scenes: c.slice(0, max).map((r) => r.scene), rows: c };
  }
  for (const ep of STORY_EPS) {
    const c = storyRows(ep).filter((r) => r.tier === 10 && !fs.existsSync(storyClip(ep, r)) && !fs.existsSync(storyClipAlt(ep, r)) && fs.existsSync(`C:/tmp/story-ep${ep}-images/${r.image}`)
      && !state.refused.includes(`story${ep}-${r.scene}`)).sort((a, b) => b.scene - a.scene);
    if (c.length) return { kind: "story", ep, scenes: c.slice(0, max).map((r) => r.scene), rows: c };
  }
  return null;
}

/** 대상 10초 장면이 전부 클립이 있거나 Gemini 거부로 처리됐는지 */
function allHandled() {
  const owlDone = OWL_EPS.every((e) => owlRows(e).filter((r) => r.tier === 10).every((r) => fs.existsSync(owlClip(e, r)) || state.refused.includes(`owl${e}-${r.scene}`)));
  const storyDone = STORY_EPS.every((e) => storyRows(e).filter((r) => r.tier === 10).every((r) => fs.existsSync(storyClip(e, r)) || fs.existsSync(storyClipAlt(e, r)) || state.refused.includes(`story${e}-${r.scene}`)));
  return owlDone && storyDone;
}

function quotaLeft() { // 현재 창(고정 시각 기준)에서 만든 성공 수를 빼고 남은 한도
  const ws = windowStart();
  return Math.max(0, QUOTA_PER_WINDOW - state.successes.filter((s) => s.t >= ws).reduce((a, s) => a + s.n, 0));
}
function waitMs() { // 다음 시도까지 기다릴 시간
  const resetAt = nextReset() + 2 * 60e3; // 초기화 2분 뒤
  if (quotaLeft() === 0) return Math.max(0, resetAt - Date.now()); // 이 창 한도를 다 썼다 → 다음 초기화까지
  if (state.lastAttempt < windowStart()) state.consecutiveZero = 0; // 새 창이면 실패 기록 초기화
  if (state.consecutiveZero >= 2) return Math.max(0, resetAt - Date.now()); // 한 창에서 두 번 못 받으면 다음 창까지(반복 시도 금지)
  if (state.consecutiveZero === 1) return Math.max(0, state.lastAttempt + 30 * 60e3 - Date.now()); // 한 번 못 받았으면 30분 뒤 한 번만 더
  return Math.max(0, state.lastAttempt + 3 * 60e3 - Date.now()); // 시도 사이 최소 3분
}

const statusLine = () => `현재 창 ${kst(windowStart())} ~ ${kst(nextReset())} · 남은 한도 ${quotaLeft()}/${QUOTA_PER_WINDOW} · 다음 초기화 ${kst(nextReset())}(이후 ${[1, 2, 3].map((k) => kst(nextReset() + k * WINDOW_MS).slice(6, 11)).join(" → ")})`;
if (A.includes("--status")) { console.log(statusLine()); process.exit(0); } // 껐다 켠 뒤 확인용: node scripts/gemini-clips-supervisor.mjs --status
log(`Gemini 감독 시작 — 부엉 ${OWL_EPS.join(",") || "-"} / 스토리 ${STORY_EPS.join(",") || "-"} · ${statusLine()}`);
if (quotaLeft() === 0) closeGeminiChrome("시작 시점에 이 창 한도 4개 이미 사용");
while (!fs.existsSync(STOP)) {
  if (!nextBatch(1)) {
    // 맡길 후보가 없다: 10초 장면이 전부 만들어졌거나 거부 처리됐으면 끝, 아니면(예: 이미지가 아직 없음) 30분 뒤 다시 본다
    if (allHandled()) { log("모든 10초 장면 처리 완료 — 종료"); break; }
    log("지금 맡길 수 있는 10초 장면이 없음(이미지 대기 등) — 30분 뒤 다시 확인");
    await sleep(30 * 60e3);
    continue;
  }
  const w = waitMs();
  if (w > 0) { log(`다음 시도까지 ${Math.round(w / 60000)}분 대기(창 내 남은 한도 ${quotaLeft()}, 연속 실패 ${state.consecutiveZero})`); await sleep(Math.min(w, 30 * 60e3)); continue; }
  const left = Math.max(1, quotaLeft());
  const batch = nextBatch(left);
  const claims = batch.kind === "owl" ? batch.scenes.map((s) => `${batch.ep}-${s}`) : [];
  if (claims.length) { const sk = readSkip(); claims.forEach((c) => sk.add(c)); writeSkip(sk); } // Flow 러너가 건너뛰게
  const t0 = Date.now();
  log(`Gemini 실행 — ${batch.kind === "owl" ? "부엉" : "스토리"} ep${batch.ep} 장면 ${batch.scenes.join(",")} (한도 ${left}개)`);
  const outDir = batch.kind === "owl" ? `C:/tmp/owl-ep${batch.ep}-videos` : `C:/tmp/money-shorts-os/story-clips-backup/ep${batch.ep}`;
  fs.mkdirSync(outDir, { recursive: true });
  const env = { ...process.env, ALLOW_GEMINI_VEO: "1", ...(batch.kind === "owl" ? { OWL_EP: String(batch.ep) } : { STORY_EP: String(batch.ep) }), ...(batch.noQuote ? { GEMINI_NOQUOTE_SCENES: batch.scenes.join(",") } : {}) };
  if (batch.noQuote) { for (const s of batch.scenes) { const k = `${batch.kind}${batch.ep}-${s}`; if (!state.refusedRetried.includes(k)) state.refusedRetried.push(k); } save(); log(`내용 거부 장면 재시도(문구 비인용 프롬프트) — s${batch.scenes.join(",s")}`); }
  const sceneDict = batch.kind === "owl" ? "scripts/_owl-gemini-scenes.mjs:OWL_GEMINI_SCENES" : "scripts/_story-gemini-scenes.mjs:STORY_GEMINI_SCENES";
  let r;
  try {
    r = spawnSync(process.execPath, ["scripts/run-owl-veo-motion-submit-then-collect-v1.mjs", "--scenes", batch.scenes.map((s) => `s${s}`).join(","), "--scene-prompts", sceneDict, "--out-dir", outDir, "--owner-approved-once", "--collect-timeout-min", "12"], { cwd: ROOT, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 90 * 60 * 1000 });
  } finally {
    if (claims.length) { const sk = readSkip(); claims.forEach((c) => sk.delete(c)); writeSkip(sk); }
  }
  const out = `${r.stdout ?? ""}${r.stderr ?? ""}`;
  fs.appendFileSync(LOG, out.split("\n").slice(-30).join("\n") + "\n");
  const refusedNow = [...out.matchAll(/\b(s\d+): refusal 판정/g)].map((m) => Number(m[1].slice(1)));
  for (const s of refusedNow) { const key = `${batch.kind}${batch.ep}-${s}`; if (!state.refused.includes(key)) state.refused.push(key); }
  const got = batch.scenes.filter((s) => { const row = batch.rows.find((x) => x.scene === s); return row && fs.existsSync(batch.kind === "owl" ? owlClip(batch.ep, row) : storyClip(batch.ep, row)); }).length;
  state.lastAttempt = t0;
  if (got > 0) { state.successes.push({ t: t0, n: got }); state.consecutiveZero = 0; }
  else if (refusedNow.length === batch.scenes.length) { state.consecutiveZero = 0; } // 전부 내용 거부 — 한도 문제가 아니다
  else state.consecutiveZero += 1; // 한도·대화상자 등으로 못 받음
  save();
  log(`Gemini 종료 — 받은 ${got}/${batch.scenes.length}${refusedNow.length ? ` · 내용 거부 s${refusedNow.join(",s")}(Flow가 대신 생성)` : ""}${got === 0 && refusedNow.length < batch.scenes.length ? ` — 한 개도 못 받음(한도로 판단, 연속 ${state.consecutiveZero}회 → 간격 늘림)` : ""}`);
  // 2026-10-14 Owner "제미나이 다 쓰고 나면 크롬창도 닫아, 항상 켜 놓더라": 이 창 한도를 다 썼거나(성공 4개) 다음 창까지 기다리게 되면
  // Gemini 전용 크롬(AI-Gemini-1, 포트 9223)을 닫는다. 수거 시간 초과로 아직 생성 중인 장면이 있으면 성공에 안 잡혀 한도가 남으므로 닫지 않는다.
  // 다음 실행 때 run-owl-veo-motion-submit-then-collect-v1.mjs의 ensureChrome이 다시 띄운다.
  if (quotaLeft() === 0 || state.consecutiveZero >= 2) closeGeminiChrome(quotaLeft() === 0 ? "이 창 한도 4개 사용 완료" : "이 창에서 연속 실패 — 다음 창까지 대기");
  await sleep(60e3);
}
closeGeminiChrome("감독 종료");
log("Gemini 감독 종료");

function closeGeminiChrome(why) {
  const c = spawnSync(process.execPath, ["scripts/gemini-tabs-inspect-once.mjs", "--close-browser"], { cwd: ROOT, encoding: "utf8", timeout: 60e3 });
  log(`Gemini 크롬 닫기(${why}) — ${`${c.stdout ?? ""}${c.stderr ?? ""}`.trim().split("\n").pop()}`);
}
