#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-golden-sample-tts-first-mux-audit-v1.mjs
//
// GOLDEN SAMPLE — TTS-FIRST NARRATION + CAPTION RE-ANCHOR + MUX + AUDIT v1
// task: creative-v2-golden-sample-tts-first-mux-audit-v1
//
// 원칙 (HANDOFF_NOW / absolute rules):
//   1) TTS-first: 먼저 ElevenLabs one-shot full narration을 생성하고, 실제
//      character alignment(word/phrase timing)를 기준으로 visual timeline을
//      reflow한 v1.2 manifest를 생성 → 재render → mux. visual-only에 오디오만
//      얹지 않는다.
//   2) 무음 padding 금지: apad/atempo/hard-trim 없음. 부족하면 reflow, 초과분은
//      발화 이후 0.4~0.8s 자연 hold만 허용.
//   3) scene별 짧은 TTS 6개 concat 금지 — full narration one-shot 1회 호출.
//   4) caption 진입은 phrase 시작 ±120ms, 강조는 word timestamp ±80ms 앵커.
//      실제 근거(단어/시각)를 timeline JSON에 기록한다.
//   5) env는 read-only. key 값은 로그/파일에 절대 출력하지 않는다(masked만).
//   6) ffprobe pass만으로 quality pass 처리 금지 — silence/speech/caption/frame
//      audit이 함께 통과해야 PASS_CANDIDATE. uploadReady=false 고정.
//
// 사용:
//   node scripts/run-golden-sample-tts-first-mux-audit-v1.mjs [--stage all|tts|render|mux|audit]
//   (기존 narration.mp3 + alignment가 있으면 TTS API 호출은 스킵 — 예산 1회 보호)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const CONFIG_PATH = join(__dirname, "fixtures", "golden_sample_tts_first_mux_manifest.t2.v1.json");

const argv = process.argv.slice(2);
const stageIdx = argv.indexOf("--stage");
const STAGE = stageIdx >= 0 && argv[stageIdx + 1] ? argv[stageIdx + 1] : "all";
const ALLOW_LIVE_TTS_FLAG = argv.includes("--allow-live-tts");

const cfg = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
const baseManifest = JSON.parse(readFileSync(join(REPO_ROOT, cfg.baseVisualManifest), "utf8"));
const FPS = cfg.reflow.frameGridFps;

const outAbs = resolve(cfg.outputPaths.outDir);
if (!/^C:\\+tmp\\+/i.test(cfg.outputPaths.outDir)) { console.error("ABORT: out-dir must be under C:\\tmp"); process.exit(2); }
if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\")) { console.error("ABORT: out-dir must be outside repo"); process.exit(2); }
mkdirSync(outAbs, { recursive: true });

const r2 = (v) => Math.round(v * 100) / 100;
const P = (name) => join(outAbs, cfg.outputPaths[name]);

function ffprobeJson(args) {
  const r = spawnSync("ffprobe", ["-v", "error", ...args, "-of", "json"], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}
function runFfmpeg(args, label, captureStderr = false) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 600000, maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0 && !captureStderr) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
  return r;
}

// ── env (read-only, 기존 v2 TTS 스크립트와 동일 패턴 — 값 미출력) ────────────
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
  return result;
}
const envLocal = loadEnvLocal();
const env = (k) => process.env[k] ?? envLocal[k] ?? undefined;
const mask = (id) => (!id || id.length <= 6 ? "***" : id.slice(0, 3) + "***" + id.slice(-3));

// ── narration text (config narrationOverride 우선 — 의미 불변 미세조정본) ─────
const phrasesDef = (cfg.narrationOverride?.phrases ?? baseManifest.provisionalNarration)
  .map((p) => ({ phraseId: p.phraseId, text: p.text }));
const narrationText = phrasesDef.map((p) => p.text).join(" ");

// ══════════════════════════════════════════════════════════════════════════
// STAGE TTS — ElevenLabs one-shot with-timestamps (budget 1, no retry)
// ══════════════════════════════════════════════════════════════════════════
const audioPath = P("narrationAudio");
const alignPath = P("alignmentRaw");

// live ElevenLabs 호출 허용 여부 — env ALLOW_ELEVENLABS(1/true) 또는 CLI --allow-live-tts 중 하나 필요.
// (재사용 경로는 stageTts() 상단에서 이미 return하므로 이 게이트를 거치지 않는다.)
function liveTtsAllowed() {
  const flagName = cfg.tts.allowCliFlag ?? "--allow-live-tts";
  const envKeyName = cfg.tts.allowEnvKey ?? "ALLOW_ELEVENLABS";
  const cliOk = flagName === "--allow-live-tts" ? ALLOW_LIVE_TTS_FLAG : argv.includes(flagName);
  const envVal = (env(envKeyName) ?? "").trim().toLowerCase();
  const envOk = envVal === "1" || envVal === "true";
  return { allowed: cliOk || envOk, envKeyName, flagName };
}

