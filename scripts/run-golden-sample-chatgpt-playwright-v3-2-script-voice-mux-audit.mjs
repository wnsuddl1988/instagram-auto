#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs
// task: golden-sample-chatgpt-playwright-v3-2-script-voice-impact-rework
//
// v3.1 visual-only(banknote patch) 후보 기반 TTS-first 파이프라인:
//   TTS(ElevenLabs one-shot with-timestamps, live guard) → phrase/word 타이밍
//   → scene 경계=phrase 온셋, overlay 진입=word 앵커로 timeline reflow
//   → accepted v3.1 Pillow overlay elements 그대로 재렌더(내용 무변경)
//   → ffmpeg 2-pass visual → mux → post-render artifact audit.
//
// 원칙: 오디오가 타임라인 주인 / scene별 TTS 금지 / padding·atempo·hard-trim 금지
//       / 고정 길이 목표 금지 / env read-only·secret 미출력 / uploadReady=false.
// 사용: node scripts/run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs --allow-live-tts
//       (기존 narration+alignment 있으면 API 미호출 재사용)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CONFIG_PATH = join(__dirname, "fixtures", "golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json");

const argv = process.argv.slice(2);
const ALLOW_LIVE_TTS_FLAG = argv.includes("--allow-live-tts");

// ── stage 경계 (Owner 승인 slice: golden-sample-v3-2-live-tts-audio-elevenlabs-run-v1) ──
// --stage tts-audio-only: Script Impact Gate → TTS(기존 audio 재사용 우선) → timing/
// alignment/reflow/timing summary + audio-only artifact audit까지만 수행.
// renderVisual/Pillow/mux/frame 추출은 render/mux 승인 slice 전까지 실행 금지.
const stageArgIdx = argv.indexOf("--stage");
const STAGE = stageArgIdx === -1 ? "full" : (argv[stageArgIdx + 1] ?? "");
if (STAGE !== "full" && STAGE !== "tts-audio-only" && STAGE !== "render-mux-only") {
  console.error("ABORT: unknown --stage value — 지원: tts-audio-only, render-mux-only"); process.exit(2);
}
const TTS_AUDIO_ONLY = STAGE === "tts-audio-only";
// ── stage 경계 (Owner 승인 slice: golden-sample-v3-2-live-render-mux-run-v1) ──
// --stage render-mux-only: 기존 accepted narration+alignment 재사용(stageTts 진입 금지) +
// Pillow/frame render 1회 + 로컬 mux/artifact audit 1회만 수행. env/secret/.env.local read,
// 외부 API/provider 호출, image/browser/upload 경로 진입 전면 금지 (fail-closed).
// 명시 승인 CLI gate --allow-render-mux 없이는 실행 불가.
const RENDER_MUX_ONLY = STAGE === "render-mux-only";
const ALLOW_RENDER_MUX_FLAG = argv.includes("--allow-render-mux");
if (RENDER_MUX_ONLY && !ALLOW_RENDER_MUX_FLAG) {
  console.error("ABORT: --stage render-mux-only requires explicit --allow-render-mux approval flag"); process.exit(2);
}
if (RENDER_MUX_ONLY && ALLOW_LIVE_TTS_FLAG) {
  console.error("ABORT: --allow-live-tts must not be combined with render-mux-only (이 stage는 TTS 금지)"); process.exit(2);
}
// TTS-only 승인 경로 env/secret allowlist — 아래 3개 외 어떤 env/secret 값도 읽지 않는다.
// (ELEVENLABS_MODEL_ID·후보별 voice env key 조회 금지 — manifest default/단일 키 사용)
const TTS_ONLY_ENV_ALLOWLIST = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ALLOW_ELEVENLABS"];

const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const blueprint = JSON.parse(readFileSync(join(REPO_ROOT, cfg.baseBlueprint), "utf8"));
if (blueprint.schemaVersion !== "golden_sample_story_blueprint_v3_1_banknote_patch") {
  console.error("ABORT: blueprint v3_1 schema 불일치"); process.exit(2);
}
const FPS = cfg.reflow.frameGridFps;
const r2 = (v) => Math.round(v * 100) / 100;

const outAbs = resolve(cfg.outputPaths.outDir);
if (!/^C:\\+tmp\\+/i.test(cfg.outputPaths.outDir)) { console.error("ABORT: out-dir must be under C:\\tmp"); process.exit(2); }
mkdirSync(outAbs, { recursive: true });
if (!TTS_AUDIO_ONLY) {
  mkdirSync(join(outAbs, "overlays"), { recursive: true });
  mkdirSync(join(outAbs, "frames"), { recursive: true });
}
const P = (name) => join(outAbs, cfg.outputPaths[name]);