async function stageTts() {
  if (cfg.tts.reuseExistingAudioIfPresent && existsSync(audioPath) && existsSync(alignPath)) {
    console.log("── STAGE TTS: 기존 narration + alignment 재사용 (API 미호출) ──");
    return { reused: true, httpStatus: null };
  }
  // 신규 live 호출이 필요한 경로 — API 접근/호출 전에 live guard로 차단.
  if (cfg.tts.requireLiveTtsGuard !== false) {
    const g = liveTtsAllowed();
    if (!g.allowed) {
      console.error(`ABORT: live ElevenLabs TTS requires ${g.envKeyName}=1 or ${g.flagName}`);
      process.exit(20);
    }
    console.log(`── live TTS guard 통과 (${g.envKeyName}=1 또는 ${g.flagName}) ──`);
  }
  const apiKey = env("ELEVENLABS_API_KEY");
  let voiceId = null, voiceSource = null;
  for (const k of cfg.tts.voiceResolutionOrder) {
    const v = env(k);
    if (v && v.trim()) { voiceId = v.trim(); voiceSource = k; break; }
  }
  const modelId = env(cfg.tts.modelIdEnvKey) ?? cfg.tts.modelIdDefault;
  console.log("── STAGE TTS: ElevenLabs one-shot full narration (with-timestamps) ──");
  console.log(`  apiKey configured: ${!!apiKey}  voice: ${voiceId ? mask(voiceId) : "(missing)"} (source: ${voiceSource ?? "none"})`);
  console.log(`  model: ${modelId}  preset: ${cfg.tts.voicePresetId}  chars: ${[...narrationText].length}`);
  if (!apiKey || !voiceId) {
    console.error("ABORT: ElevenLabs env 누락 — API 호출 없이 중단. fallback TTS/mock 대체 금지."); process.exit(11);
  }
  const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=${cfg.tts.outputFormat}`;
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ text: narrationText, model_id: modelId, voice_settings: cfg.tts.voiceSettings }),
    });
  } catch (e) {
    console.error(`ABORT: fetch 실패: ${e.message} (no retry)`); process.exit(12);
  }
  if (!res.ok) {
    const errText = await res.text().catch(() => "(unreadable)");
    console.error(`ABORT: ElevenLabs API ${res.status} (no retry). error(truncated): ${errText.slice(0, 200)}`);
    process.exit(12);
  }
  const body = await res.json();
  if (!body.audio_base64 || !body.alignment?.characters?.length) {
    console.error("ABORT: with-timestamps 응답에 audio/alignment 없음"); process.exit(12);
  }
  writeFileSync(audioPath, Buffer.from(body.audio_base64, "base64"));
  writeFileSync(alignPath, JSON.stringify({
    schemaVersion: "elevenlabs_alignment_raw_v1",
    note: "character-level alignment (secret 없음). characters/start/end는 전송 텍스트 기준",
    alignment: body.alignment,
    normalizedAlignment: body.normalized_alignment ?? null,
  }, null, 2) + "\n", "utf8");
  console.log(`  HTTP ${res.status} → audio ${Buffer.from(body.audio_base64, "base64").length} bytes, alignment chars=${body.alignment.characters.length}`);
  return { reused: false, httpStatus: res.status };
}

// ══════════════════════════════════════════════════════════════════════════
// TIMING — alignment → phrase/word timing + silence 측정
// ══════════════════════════════════════════════════════════════════════════
function silencedetect(mediaPath, noiseDb, minSec) {
  const r = runFfmpeg(["-i", mediaPath, "-map", "0:a:0", "-af", `silencedetect=noise=${noiseDb}dB:d=${minSec}`, "-f", "null", "-"], "silencedetect", true);
  const silences = [];
  let cur = null;
  for (const line of (r.stderr || "").split(/\r?\n/)) {
    const ms = line.match(/silence_start:\s*([\d.]+)/);
    const me = line.match(/silence_end:\s*([\d.]+)/);
    if (ms) cur = parseFloat(ms[1]);
    if (me && cur != null) { silences.push([cur, parseFloat(me[1])]); cur = null; }
  }
  return { silences, openEndedStart: cur };
}

function buildTiming() {
  const raw = JSON.parse(readFileSync(alignPath, "utf8"));
  const al = raw.alignment;
  const chars = al.characters;
  const starts = al.character_start_times_seconds;
  const ends = al.character_end_times_seconds;
  const joined = chars.join("");
  const textMatches = joined === narrationText;

  // phrases: 전송 텍스트의 각 phrase를 alignment 문자열에서 순차 매칭
  const phrases = [];
  let cursor = 0;
  for (const p of phrasesDef) {
    const idx = joined.indexOf(p.text, cursor);
    if (idx === -1) { console.error(`ABORT: alignment에서 phrase 미발견: ${p.phraseId}`); process.exit(13); }
    const endIdx = idx + p.text.length - 1;
    phrases.push({ phraseId: p.phraseId, text: p.text, startIdx: idx, endIdx, audioStartSec: r2(starts[idx]), audioEndSec: r2(ends[endIdx]) });
    cursor = endIdx + 1;
  }
  // words: 공백 기준
  const words = [];
  let wStart = null;
  for (let i = 0; i <= joined.length; i++) {
    const ch = joined[i];
    if (ch && !/\s/.test(ch)) { if (wStart == null) wStart = i; }
    else if (wStart != null) {
      words.push({ word: joined.slice(wStart, i), startSec: r2(starts[wStart]), endSec: r2(ends[i - 1]), startIdx: wStart });
      wStart = null;
    }
  }
  // 특정 단어 anchor 검색 (phrase 범위 내 첫 일치)
  function anchor(needle, phraseId) {
    const ph = phrases.find((p) => p.phraseId === phraseId);
    const idx = joined.indexOf(needle, ph.startIdx);
    if (idx === -1 || idx > ph.endIdx) { console.error(`ABORT: word anchor '${needle}' not in ${phraseId}`); process.exit(13); }
    return { word: needle, phraseId, startSec: r2(starts[idx]), endSec: r2(ends[idx + needle.length - 1]) };
  }

  const speechEndSec = r2(ends[ends.length - 1]);
  const probe = ffprobeJson(["-show_entries", "format=duration", audioPath]);
  const audioFileDurationSec = r2(parseFloat(probe?.format?.duration ?? "0"));

  const sd = silencedetect(audioPath, cfg.audioQualityGates.silencedetectNoiseDb, cfg.audioQualityGates.silencedetectMinSilenceSec);
  const silences = sd.silences.map(([a, b]) => [r2(a), r2(Math.min(b, speechEndSec))]).filter(([a, b]) => b > a);
  const silenceTotal = r2(silences.reduce((s, [a, b]) => s + (b - a), 0));
  const first5 = r2(silences.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, 5) - Math.min(a, 5)), 0));
  const gaps = phrases.slice(1).map((p, i) => r2(p.audioStartSec - phrases[i].audioEndSec));

  return {
    textMatches, joined, phrases, words, anchor,
    speechEndSec, audioFileDurationSec,
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
// REFLOW — 실제 word/phrase timing → v1.2 manifest
// ══════════════════════════════════════════════════════════════════════════
function buildReflowManifest(T) {
  const A = T.anchor;
  const ph = Object.fromEntries(T.phrases.map((p) => [p.phraseId, p]));
  const holdTarget = cfg.reflow.holdAfterSpeechSec;
  let videoEnd = Math.max(T.speechEndSec + holdTarget, T.audioFileDurationSec + 0.12);
  videoEnd = r2(Math.ceil(videoEnd * FPS) / FPS);
  const tailHold = r2(videoEnd - T.speechEndSec);

  // scene 경계 = 다음 phrase 발화 시작 (hard cut이 발화 온셋에 정렬)
  const s2 = r2(ph.p2_contrast.audioStartSec);
  const s3 = r2(ph.p3_fixed_costs.audioStartSec);
  const s4 = r2(ph.p4_number.audioStartSec);
  const s5 = r2(ph.p5_graph.audioStartSec);
  const s6 = r2(ph.p6_twist.audioStartSec);
  const p7s = r2(ph.p7_action.audioStartSec);

  const m = JSON.parse(JSON.stringify(baseManifest));
  m.schemaVersion = "golden_sample_visual_render_manifest_t2_v1_2_tts_anchored";
  m.taskId = cfg.taskId;
  m.status = "tts_anchored_render_candidate";
  m.basedOn = cfg.baseVisualManifest;
  m.createdAt = "2026-07-02";
  m.ownerApproval = cfg.ownerApproval;
  m.fullDurationSec = videoEnd;
  m.ttsTimingSource = "elevenlabs_character_alignment_word_timing_v1";
  m.ttsTimingNote = "실제 ElevenLabs with-timestamps character alignment에서 파생한 word/phrase timing으로 전체 timeline reflow. caption 진입=phrase/word 시작 앵커(허용 ±120ms), 강조=word 시작 앵커(허용 ±80ms). 무음 padding/atempo/hard-trim 없음. 발화 종료 후 tail hold " + tailHold + "s.";
  m.ttsEvidence = {
    narrationAudio: cfg.outputPaths.narrationAudio,
    alignmentRaw: cfg.outputPaths.alignmentRaw,
    timingSummary: cfg.outputPaths.timingSummary,
    speechEndSec: T.speechEndSec,
    audioFileDurationSec: T.audioFileDurationSec,
    tailHoldSec: tailHold,
    wordTimingAvailable: true,
  };
  m.provisionalNarration = T.phrases.map((p) => ({
    phraseId: p.phraseId, visualStartSec: p.audioStartSec, visualEndSec: p.audioEndSec, text: p.text,
  }));
  // scenes
  const bounds = [[0, s2], [s2, s3], [s3, s4], [s4, s5], [s5, s6], [s6, videoEnd]];
  m.scenes.forEach((sc, i) => { sc.startSec = bounds[i][0]; sc.endSec = bounds[i][1]; });

  // ── word anchors ──
  const wIn = A("들어왔는데", "p1_hook"), w3il = A("3일이면", "p1_hook");
  const wNagal = A("나갈", "p2_contrast"), wSunse = A("순서대로", "p2_contrast"), wTong = A("통장은", "p2_contrast"), wPpajyeo = A("빠져나가요", "p2_contrast");
  const wWolse = A("월세", "p3_fixed_costs"), wTongsin = A("통신비", "p3_fixed_costs"), wBoheom = A("보험료", "p3_fixed_costs"), wPpajim = A("빠집니다", "p3_fixed_costs");
  const wHaru = A("하루", "p4_number"), wItl = A("이틀", "p4_number"), w3ile = A("3일이에요", "p4_number");
  const wHaruharu = A("하루하루", "p5_graph"), wIreoke = A("이렇게", "p5_graph"), wJul = A("줄어들죠", "p5_graph"), wGeurigo = A("그리고", "p5_graph");
  const wSunsequip = A("순서입니다", "p6_twist");
  const w3gae = A("3개만", "p7_action"), wJeong = A("정하세요", "p7_action"), wOneul = A("오늘", "p7_action"), wJeojang = A("저장하고", "p7_action"), wSijak = A("시작하세요", "p7_action");

  const clamp = (v, lo, hi) => r2(Math.min(Math.max(v, lo), hi));
  const anchorsUsed = [];
  const use = (w, role) => { anchorsUsed.push({ role, word: w.word, phraseId: w.phraseId, wordStartSec: w.startSec, wordEndSec: w.endSec }); return w; };

  // ── cards ──
  const [cHook, cContrast, cCheck, cNumber, cGraph, cTwist, cAction] = m.cardTimeline;
  cHook.timeStartSec = 0; cHook.timeEndSec = s2;
  // hook '3일' 발화 순간 amber pulse — hook 구간(0~s2) 무이벤트 공백 제거 (word-anchored)
  cHook.lines[0].keywordPulse = { atSec: clamp(use(w3il, "hook_keyword_pulse").startSec, 0.6, s2 - 0.4), runIndex: 1, toColor: "amber" };
  cContrast.timeStartSec = s2; cContrast.timeEndSec = s3;
  cContrast.splitPanels[0].revealAtSec = r2(s2 + 0.05);
  cContrast.splitPanels[1].revealAtSec = clamp(use(wNagal, "contrast_reveal2").startSec, s2 + 0.25, s3 - 1.0);
  cContrast.splitPanels[1].line.emphasisSwitch.atSec = clamp(use(wSunse, "contrast_emphasis").startSec, cContrast.splitPanels[1].revealAtSec + 0.35, s3 - 0.3);
  // divider sweep은 '빠져나가요' 발화 순간 — 돈이 빠져나가는 의미와 동기 + p2 후반 이벤트 공백 제거
  cContrast.divider.sweepAtSec = clamp(use(wPpajyeo, "contrast_divider_sweep").startSec, cContrast.splitPanels[1].line.emphasisSwitch.atSec + 0.4, s3 - 0.5);
  cCheck.timeStartSec = s3; cCheck.timeEndSec = s4;
  const popTimes = [wWolse, wTongsin, wBoheom].map((w, i) => clamp(use(w, `checklist_pop_${i + 1}`).startSec, s3 + 0.4 + i * 0.2, s4 - 0.8 + i * 0.2));
  cCheck.items.forEach((it, i) => { it.popAtSec = popTimes[i]; it.checkAtSec = clamp(popTimes[i] + 0.5, popTimes[i] + 0.3, s4 - 0.15); });
  cNumber.timeStartSec = s4; cNumber.timeEndSec = s5;
  const countTimes = [wHaru, wItl, w3ile].map((w, i) => clamp(use(w, `number_count_${i + 1}`).startSec, s4 + 0.3 + i * 0.25, s5 - 0.4));
  cNumber.counts.forEach((c, i) => { c.atSec = countTimes[i]; });
  cGraph.timeStartSec = s5; cGraph.timeEndSec = s6;
  const barTimes = [wHaruharu, wIreoke, wJul].map((w, i) => clamp(use(w, `graph_bar_${i + 1}`).startSec, s5 + 0.4 + i * 0.2, s6 - 0.6));
  cGraph.graph.bars.forEach((b, i) => { b.fillAtSec = barTimes[i]; });
  cTwist.timeStartSec = s6; cTwist.timeEndSec = p7s;
  cTwist.pauseBeforeImpact = { fromSec: r2(s6 - cfg.reflow.pauseBeforeTwistImpactSec), toSec: s6, rule: "이 구간에는 caption/card 신규 모션 금지 (pause_before_impact)" };
  cTwist.lines[1].emphasisSwitch.atSec = clamp(use(wSunsequip, "twist_emphasis").startSec, s6 + 0.4, p7s - 0.3);
  cAction.timeStartSec = p7s; cAction.timeEndSec = videoEnd;
  cAction.lines[1].keywordPulse.atSec = clamp(use(w3gae, "action_keyword_pulse").startSec, p7s + 0.45, videoEnd - 0.5);
  cAction.underline.sweepAtSec = clamp(use(wJeong, "action_underline").startSec, p7s + 0.45, videoEnd - 0.6);
  // CTA '시작하세요' 발화 순간 라인 재강조 — 발화 후반(마지막 5s window) 카드 이벤트 확보 (word-anchored)
  cAction.ctaRePulse = { atSec: clamp(use(wSijak, "action_cta_repulse").startSec, cAction.underline.sweepAtSec + 0.5, videoEnd - 0.8) };

  // ── captions (위치/fs/motion은 accepted v1.1 그대로 — 타이밍만 재앵커) ──
  const caps = Object.fromEntries(m.captionTimeline.map((c) => [c.captionId, c]));
  const capEvidence = [];
  function setCap(id, anchorW, anchorType, start, end, note) {
    const c = caps[id];
    const st = r2(start), en = r2(end);
    if (en - st < 0.45) { console.error(`ABORT: caption ${id} dwell too small (${st}~${en})`); process.exit(14); }
    c.startSec = st; c.endSec = en;
    capEvidence.push({
      captionId: id, text: c.text, anchorWord: anchorW.word, anchorType,
      wordStartSec: anchorW.startSec, wordEndSec: anchorW.endSec,
      captionStartSec: st, entryDeltaMs: Math.round((st - (anchorType === "word_end" ? anchorW.endSec : anchorW.startSec)) * 1000),
      dwellSec: r2(en - st), note: note ?? null,
    });
  }
  setCap("c01", use(wIn, "c01"), "word_start", Math.max(wIn.startSec, 0.31), Math.min(wIn.startSec + 1.35, w3il.startSec - 0.06));
  setCap("c02", use(w3il, "c02"), "word_start", Math.max(w3il.startSec, caps.c01.endSec + 0.05), Math.min(Math.max(w3il.startSec, caps.c01.endSec + 0.05) + 1.2, s2 - 0.08));
  setCap("c03", use(wTong, "c03"), "word_start", Math.max(wTong.startSec, s2 + 0.35), Math.min(wTong.startSec + 1.3, s3 - 0.06));
  setCap("c04", use(wPpajim, "c04"), "word_start", Math.max(wPpajim.startSec, s3 + 0.31), Math.min(wPpajim.startSec + 1.1, s4 - 0.06));
  // c05는 대본에 없는 반응 caption — "3일이에요" 발화 시작 +0.5s(펄스 직후)에 진입, phrase 종료 전 퇴장
  {
    const c05st = clamp(w3ile.startSec + 0.5, s4 + 0.31, s5 - 0.55);
    setCap("c05", use(w3ile, "c05"), "word_start_plus_500ms", c05st, Math.min(c05st + 1.2, s5 - 0.06), "반응 caption — 숫자 펄스 직후 진입");
  }
  setCap("c06", use(wHaruharu, "c06"), "word_start", Math.max(wHaruharu.startSec, s5 + 0.31), Math.min(wHaruharu.startSec + 1.3, wGeurigo.startSec - 0.06));
  setCap("c07", use(wGeurigo, "c07"), "word_start", wGeurigo.startSec, Math.min(wGeurigo.startSec + 1.2, s6 - cfg.reflow.pauseBeforeTwistImpactSec - 0.02));
  setCap("c08", use(wOneul, "c08"), "word_start", Math.max(wOneul.startSec, p7s + 0.31), Math.min(wOneul.startSec + 1.2, wJeojang.startSec - 0.06));
  setCap("c09", use(wJeojang, "c09"), "word_start", wJeojang.startSec, Math.min(wJeojang.startSec + 1.35, videoEnd - 0.12));

  // ── perceptual events (실측 앵커 기준 재계산, 유형/개수 v1.1과 동일) ──
  m.perceptualEventPlan.coreEvents = [
    { atSec: 0.0, type: "hook_card_entry" },
    { atSec: 0.0, type: "bg_punch_zoom_impact" },
    { atSec: cHook.lines[0].keywordPulse.atSec, type: "hook_keyword_pulse_3days" },
    { atSec: s2, type: "hard_cut_scene2" },
    { atSec: cContrast.splitPanels[0].revealAtSec, type: "contrast_card_split_reveal_1" },
    { atSec: cContrast.splitPanels[1].revealAtSec, type: "contrast_card_split_reveal_2" },
    { atSec: cContrast.divider.sweepAtSec, type: "contrast_divider_sweep" },
    { atSec: cContrast.splitPanels[1].line.emphasisSwitch.atSec, type: "contrast_emphasis_switch" },
    { atSec: s3, type: "hard_cut_scene3" },
    { atSec: r2(s3 + 0.05), type: "checklist_card_entry" },
    { atSec: cCheck.items[0].popAtSec, type: "checklist_pop_1" },
    { atSec: cCheck.items[1].popAtSec, type: "checklist_pop_2" },
    { atSec: cCheck.items[2].popAtSec, type: "checklist_pop_3" },
    { atSec: s4, type: "hard_cut_scene4" },
    { atSec: s4, type: "number_card_entry" },
    { atSec: cNumber.counts[0].atSec, type: "number_count_1" },
    { atSec: cNumber.counts[1].atSec, type: "number_count_2" },
    { atSec: cNumber.counts[2].atSec, type: "number_count_final_pulse" },
    { atSec: s5, type: "hard_cut_scene5" },
    { atSec: r2(s5 + 0.05), type: "graph_card_entry" },
    { atSec: cGraph.graph.bars[0].fillAtSec, type: "graph_bar_fill_1" },
    { atSec: cGraph.graph.bars[1].fillAtSec, type: "graph_bar_fill_2" },
    { atSec: cGraph.graph.bars[2].fillAtSec, type: "graph_bar_fill_3" },
    { atSec: s6, type: "hard_cut_scene6" },
    { atSec: s6, type: "twist_card_freeze_punch_entry" },
    { atSec: cTwist.lines[1].emphasisSwitch.atSec, type: "twist_emphasis_switch" },
    { atSec: p7s, type: "action_card_entry" },
    { atSec: cAction.underline.sweepAtSec, type: "action_underline_sweep" },
    { atSec: cAction.lines[1].keywordPulse.atSec, type: "action_keyword_pulse" },
    { atSec: cAction.ctaRePulse.atSec, type: "action_cta_repulse" },
  ];

  // caption 스타일 후보 (Owner 메모 — 품질 판단 대상; 과하면 baseline 되돌림)
  m.typography.capStyle = { ...cfg.captionStyleJudgment.candidate };
  m.typography.capStyleJudgment = {
    candidateApplied: true,
    baselineV11: cfg.captionStyleJudgment.baselineV11,
    rule: cfg.captionStyleJudgment.rule,
  };

  m.outputPaths = {
    ...m.outputPaths,
    outDir: cfg.outputPaths.outDir,
    visualOnlyMp4: cfg.outputPaths.visualMp4,
    frameTimesSec: [0, 2, 5, 10, 15, 20, 26, r2(videoEnd - 0.1)],
  };
  return { manifest: m, capEvidence, anchorsUsed, videoEnd, tailHold, sceneBounds: bounds };
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════
const ttsResult = (STAGE === "all" || STAGE === "tts") ? await stageTts() : { reused: true, httpStatus: null };

const T = buildTiming();
console.log(`\n── TIMING ── textMatch=${T.textMatches} speechEnd=${T.speechEndSec}s audioFile=${T.audioFileDurationSec}s`);
console.log(`  phrases: ${T.phrases.map((p) => `${p.phraseId}@${p.audioStartSec}-${p.audioEndSec}`).join(" ")}`);
console.log(`  silence(speech구간): total=${T.silence.totalWithinSpeechSec}s ratio=${T.silence.totalSilenceRatio} first5s=${T.silence.first5sSilenceSec}s speechActive=${T.silence.speechActiveRatio}`);

const R = buildReflowManifest(T);
const ttsManifestPath = join(REPO_ROOT, cfg.outputPaths.ttsAnchoredManifestFixture);
writeFileSync(ttsManifestPath, JSON.stringify(R.manifest, null, 2) + "\n", "utf8");
console.log(`\n── REFLOW ── videoEnd=${R.videoEnd}s tailHold=${R.tailHold}s manifest→${cfg.outputPaths.ttsAnchoredManifestFixture}`);

// timing summary (secret 없음)
writeFileSync(P("timingSummary"), JSON.stringify({
  schemaVersion: "elevenlabs_tts_timing_summary_v1",
  taskId: cfg.taskId,
  provider: "elevenlabs",
  ttsStrategy: cfg.tts.strategy,
  endpointKind: cfg.tts.endpointKind,
  liveApiCallPerformedThisRun: !ttsResult.reused,
  httpStatus: ttsResult.httpStatus,
  apiCallBudgetMax: cfg.tts.apiCallBudgetMax,
  modelId: env(cfg.tts.modelIdEnvKey) ?? cfg.tts.modelIdDefault,
  voicePresetId: cfg.tts.voicePresetId,
  voiceSettingsSanitized: cfg.tts.voiceSettings,
  generatedText: narrationText,
  generatedTextCharCount: [...narrationText].length,
  alignmentTextMatchesSentText: T.textMatches,
  actualAudioDurationSec: T.audioFileDurationSec,
  speechEndSec: T.speechEndSec,
  activeSpeechDurationSec: r2(T.speechEndSec - T.silence.totalWithinSpeechSec),
  silenceAudit: T.silence,
  wordTimingAvailability: "word-level (character alignment 파생) — phrase/word 모두 실측",
  wordCount: T.words.length,
  phraseAlignment: T.phrases.map((p) => ({ phraseId: p.phraseId, text: p.text, audioStartSec: p.audioStartSec, audioEndSec: p.audioEndSec })),
  paddingUsed: false,
  atempoUsed: false,
  hardTrimUsed: false,
  requiresTimelineReflow: true,
  noSecretEvidence: "API key/voice id 원문은 어떤 로그/파일에도 기록하지 않음 (voice id는 masked도 파일에는 미기록)",
  uploadReady: false,
}, null, 2) + "\n", "utf8");

// ── STAGE RENDER ──
if (STAGE === "all" || STAGE === "render") {
  console.log("\n── STAGE RENDER: TTS-anchored visual render ──");
  const rr = spawnSync("node", [join(__dirname, "render-golden-sample-visual-only-v1.mjs"), "--manifest", ttsManifestPath], { stdio: "inherit", shell: false, timeout: 600000 });
  if (rr.status !== 0) { console.error(`ABORT: visual render 실패 (exit ${rr.status})`); process.exit(5); }
}

// ── STAGE MUX ──
const visualMp4 = P("visualMp4");
const muxMp4 = P("muxMp4");
if (STAGE === "all" || STAGE === "mux") {
  console.log("\n── STAGE MUX: visual + narration (no padding, no trim) ──");
  runFfmpeg(["-y", "-i", visualMp4, "-i", audioPath, "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", muxMp4], "mux");
}

// ── STAGE AUDIT ──
if (!["all", "mux", "audit"].includes(STAGE)) { console.log(`\nSTAGE=${STAGE} 완료 — audit 스킵`); process.exit(0); }
console.log("\n── STAGE AUDIT: post-render artifact audit ──");
const probe = ffprobeJson(["-show_entries", "format=duration", "-show_entries", "stream=width,height,codec_name,codec_type,r_frame_rate", muxMp4]);
const vS = (probe?.streams || []).find((s) => s.codec_type === "video") || {};
const aS = (probe?.streams || []).filter((s) => s.codec_type === "audio");
const muxDur = r2(parseFloat(probe?.format?.duration ?? "0"));

const sdMux = silencedetect(muxMp4, cfg.audioQualityGates.silencedetectNoiseDb, cfg.audioQualityGates.silencedetectMinSilenceSec);
const muxAudioProbe = ffprobeJson(["-select_streams", "a:0", "-show_entries", "stream=duration", muxMp4]);
const muxAudioDur = r2(parseFloat(muxAudioProbe?.streams?.[0]?.duration ?? String(T.audioFileDurationSec)));
const muxSil = sdMux.silences.map(([a, b]) => [r2(a), r2(b)]);
const silWithinSpeech = muxSil.map(([a, b]) => [a, Math.min(b, T.speechEndSec)]).filter(([a, b]) => b > a);
const muxSilTotal = r2(silWithinSpeech.reduce((s, [a, b]) => s + (b - a), 0));
const muxFirst5 = r2(silWithinSpeech.reduce((s, [a, b]) => s + Math.max(0, Math.min(b, 5) - Math.min(a, 5)), 0));
const G = cfg.audioQualityGates;
const audioGates = {
  first5sSilenceSec: muxFirst5, first5sPass: muxFirst5 <= G.first5sSilenceMaxSec,
  totalSilenceWithinSpeechSec: muxSilTotal,
  totalSilenceRatio: r2(muxSilTotal / T.speechEndSec * 100) / 100,
  ratioPass: muxSilTotal / T.speechEndSec <= G.totalSilenceRatioMax,
  speechActiveRatio: r2((T.speechEndSec - muxSilTotal) / T.speechEndSec * 100) / 100,
  speechActivePass: (T.speechEndSec - muxSilTotal) / T.speechEndSec >= G.speechActiveRatioMin,
  tailHoldSec: R.tailHold, tailHoldPass: R.tailHold >= 0.3 && R.tailHold <= cfg.reflow.holdAfterSpeechMaxSec + 0.15,
  maxInterPhraseGapSec: T.silence.maxInterPhraseGapSec,
  paddingUsed: false, atempoUsed: false, hardTrimUsed: false,
};

// renderer QA 재사용 (같은 outDir에 생성됨)
const renderQa = JSON.parse(readFileSync(join(outAbs, "visual_qa_report.json"), "utf8"));
const gateReport = JSON.parse(readFileSync(join(outAbs, "image_gate_report.json"), "utf8"));

// mux 프레임 추출 (output-seek 정확)
const muxFrames = [];
for (const t of R.manifest.outputPaths.frameTimesSec) {
  const fp = join(outAbs, `muxframe_${String(t).replace(".", "_")}s.jpg`);
  runFfmpeg(["-y", "-i", muxMp4, "-ss", String(t), "-frames:v", "1", "-q:v", "3", fp], `muxframe ${t}`);
  muxFrames.push(fp);
}

// caption timeline (TTS anchor evidence 포함)
writeFileSync(P("captionTimeline"), JSON.stringify({
  schemaVersion: "golden_sample_dynamic_caption_timeline_tts_anchored_v1",
  ttsTimingSource: R.manifest.ttsTimingSource,
  contract: baseManifest.captionRules.contract,
  entryToleranceMs: cfg.reflow.captionEntryToleranceMs,
  emphasisToleranceMs: cfg.reflow.emphasisAnchorToleranceMs,
  captions: R.manifest.captionTimeline,
  anchorEvidence: R.capEvidence,
  cardEmphasisAnchors: R.anchorsUsed.filter((a) => /emphasis|pulse|underline/.test(a.role)),
  allWordAnchors: R.anchorsUsed,
}, null, 2) + "\n", "utf8");

const mediaPass = vS.width === 1080 && vS.height === 1920 && vS.codec_name === "h264" && vS.r_frame_rate === "30/1" && aS.length === 1 && Math.abs(muxDur - R.videoEnd) <= 0.25;
const capPass = !renderQa.captions.anyCardOverlap && !renderQa.captions.anySafeFrameViolation && !renderQa.captions.anyBottom15Touch && !renderQa.captions.anyDwellOver1_6 && !renderQa.captions.anyOver5Words;
const visualPass = gateReport.verdict === "IMAGE_GATE_PASS" && renderQa.perceptualEvents.passesMin && renderQa.perceptualEvents.gapPass;
const audioPass = audioGates.first5sPass && audioGates.ratioPass && audioGates.speechActivePass && audioGates.tailHoldPass;

const audit = {
  schemaVersion: "post_render_artifact_audit_tts_mux_v1",
  taskId: cfg.taskId,
  target: muxMp4,
  ffprobe: { width: vS.width, height: vS.height, codec: vS.codec_name, rFrameRate: vS.r_frame_rate, durationSec: muxDur, audioStreamCount: aS.length, muxAudioDurationSec: muxAudioDur, pass: mediaPass },
  ffprobeNote: "ffprobe pass는 media validity일 뿐 quality pass가 아님 — 아래 audio/caption/visual/vision 게이트가 함께 통과해야 함",
  audio: audioGates,
  captionCard: {
    fromRendererQa: {
      anyCardOverlap: renderQa.captions.anyCardOverlap,
      anySafeFrameViolation: renderQa.captions.anySafeFrameViolation,
      anyBottom15Touch: renderQa.captions.anyBottom15Touch,
      anyDwellOver1_6: renderQa.captions.anyDwellOver1_6,
      anyOver5Words: renderQa.captions.anyOver5Words,
      bottomFixedSubtitleBarUsed: false,
    },
    ttsAnchorEvidence: cfg.outputPaths.captionTimeline,
    pass: capPass,
  },
  visualStructure: {
    imageGate: gateReport.verdict,
    perceptualEventCount: renderQa.perceptualEvents.coreEventCount,
    maxInterEventGapSec: renderQa.perceptualEvents.maxInterEventGapSec,
    cardPresenceRatio: renderQa.cardPresenceRatio,
    acceptedV11StructureKept: true,
    pass: visualPass,
  },
  frames: muxFrames,
  claudeVisionQa: { status: "PENDING" },
  gates: { media: mediaPass, audio: audioPass, captionCard: capPass, visualStructure: visualPass },
  verdict: mediaPass && audioPass && capPass && visualPass ? "PASS_CANDIDATE_PENDING_VISION_QA" : "FAIL",
  uploadReady: false,
  boundary: { noUpload: true, noImageGeneration: true, apiCallsThisRun: ttsResult.reused ? 0 : 1, paddingUsed: false },
};
writeFileSync(P("auditReport"), JSON.stringify(audit, null, 2) + "\n", "utf8");

console.log(`\n── DONE ──`);
console.log(`  mux: ${muxMp4}`);
console.log(`  probe: ${vS.width}x${vS.height} ${vS.codec_name} ${vS.r_frame_rate} ${muxDur}s audio=${aS.length} → mediaPass=${mediaPass}`);
console.log(`  audio: first5s=${audioGates.first5sSilenceSec}s ratio=${audioGates.totalSilenceRatio} speechActive=${audioGates.speechActiveRatio} tailHold=${audioGates.tailHoldSec}s → ${audioPass ? "PASS" : "FAIL"}`);
console.log(`  caption/card: ${capPass ? "PASS" : "FAIL"}  visual: ${visualPass ? "PASS" : "FAIL"} (events=${renderQa.perceptualEvents.coreEventCount})`);
console.log(`  verdict: ${audit.verdict}`);
process.exit(0);