function fail(msg, code = 1) { console.error("ABORT: " + msg); process.exit(code); }
function ffprobeJson(args) {
  const r = spawnSync("ffprobe", ["-v", "error", ...args, "-of", "json"], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}
function runFfmpeg(args, label, capture = false) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 && !capture) fail(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1400)}`, 4);
  return r;
}

// ── image gate (blueprint v3_1 md5 — accepted 이미지 무변경 보증) ─────────────
const IMAGES = {};
for (const s of blueprint.selected_image_set) {
  const p = join(REPO_ROOT, s.path);
  if (!existsSync(p)) fail(`이미지 미존재: ${s.path}`, 12);
  const md5 = crypto.createHash("md5").update(readFileSync(p)).digest("hex");
  if (md5 !== s.md5) fail(`md5 불일치: ${s.imageId}`, 12);
  IMAGES[s.imageId] = p;
}
console.log(`── image gate: ${Object.keys(IMAGES).length}/9 md5 OK (v3.1 accepted set) ──`);

// ── env (read-only — 값 미출력, mask만) ──────────────────────────────────────
function loadEnvLocal() {
  let content;
  try { content = readFileSync(join(REPO_ROOT, ".env.local"), "utf-8"); } catch { return {}; }
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    result[t.slice(0, i).trim()] = v;
  }
  if (TTS_AUDIO_ONLY) {
    // 승인된 allowlist 외 secret 값은 메모리에도 보관하지 않는다 (fail-closed 축소)
    const filtered = {};
    for (const k of TTS_ONLY_ENV_ALLOWLIST) if (k in result) filtered[k] = result[k];
    return filtered;
  }
  return result;
}
// render-mux-only 승인 경로(RENDER_MUX_NO_ENV_READ): .env.local 파싱 자체를 생략하고
// env() 접근을 전면 fail-closed 차단한다 — 이 stage에서 필요한 env/secret은 0개다.
const envLocal = RENDER_MUX_ONLY ? {} : loadEnvLocal();
const env = (k) => {
  if (RENDER_MUX_ONLY) {
    fail(`env key '${k}' read blocked — render-mux-only stage는 어떤 env/secret 값도 읽지 않는다`, 21);
  }
  if (TTS_AUDIO_ONLY && !TTS_ONLY_ENV_ALLOWLIST.includes(k)) {
    fail(`env key '${k}' is not in the approved TTS-only allowlist — 승인 외 env/secret read 차단`, 21);
  }
  return process.env[k] ?? envLocal[k] ?? undefined;
};
const mask = (id) => (!id || id.length <= 6 ? "***" : id.slice(0, 3) + "***" + id.slice(-3));

// ── narration ────────────────────────────────────────────────────────────────
const phrasesDef = cfg.narration.phrases.map((p) => ({ phraseId: p.phraseId, beat: p.beat, text: p.text }));
const narrationText = phrasesDef.map((p) => p.text).join(" ");

// ══════════════════════════════════════════════════════════════════════════
// STAGE TTS — one-shot with-timestamps (live guard, budget cfg.tts.apiCallBudgetMax)
// ══════════════════════════════════════════════════════════════════════════
const audioPath = P("narrationAudio");
const alignPath = P("alignmentRaw");

function liveTtsAllowed() {
  const envVal = (env(cfg.tts.allowEnvKey) ?? "").trim().toLowerCase();
  return ALLOW_LIVE_TTS_FLAG || envVal === "1" || envVal === "true";
}

async function stageTts() {
  if (cfg.tts.reuseExistingAudioIfPresent && existsSync(audioPath) && existsSync(alignPath)) {
    console.log("── STAGE TTS: 기존 narration + alignment 재사용 (API 미호출) ──");
    return { reused: true, httpStatus: null };
  }
  if (cfg.tts.requireLiveTtsGuard !== false && !liveTtsAllowed()) {
    fail(`live ElevenLabs TTS requires ${cfg.tts.allowEnvKey}=1 or ${cfg.tts.allowCliFlag}`, 20);
  }
  console.log(`── live TTS guard 통과 (${cfg.tts.allowCliFlag} / ${cfg.tts.allowEnvKey}) ──`);
  const apiKey = env("ELEVENLABS_API_KEY");
  let voiceId = null, voiceSource = null;
  // TTS-only 승인 경로: ELEVENLABS_VOICE_ID 단일 키만 (후보별 voice env key 조회 금지)
  const voiceResolutionKeys = TTS_AUDIO_ONLY ? ["ELEVENLABS_VOICE_ID"] : cfg.tts.voiceResolutionOrder;
  for (const k of voiceResolutionKeys) {
    const v = env(k);
    if (v && v.trim()) { voiceId = v.trim(); voiceSource = k; break; }
  }
  // TTS-only 승인 경로: model id env read 금지 — manifest default 고정
  const modelId = TTS_AUDIO_ONLY ? cfg.tts.modelIdDefault : (env(cfg.tts.modelIdEnvKey) ?? cfg.tts.modelIdDefault);
  console.log("── STAGE TTS: ElevenLabs one-shot full narration (with-timestamps) ──");
  console.log(`  apiKey configured: ${!!apiKey}  voice: ${voiceId ? mask(voiceId) : "(missing)"} (source: ${voiceSource ?? "none"})`);
  console.log(`  model: ${modelId}  preset: ${cfg.tts.voicePresetId}  chars: ${[...narrationText].length}`);
  if (!apiKey || !voiceId) fail("ElevenLabs env 누락 — API 호출 없이 중단. mock/fallback 대체 금지.", 11);
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${cfg.tts.outputFormat}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text: narrationText, model_id: modelId, voice_settings: cfg.tts.voiceSettings }),
    });
  } catch (e) { fail(`fetch 실패: ${e.message} (no retry)`, 12); }
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable)");
    fail(`ElevenLabs API ${res.status} (no retry). error(truncated): ${errText.slice(0, 200)}`, 12);
  }
  const body = await res.json();
  if (!body.audio_base64 || !body.alignment?.characters?.length) fail("with-timestamps 응답에 audio/alignment 없음", 12);
  writeFileSync(audioPath, Buffer.from(body.audio_base64, "base64"));
  writeFileSync(alignPath, JSON.stringify({
    schemaVersion: "elevenlabs_alignment_raw_v3_2",
    note: "character-level alignment (secret 없음)",
    alignment: body.alignment,
    normalizedAlignment: body.normalized_alignment ?? null,
  }, null, 2) + "\n", "utf8");
  console.log(`  HTTP ${res.status} → audio ${Buffer.from(body.audio_base64, "base64").length} bytes, alignment chars=${body.alignment.characters.length}`);
  return { reused: false, httpStatus: res.status };
}

// ══════════════════════════════════════════════════════════════════════════
// TIMING — alignment → phrase/word/anchor + silence
// ══════════════════════════════════════════════════════════════════════════
function silencedetect(mediaPath) {
  const G = cfg.audioQualityGates;
  const r = runFfmpeg(["-i", mediaPath, "-map", "0:a:0", "-af", `silencedetect=noise=${G.silencedetectNoiseDb}dB:d=${G.silencedetectMinSilenceSec}`, "-f", "null", "-"], "silencedetect", true);
  const silences = [];
  let cur = null;
  for (const line of (r.stderr || "").split(/\r?\n/)) {
    const ms = line.match(/silence_start:\s*([\d.]+)/);
    const me = line.match(/silence_end:\s*([\d.]+)/);
    if (ms) cur = parseFloat(ms[1]);
    if (me && cur != null) { silences.push([cur, parseFloat(me[1])]); cur = null; }
  }
  return silences;
}

function buildTiming() {
  const raw = JSON.parse(readFileSync(alignPath, "utf8"));
  const al = raw.alignment;
  const chars = al.characters, starts = al.character_start_times_seconds, ends = al.character_end_times_seconds;
  const joined = chars.join("");
  const textMatches = joined === narrationText;

  const phrases = [];
  let cursor = 0;
  for (const p of phrasesDef) {
    const idx = joined.indexOf(p.text, cursor);
    if (idx === -1) fail(`alignment에서 phrase 미발견: ${p.phraseId}`, 13);
    const endIdx = idx + p.text.length - 1;
    phrases.push({ ...p, startIdx: idx, endIdx, audioStartSec: r2(starts[idx]), audioEndSec: r2(ends[endIdx]) });
    cursor = endIdx + 1;
  }
  function anchor(needle, phraseId) {
    const ph = phrases.find((p) => p.phraseId === phraseId);
    const idx = joined.indexOf(needle, ph.startIdx);
    if (idx === -1 || idx > ph.endIdx) fail(`word anchor '${needle}' not in ${phraseId}`, 13);
    return { word: needle, phraseId, startSec: r2(starts[idx]), endSec: r2(ends[idx + needle.length - 1]) };
  }
  const speechEndSec = r2(ends[ends.length - 1]);
  const speechStartSec = r2(starts[0]);
  const probe = ffprobeJson(["-show_entries", "format=duration", audioPath]);
  const audioFileDurationSec = r2(parseFloat(probe?.format?.duration ?? "0"));

  const silRaw = silencedetect(audioPath);
  const silences = silRaw.map(([a, b]) => [r2(a), r2(Math.min(b, speechEndSec))]).filter(([a, b]) => b > a);
  const silenceTotal = r2(silences.reduce((s, [a, b]) => s + (b - a), 0));
  const first5 = r2(silences.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, 5) - Math.min(a, 5)), 0));
  const gaps = phrases.slice(1).map((p, i) => r2(p.audioStartSec - phrases[i].audioEndSec));

  return {
    textMatches, phrases, anchor, speechStartSec, speechEndSec, audioFileDurationSec,
    silence: {
      detector: `silencedetect noise=${cfg.audioQualityGates.silencedetectNoiseDb}dB d=${cfg.audioQualityGates.silencedetectMinSilenceSec}`,
      windows: silences,
      totalWithinSpeechSec: silenceTotal,
      first5sSilenceSec: first5,
      totalSilenceRatio: r2(silenceTotal / speechEndSec * 100) / 100,
      speechActiveRatio: r2((speechEndSec - silenceTotal) / speechEndSec * 100) / 100,
      interPhraseGapsSec: gaps,
      maxInterPhraseGapSec: gaps.length ? Math.max(...gaps) : 0,
    },
  };
}

// ══════════════════════════════════════════════════════════════════════════
// REFLOW — scene 경계=phrase 온셋 / overlay=word 앵커
// ══════════════════════════════════════════════════════════════════════════
// 장면 정적 파라미터: accepted v3.1 renderer와 동일 (img/zoom/eq — 타이밍만 재계산)
const SCENE_STATIC = [
  { id: "s1", img: "img_41_hook_envelope_vs_empty_jar_krw",       zs: 1.02, ze: 1.08, eq: "brightness=-0.04:contrast=1.0:saturation=1.04" },
  { id: "s2", img: "img_32_problem_wallet_check_night",           zs: 1.03, ze: 1.08, eq: "brightness=-0.06:contrast=1.0:saturation=1.02" },
  { id: "s3", img: "img_43_causeA_orderly_fixed_outflow_krw",     zs: 1.02, ze: 1.08, eq: "brightness=-0.04:contrast=1.01:saturation=1.02" },
  { id: "s4", img: "img_34_causeB_scattered_lifestyle_spend",     zs: 1.03, ze: 1.09, eq: "brightness=-0.06:contrast=1.0:saturation=1.02" },
  { id: "s5", img: "img_45_illusion_one_bill_vs_receipt_wall_krw",zs: 1.02, ze: 1.07, eq: "brightness=-0.05:contrast=1.02:saturation=1.0" },
  { id: "s6", img: "img_36_reframe_three_empty_jars",             zs: 1.06, ze: 1.02, eq: "brightness=0.02:contrast=1.0:saturation=1.03" },
  { id: "s7", img: "img_47_actionA_dividing_into_jars_krw",       zs: 1.03, ze: 1.08, eq: "brightness=0.0:contrast=1.0:saturation=1.04" },
  { id: "s8", img: "img_48_actionB_three_jars_color_ribbons_krw", zs: 1.02, ze: 1.07, eq: "brightness=0.0:contrast=1.0:saturation=1.05" },
  { id: "s9", img: "img_39_result_settled_morning_shelf",         zs: 1.06, ze: 1.02, eq: "brightness=0.03:contrast=1.0:saturation=1.05" },
];

function buildReflow(T) {
  const ph = Object.fromEntries(T.phrases.map((p) => [p.phraseId, p]));
  let videoEnd = Math.max(T.speechEndSec + cfg.reflow.holdAfterSpeechSec, T.audioFileDurationSec + 0.12);
  videoEnd = r2(Math.ceil(videoEnd * FPS) / FPS);
  const tailHold = r2(videoEnd - T.speechEndSec);

  // scene 경계 = phrase 발화 시작 (s1은 0에서 시작)
  const phraseIds = phrasesDef.map((p) => p.phraseId);
  const starts = phraseIds.map((id, i) => (i === 0 ? 0 : r2(ph[id].audioStartSec)));
  const scenes = SCENE_STATIC.map((s, i) => ({
    ...s, t0: starts[i], t1: i === SCENE_STATIC.length - 1 ? videoEnd : starts[i + 1],
    phraseId: phraseIds[i], beat: phrasesDef[i].beat,
  }));
  scenes.forEach((s) => { if (s.t1 - s.t0 < 1.2) fail(`scene ${s.id} 길이 ${r2(s.t1 - s.t0)}s < 1.2s — 발화 리듬 재검토 필요`, 14); });

  // overlay 진입 = word 앵커 (clamp: sceneStart+0.05 ~ sceneEnd-minDwell)
  const sceneByPhrase = Object.fromEntries(scenes.map((s) => [s.phraseId, s]));
  const overlays = [];
  const evidence = [];
  for (const a of cfg.overlayAnchorPlan.anchors) {
    const sc = sceneByPhrase[a.phraseId];
    const minDwell = a.minDwellSec ?? cfg.overlayAnchorPlan.minDwellSec;
    let entry, anchorInfo = null;
    if (a.word) {
      const w = T.anchor(a.word, a.phraseId);
      entry = Math.min(Math.max(w.startSec, sc.t0 + 0.05), sc.t1 - minDwell);
      anchorInfo = { anchorWord: w.word, wordStartSec: w.startSec, wordEndSec: w.endSec, entryDeltaMs: Math.round((entry - w.startSec) * 1000) };
    } else {
      entry = r2(sc.t0 + (a.sceneEntryOffsetSec ?? 0.1));
      anchorInfo = { anchorWord: null, anchorType: "scene_entry_offset", entryDeltaMs: 0 };
    }
    entry = r2(entry);
    const end = sc.t1;
    if (end - entry < minDwell - 0.01) fail(`overlay ${a.id} dwell ${r2(end - entry)}s < ${minDwell}s`, 14);
    overlays.push({ id: a.id, start: entry, end, sceneId: sc.id });
    evidence.push({
      overlayId: a.id, sceneId: sc.id, phraseId: a.phraseId, entrySec: entry, endSec: end,
      dwellSec: r2(end - entry), ...anchorInfo,
    });
  }
  // story gate: '세 개' 발화 시각에 slot 3개 전부 표시 중이어야 함
  const g = cfg.overlayAnchorPlan.storyGateAnchor;
  const w3 = T.anchor(g.word, g.phraseId);
  const slotEntries = overlays.filter((o) => /ab_slot/.test(o.id)).map((o) => o.start);
  const threeVisibleWhenSpoken = slotEntries.every((s) => s <= w3.startSec + 0.001);

  return { scenes, overlays, evidence, videoEnd, tailHold, threeVisibleWhenSpoken, threeSpokenAtSec: w3.startSec, slotEntries };
}

// ══════════════════════════════════════════════════════════════════════════
// RENDER — accepted v3.1 overlay elements 재사용 + 2-pass ffmpeg
// ══════════════════════════════════════════════════════════════════════════
function renderVisual(R) {
  const specSrc = resolve(cfg.overlaySpecSource);
  if (!existsSync(specSrc)) fail(`overlay spec 미존재: ${specSrc} — accepted v3.1 elements 없이는 재작성 금지`, 15);
  const spec = JSON.parse(readFileSync(specSrc, "utf8"));
  const byId = Object.fromEntries(spec.overlays.map((o) => [o.id, o]));
  for (const o of R.overlays) if (!byId[o.id]) fail(`overlay spec에 ${o.id} 없음`, 15);

  // ── RENDER_MUX_PRE_OUTPUT_GATES: font vendoring + safe-frame — 출력물 생성 전 중단 ──
  // 기준: pillow renderer contract (canvas 1080x1920, textMaxY 1580, graphicMaxY 1632,
  // 승인 폰트 NotoSansKR-VF.ttf/Black, silent fallback 금지, bbox 누락 침묵 skip 금지)
  if (RENDER_MUX_ONLY) {
    const fontOk = typeof spec.fontFile === "string" && /NotoSansKR-VF\.ttf$/i.test(spec.fontFile)
      && existsSync(spec.fontFile) && spec.variation === "Black";
    if (!fontOk) fail("font vendoring fail: 승인 폰트(NotoSansKR-VF.ttf / Black) 미충족 — silent fallback 금지, render 출력 전 중단", 33);
    const sfViolations = [];
    for (const o of R.overlays) {
      for (const el of byId[o.id].elements) {
        const t = el.type;
        if (t === "text") {
          if (typeof el.y !== "number" || typeof el.fs !== "number" || typeof el.x !== "number") { sfViolations.push(`${o.id}:text geometry 누락`); continue; }
          const yCheck = (el.anchor ?? "mm").startsWith("t") ? el.y + el.fs : el.y;
          if (yCheck > 1580 || el.y < 0 || el.x < 0 || el.x > 1080) sfViolations.push(`${o.id}:text yCheck=${yCheck} x=${el.x}`);
        } else if (t === "runs") {
          if (typeof el.y !== "number" || typeof el.cx !== "number") { sfViolations.push(`${o.id}:runs geometry 누락`); continue; }
          if (el.y > 1580 || el.y < 0 || el.cx < 0 || el.cx > 1080) sfViolations.push(`${o.id}:runs y=${el.y} cx=${el.cx}`);
        } else if (t === "rect" || t === "rrect") {
          if (typeof el.y2 !== "number" || typeof el.y1 !== "number") { sfViolations.push(`${o.id}:${t} geometry 누락`); continue; }
          if (el.y2 > 1632 || el.y1 < 0 || el.x1 < 0 || el.x2 > 1080) sfViolations.push(`${o.id}:${t} y2=${el.y2}`);
        } else if (t === "poly") {
          const ys = (el.pts ?? []).map((p) => p[1]), xs = (el.pts ?? []).map((p) => p[0]);
          if (!ys.length) { sfViolations.push(`${o.id}:poly pts 누락`); continue; }
          if (Math.max(...ys) > 1632 || Math.min(...ys) < 0 || Math.min(...xs) < 0 || Math.max(...xs) > 1080) sfViolations.push(`${o.id}:poly maxY=${Math.max(...ys)}`);
        } else {
          sfViolations.push(`${o.id}: 미지원 element type '${t}' — 침묵 skip 금지`);
        }
      }
    }
    if (sfViolations.length) fail(`safe-frame fail (${sfViolations.length}건) — render 출력 전 중단:\n  ` + sfViolations.join("\n  "), 34);
    console.log("── render pre-output gates: font vendoring OK + safe-frame OK (text<=1580 / graphic<=1632 / x 0..1080) ──");
  }

  // Pillow 재렌더 (elements 내용 무변경 — 신규 outdir로만)
  const newSpec = { ...spec, outDir: join(outAbs, "overlays").replace(/\\/g, "/"), overlays: R.overlays.map((o) => ({ ...byId[o.id] })) };
  const specPath = join(outAbs, "overlay_spec.v3_1_tts.json");
  writeFileSync(specPath, JSON.stringify(newSpec, null, 2), "utf8");
  const PY = `
import json, sys
from PIL import Image, ImageDraw, ImageFont
spec = json.load(open(sys.argv[1], encoding="utf-8"))
def font(sz):
    f = ImageFont.truetype(spec["fontFile"], sz)
    f.set_variation_by_name(spec["variation"])
    return f
def col(c):
    if isinstance(c, list): return tuple(c)
    c = c.lstrip("#"); return (int(c[0:2],16), int(c[2:4],16), int(c[4:6],16), 255)
for o in spec["overlays"]:
    img = Image.new("RGBA", (1080, 1920), (0,0,0,0))
    d = ImageDraw.Draw(img)
    for el in o["elements"]:
        t = el["type"]
        if t == "rect": d.rectangle([el["x1"], el["y1"], el["x2"], el["y2"]], fill=col(el["fill"]))
        elif t == "rrect": d.rounded_rectangle([el["x1"], el["y1"], el["x2"], el["y2"]], radius=el.get("r", 20), fill=col(el["fill"]))
        elif t == "poly": d.polygon([tuple(p) for p in el["pts"]], fill=col(el["fill"]))
        elif t == "text":
            d.text((el["x"], el["y"]), el["text"], font=font(el["fs"]), fill=col(el["fill"]),
                   anchor=el.get("anchor", "mm"), stroke_width=el.get("stroke", 0), stroke_fill=(0,0,0,255))
        elif t == "runs":
            f = font(el["fs"])
            total = sum(d.textlength(r["t"], font=f) for r in el["runs"])
            x = el["cx"] - total/2
            for r in el["runs"]:
                d.text((x, el["y"]), r["t"], font=f, fill=col(r["fill"]), anchor="lm",
                       stroke_width=el.get("stroke", 0), stroke_fill=(0,0,0,255))
                x += d.textlength(r["t"], font=f)
    img.save(spec["outDir"] + "/" + o["file"])
print("OVERLAYS", len(spec["overlays"]))
`;
  const pr = spawnSync("python", ["-", specPath], { shell: false, encoding: "utf8", input: PY, timeout: 180000 });
  if (pr.status !== 0) fail(`pillow overlays failed:\n${(pr.stderr || "").slice(-1200)}`, 4);
  console.log("  " + pr.stdout.trim());

  // pass1 — 배경 (zoompan per-scene duration)
  console.log("── ffmpeg pass1: background (TTS-anchored durations) ──");
  const bgPath = join(outAbs, "bg_track_tts.mp4");
  {
    const inputs = [], chains = [];
    R.scenes.forEach((sc, i) => {
      inputs.push("-i", IMAGES[sc.img]);
      const frames = Math.round((sc.t1 - sc.t0) * FPS);
      chains.push(
        `[${i}:v]scale=2160:3840:force_original_aspect_ratio=increase:flags=lanczos,crop=2160:3840,` +
        `zoompan=z='${sc.zs}+(${sc.ze}-${sc.zs})*on/${frames}':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},` +
        `eq=${sc.eq},setsar=1[sc${i}]`
      );
    });
    const concatIn = R.scenes.map((_, i) => `[sc${i}]`).join("");
    runFfmpeg(["-y", ...inputs, "-filter_complex", chains.join(";") + `;${concatIn}concat=n=${R.scenes.length}:v=1:a=0[bg]`,
      "-map", "[bg]", "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", bgPath], "pass1");
  }

  // pass2 — overlay 합성 (fade/slide 규칙은 v3.1과 동일)
  console.log("── ffmpeg pass2: overlays (word-anchored windows) ──");
  const visualMp4 = P("visualMp4");
  {
    const inputs = ["-i", bgPath];
    const parts = [];
    R.overlays.forEach((o, i) => {
      inputs.push("-framerate", String(FPS), "-loop", "1", "-t", o.end.toFixed(2), "-i", join(outAbs, "overlays", byId[o.id].file));
      const fadeOut = o.end < R.videoEnd - 0.05 ? `,fade=out:st=${(o.end - 0.14).toFixed(2)}:d=0.14:alpha=1` : "";
      parts.push(`[${i + 1}:v]format=rgba,fade=in:st=${o.start.toFixed(2)}:d=0.22:alpha=1${fadeOut}[f${i}]`);
    });
    let prev = "[0:v]";
    R.overlays.forEach((o, i) => {
      const yExpr = `-14*max(0\\,1-(t-${o.start.toFixed(2)})/0.25)`;
      const outLbl = i === R.overlays.length - 1 ? "[vout]" : `[v${i}]`;
      parts.push(`${prev}[f${i}]overlay=x=0:y=${yExpr}:enable='between(t,${o.start.toFixed(2)},${o.end.toFixed(2)})'${outLbl}`);
      prev = `[v${i}]`;
    });
    runFfmpeg(["-y", ...inputs, "-filter_complex", parts.join(";"), "-map", "[vout]",
      "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
      "-movflags", "+faststart", "-t", R.videoEnd.toFixed(2), "-an", visualMp4], "pass2");
  }
  return visualMp4;
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════
// ── SCRIPT IMPACT GATE — live TTS 호출 전 필수 통과 (실패 시 TTS 없이 abort) ──
{
  const g = cfg.scriptImpactGate;
  const failures = [];
  for (const [k, min] of Object.entries(g.required)) {
    const v = g.selfAssessment[k];
    if (typeof v !== "number" || v < min) failures.push(`${k}=${v} < required ${min}`);
  }
  for (const [k, v] of Object.entries(g.hardFailCheck)) {
    if (v === true) failures.push(`hard_fail: ${k}`);
  }
  const gateReport = {
    schemaVersion: "script_impact_gate_report_v3_2",
    taskId: cfg.taskId,
    evaluatedNarration: phrasesDef.map((p) => ({ phraseId: p.phraseId, beat: p.beat, text: p.text })),
    required: g.required,
    selfAssessment: g.selfAssessment,
    rationale: g.rationale,
    hardFailCheck: g.hardFailCheck,
    failures,
    verdict: failures.length === 0 ? "PASS" : "FAIL",
    ttsAllowed: failures.length === 0,
    note: "gate FAIL이면 runner가 live TTS fetch 진입 전에 중단한다 (boundary.noLiveTtsBeforeScriptGate).",
  };
  writeFileSync(P("scriptImpactGateReport"), JSON.stringify(gateReport, null, 2) + "\n", "utf8");
  if (failures.length) fail("Script Impact Gate FAIL — TTS 호출 없이 중단:\n  " + failures.join("\n  "), 30);
  console.log("── Script Impact Gate PASS (6/6 required, hard fail 0) — TTS stage 진입 허용 ──");
}

// render-mux-only: stageTts() 진입 금지 — 기존 accepted narration/alignment 실재만 검증 (fail-closed).
// TTS 재생성/API 호출/env read 없이 재사용만 허용. 파일이 없으면 즉시 중단 (재생성 승인 없음).
function renderMuxAudioReuseGate() {
  if (!existsSync(audioPath) || !existsSync(alignPath)) {
    fail("render-mux-only requires existing accepted narration+alignment — TTS 재생성 승인 없음, 즉시 중단", 22);
  }
  console.log("── STAGE AUDIO(reuse-only): 기존 accepted narration + alignment 사용 (TTS/API/env 미접근) ──");
  return { reused: true, httpStatus: null };
}
const ttsResult = RENDER_MUX_ONLY ? renderMuxAudioReuseGate() : await stageTts();
const T = buildTiming();
console.log(`\n── TIMING ── textMatch=${T.textMatches} speechStart=${T.speechStartSec}s speechEnd=${T.speechEndSec}s audioFile=${T.audioFileDurationSec}s`);
console.log(`  phrases: ${T.phrases.map((p) => `${p.phraseId}@${p.audioStartSec}-${p.audioEndSec}`).join(" ")}`);
console.log(`  silence: total=${T.silence.totalWithinSpeechSec}s ratio=${T.silence.totalSilenceRatio} first5s=${T.silence.first5sSilenceSec}s active=${T.silence.speechActiveRatio} maxGap=${T.silence.maxInterPhraseGapSec}s`);

const R = buildReflow(T);
console.log(`\n── REFLOW ── videoEnd=${R.videoEnd}s tailHold=${R.tailHold}s threeVisibleWhenSpoken=${R.threeVisibleWhenSpoken}`);
console.log(`  scenes: ${R.scenes.map((s) => `${s.id}@${s.t0}-${s.t1}`).join(" ")}`);

// ── TTS-only audio artifact audit (mux 없이 narration 오디오 자체 기준 판정) ──
let ttsOnlyAudioAudit = null;
if (TTS_AUDIO_ONLY) {
  const G = cfg.audioQualityGates;
  const clipped = T.audioFileDurationSec < T.speechEndSec - 0.02;
  ttsOnlyAudioAudit = {
    schemaVersion: "tts_audio_only_artifact_audit_v3_2",
    note: "TTS-only 승인 slice의 audio artifact audit — narration 오디오 자체 기준 5개 서브체크 + textMatch. tailHold 판정은 mux 단계 속성으로 이연(DEFERRED_TO_MUX_SLICE).",
    beginningSilenceSec: T.speechStartSec, beginningPass: T.speechStartSec <= G.beginningSilenceMaxSec,
    first5sSilenceSec: T.silence.first5sSilenceSec, first5sPass: T.silence.first5sSilenceSec <= G.first5sSilenceMaxSec,
    totalSilenceRatio: T.silence.totalSilenceRatio, ratioPass: T.silence.totalSilenceRatio <= G.totalSilenceRatioMax,
    speechActiveRatio: T.silence.speechActiveRatio, speechActivePass: T.silence.speechActiveRatio >= G.speechActiveRatioMin,
    clippedTail: clipped, notClippedTailPass: !clipped,
    alignmentTextMatchesSentText: T.textMatches,
    tailHoldSec: R.tailHold, tailHoldJudgement: "DEFERRED_TO_MUX_SLICE",
  };
  ttsOnlyAudioAudit.verdict =
    ttsOnlyAudioAudit.beginningPass && ttsOnlyAudioAudit.first5sPass && ttsOnlyAudioAudit.ratioPass &&
    ttsOnlyAudioAudit.speechActivePass && ttsOnlyAudioAudit.notClippedTailPass && T.textMatches ? "PASS" : "FAIL";
}

// render manifest fixture (repo)
const manifest = {
  schemaVersion: "golden_sample_visual_render_manifest_t1_v3_2_tts_anchored",
  taskId: cfg.taskId,
  status: "tts_anchored_render_candidate",
  basedOnBlueprint: cfg.baseBlueprint,
  basedOnVisualOnly: cfg.acceptedVisualOnlyMp4,
  createdAt: "2026-07-03",
  fullDurationSec: R.videoEnd,
  ttsTimingSource: "elevenlabs_character_alignment_word_timing_v1",
  ttsTimingNote: `scene 경계=phrase 발화 시작, overlay 진입=word 시작 앵커(±${cfg.reflow.captionEntryToleranceMs}ms). 무음 padding/atempo/hard-trim 없음. tail hold ${R.tailHold}s.`,
  ttsEvidence: {
    narrationAudio: cfg.outputPaths.narrationAudio, alignmentRaw: cfg.outputPaths.alignmentRaw,
    timingSummary: cfg.outputPaths.timingSummary, speechEndSec: T.speechEndSec,
    audioFileDurationSec: T.audioFileDurationSec, tailHoldSec: R.tailHold, wordTimingAvailable: true,
  },
  narration: T.phrases.map((p) => ({ phraseId: p.phraseId, beat: p.beat, audioStartSec: p.audioStartSec, audioEndSec: p.audioEndSec, text: p.text })),
  scenes: R.scenes.map((s) => ({ id: s.id, img: s.img, beat: s.beat, phraseId: s.phraseId, startSec: s.t0, endSec: s.t1, zs: s.zs, ze: s.ze, eq: s.eq })),
  overlays: R.overlays,
  overlayAnchorEvidence: R.evidence,
  typography: { engine: "pillow_overlay", font: "Noto Sans KR Black (VF)", elementsSource: cfg.overlaySpecSource, elementsChanged: false, bottomFixedSubtitle: false },
  boundary: { paddingUsed: false, atempoUsed: false, hardTrimUsed: false, uploadReady: false },
};
writeFileSync(join(REPO_ROOT, cfg.outputPaths.ttsAnchoredManifestFixture), JSON.stringify(manifest, null, 2) + "\n", "utf8");

// timing summary + script preview + caption timeline (secret 없음)
writeFileSync(P("timingSummary"), JSON.stringify({
  schemaVersion: "elevenlabs_tts_timing_summary_v3_2",
  taskId: cfg.taskId, provider: "elevenlabs", ttsStrategy: cfg.tts.strategy, endpointKind: cfg.tts.endpointKind,
  liveApiCallPerformedThisRun: !ttsResult.reused, httpStatus: ttsResult.httpStatus,
  apiCallBudgetMax: cfg.tts.apiCallBudgetMax,
  modelId: (TTS_AUDIO_ONLY || RENDER_MUX_ONLY) ? cfg.tts.modelIdDefault : (env(cfg.tts.modelIdEnvKey) ?? cfg.tts.modelIdDefault), voicePresetId: cfg.tts.voicePresetId,
  voiceSettingsSanitized: cfg.tts.voiceSettings,
  generatedText: narrationText, generatedTextCharCount: [...narrationText].length,
  alignmentTextMatchesSentText: T.textMatches,
  actualAudioDurationSec: T.audioFileDurationSec, speechStartSec: T.speechStartSec, speechEndSec: T.speechEndSec,
  activeSpeechDurationSec: r2(T.speechEndSec - T.silence.totalWithinSpeechSec),
  silenceAudit: T.silence,
  phraseAlignment: T.phrases.map((p) => ({ phraseId: p.phraseId, beat: p.beat, text: p.text, audioStartSec: p.audioStartSec, audioEndSec: p.audioEndSec })),
  paddingUsed: false, atempoUsed: false, hardTrimUsed: false,
  noSecretEvidence: "API key/voice id 원문은 어떤 로그/파일에도 기록하지 않음",
  uploadReady: false,
  ...(TTS_AUDIO_ONLY ? { stage: "tts-audio-only", audioArtifactAuditTtsOnly: ttsOnlyAudioAudit } : {}),
  ...(RENDER_MUX_ONLY ? { stage: "render-mux-only", audioSource: "reused_existing_accepted_narration", liveTtsCallsThisRun: 0 } : {}),
}, null, 2) + "\n", "utf8");

writeFileSync(P("scriptPreview"), JSON.stringify({
  schemaVersion: "golden_sample_story_script_preview_v3_2",
  topicId: cfg.topicId, title: blueprint.title,
  narrationFullText: narrationText,
  chain: T.phrases.map((p, i) => ({
    order: i + 1, beat: p.beat, phraseId: p.phraseId, text: p.text,
    image: SCENE_STATIC[i].img, audioStartSec: p.audioStartSec, audioEndSec: p.audioEndSec,
  })),
  causalityNote: "월급인상→통장그대로(사실) → 고정비 선흡수 → 분산 소비 → 인상액만 기억(착시) → 돈의 자리 재해석 → 월급날 세 자리 분리(고정비 증가분/생활비 상한/남길 돈) → 체감은 자리에서",
}, null, 2) + "\n", "utf8");

writeFileSync(P("captionTimeline"), JSON.stringify({
  schemaVersion: "golden_sample_dynamic_caption_timeline_tts_anchored_v3_2",
  ttsTimingSource: manifest.ttsTimingSource,
  entryToleranceMs: cfg.reflow.captionEntryToleranceMs,
  bottomFixedSubtitleBarUsed: false,
  overlays: R.overlays,
  anchorEvidence: R.evidence,
  storyGate: { word: "세 개", spokenAtSec: R.threeSpokenAtSec, slotEntriesSec: R.slotEntries, threeVisibleWhenSpoken: R.threeVisibleWhenSpoken },
}, null, 2) + "\n", "utf8");

// ── TTS_AUDIO_ONLY_STOP_BEFORE_RENDER_MUX ──
// 승인 경계: tts-audio-only stage는 여기서 종료한다 — renderVisual/Pillow/2-pass 합성/
// mux/frame 추출/mux audit는 render/mux 승인 slice 전까지 실행 금지.
if (TTS_AUDIO_ONLY) {
  console.log(`\n── TTS-AUDIO-ONLY DONE (render/mux/frames 미실행) ──`);
  console.log(`  liveApiCallPerformedThisRun=${!ttsResult.reused} httpStatus=${ttsResult.httpStatus ?? "n/a(reused)"} apiCallBudgetMax=${cfg.tts.apiCallBudgetMax}`);
  console.log(`  audio audit: begin=${ttsOnlyAudioAudit.beginningSilenceSec}s first5s=${ttsOnlyAudioAudit.first5sSilenceSec}s ratio=${ttsOnlyAudioAudit.totalSilenceRatio} active=${ttsOnlyAudioAudit.speechActiveRatio} clipped=${ttsOnlyAudioAudit.clippedTail} textMatch=${ttsOnlyAudioAudit.alignmentTextMatchesSentText} → ${ttsOnlyAudioAudit.verdict}`);
  if (ttsOnlyAudioAudit.verdict !== "PASS") {
    fail("audio artifact audit FAIL — stop condition. 자동 재시도/2차 TTS 호출 금지, Codex 보고 필요.", 31);
  }
  process.exit(0);
}

// ── RENDER + MUX ──
const visualMp4 = renderVisual(R);
console.log("\n── STAGE MUX: visual + narration (no padding, no trim) ──");
const muxMp4 = P("muxMp4");
runFfmpeg(["-y", "-i", visualMp4, "-i", audioPath, "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", muxMp4], "mux");

// ── AUDIT ──
console.log("── STAGE AUDIT ──");
const probe = ffprobeJson(["-show_entries", "format=duration", "-show_entries", "stream=width,height,codec_name,codec_type,r_frame_rate", muxMp4]);
const vS = (probe?.streams || []).find((s) => s.codec_type === "video") || {};
const aS = (probe?.streams || []).filter((s) => s.codec_type === "audio");
const muxDur = r2(parseFloat(probe?.format?.duration ?? "0"));

const muxSilRaw = silencedetect(muxMp4);
const silWithinSpeech = muxSilRaw.map(([a, b]) => [r2(a), r2(Math.min(b, T.speechEndSec))]).filter(([a, b]) => b > a);
const muxSilTotal = r2(silWithinSpeech.reduce((s, [a, b]) => s + (b - a), 0));
const muxFirst5 = r2(silWithinSpeech.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, 5) - Math.min(a, 5)), 0));
const G = cfg.audioQualityGates;
const audioGates = {
  beginningSilenceSec: T.speechStartSec, beginningPass: T.speechStartSec <= G.beginningSilenceMaxSec,
  first5sSilenceSec: muxFirst5, first5sPass: muxFirst5 <= G.first5sSilenceMaxSec,
  totalSilenceWithinSpeechSec: muxSilTotal,
  totalSilenceRatio: r2(muxSilTotal / T.speechEndSec * 100) / 100,
  ratioPass: muxSilTotal / T.speechEndSec <= G.totalSilenceRatioMax,
  speechActiveRatio: r2((T.speechEndSec - muxSilTotal) / T.speechEndSec * 100) / 100,
  speechActivePass: (T.speechEndSec - muxSilTotal) / T.speechEndSec >= G.speechActiveRatioMin,
  tailHoldSec: R.tailHold, tailHoldPass: R.tailHold >= 0.3 && R.tailHold <= cfg.reflow.holdAfterSpeechMaxSec + 0.15,
  clippedTail: T.audioFileDurationSec < T.speechEndSec - 0.02,
  maxInterPhraseGapSec: T.silence.maxInterPhraseGapSec,
  paddingUsed: false, atempoUsed: false, hardTrimUsed: false,
};

// frames — scene별 진입+0.35 / 중간 + 마지막
const frameTimes = [];
R.scenes.forEach((s) => { frameTimes.push(r2(s.t0 + 0.35), r2((s.t0 + s.t1) / 2)); });
frameTimes.push(r2(R.videoEnd - 0.15));
const frames = [];
for (const t of frameTimes) {
  const fp = join(outAbs, "frames", `muxframe_${t.toFixed(2).replace(".", "_")}s.jpg`);
  runFfmpeg(["-y", "-ss", t.toFixed(2), "-i", muxMp4, "-frames:v", "1", "-q:v", "3", fp], `frame@${t}`);
  frames.push(fp);
}

const dwellMin = Math.min(...R.evidence.map((e) => e.dwellSec));
const entryDeltas = R.evidence.filter((e) => e.anchorWord).map((e) => e.entryDeltaMs);
const capPass = dwellMin >= 0.58 && R.evidence.every((e) => !e.anchorWord || Math.abs(e.entryDeltaMs) <= cfg.reflow.captionEntryToleranceMs || e.entryDeltaMs < 0);
const mediaPass = vS.width === 1080 && vS.height === 1920 && vS.codec_name === "h264" && vS.r_frame_rate === "30/1" && aS.length === 1 && Math.abs(muxDur - R.videoEnd) <= 0.25;
const audioPass = audioGates.beginningPass && audioGates.first5sPass && audioGates.ratioPass && audioGates.speechActivePass && audioGates.tailHoldPass && !audioGates.clippedTail;
const storyPass = R.threeVisibleWhenSpoken && T.textMatches;

const audit = {
  schemaVersion: "post_render_artifact_audit_tts_mux_v3_2",
  taskId: cfg.taskId, target: muxMp4,
  ffprobe: { width: vS.width, height: vS.height, codec: vS.codec_name, rFrameRate: vS.r_frame_rate, durationSec: muxDur, audioStreamCount: aS.length, pass: mediaPass },
  ffprobeNote: "media validity — quality pass 아님. audio/caption/story/vision 게이트 병행 필수",
  audio: audioGates,
  captionCard: {
    minDwellSec: dwellMin,
    entryDeltasMs: entryDeltas,
    wordAnchoredCount: R.evidence.filter((e) => e.anchorWord).length,
    sceneEntryCount: R.evidence.filter((e) => !e.anchorWord).length,
    bottomFixedSubtitleBarUsed: false,
    pass: capPass,
  },
  story: { threeVisibleWhenSpoken: R.threeVisibleWhenSpoken, threeSpokenAtSec: R.threeSpokenAtSec, slotEntriesSec: R.slotEntries, phraseBeatMap1to1: true, pass: storyPass },
  visual: { acceptedV31ElementsChanged: false, imageGate: "9/9 md5 OK", backgroundPipelineIdentical: true },
  frames,
  claudeVisionQa: { status: "PENDING" },
  gates: { media: mediaPass, audio: audioPass, captionCard: capPass, story: storyPass },
  verdict: mediaPass && audioPass && capPass && storyPass ? "PASS_CANDIDATE_PENDING_VISION_QA" : "FAIL",
  uploadReady: false,
  boundary: { noUpload: true, noImageGeneration: true, liveApiCallsThisRun: ttsResult.reused ? 0 : 1, paddingUsed: false },
  ...(RENDER_MUX_ONLY ? {
    stage: "render-mux-only",
    renderMuxRunEvidence: {
      renderPerformedThisRun: 1, renderCapMax: 1, muxPerformedThisRun: 1, muxCapMax: 1,
      costUsd: 0, liveApiCallsThisRun: 0, envSecretReadsThisRun: 0,
      ttsRegenerationPerformed: false, imageRegenerationPerformed: false,
      audioSource: "reused_existing_accepted_narration",
    },
  } : {}),
};
writeFileSync(P("auditReport"), JSON.stringify(audit, null, 2) + "\n", "utf8");

console.log(`\n── DONE ──`);
console.log(`  mux: ${muxMp4}`);
console.log(`  probe: ${vS.width}x${vS.height} ${vS.codec_name} ${vS.r_frame_rate} ${muxDur}s audio=${aS.length} → mediaPass=${mediaPass}`);
console.log(`  audio: begin=${audioGates.beginningSilenceSec}s first5s=${audioGates.first5sSilenceSec}s ratio=${audioGates.totalSilenceRatio} active=${audioGates.speechActiveRatio} tail=${audioGates.tailHoldSec}s clipped=${audioGates.clippedTail} → ${audioPass ? "PASS" : "FAIL"}`);
console.log(`  caption: minDwell=${dwellMin}s wordAnchored=${audit.captionCard.wordAnchoredCount} → ${capPass ? "PASS" : "FAIL"}   story(3개 gate): ${storyPass ? "PASS" : "FAIL"}`);
console.log(`  verdict: ${audit.verdict}`);

// ── RENDER_MUX_ONLY_AUDIT_FAIL_CLOSED: 게이트 FAIL이면 비정상 종료 (stop condition) ──
if (RENDER_MUX_ONLY) {
  console.log(`  render-mux-only: render 1/1 mux 1/1 cost $0 liveApiCalls 0 envSecretReads 0`);
  if (audit.verdict !== "PASS_CANDIDATE_PENDING_VISION_QA") {
    fail("post-render artifact audit FAIL — stop condition (media probe/audio/caption-card/story gate 중 실패). 자동 재시도/2차 render·mux 금지, Codex 보고 필요.", 32);
  }
}
