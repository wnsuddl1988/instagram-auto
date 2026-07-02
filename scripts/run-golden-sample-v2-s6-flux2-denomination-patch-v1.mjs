#!/usr/bin/env node
/**
 * Golden Sample v2 — s6 FLUX.2 [pro] Denomination Patch v1
 *
 * task: creative-v2-golden-sample-v2-s6-flux2-denomination-patch-v1
 *
 * 목적:
 *   denomination render probe에서 PATCH_NEEDED로 판정된 s6_B('5' 액면 still_visible)를
 *   대체할 s6_result_clear_after 패치 후보를 FLUX.2 [pro]로 최대 2장 생성하고,
 *   직전 probe와 동일한 1080x1920 viewer frame 조건(dim/blur/crop + card/caption)으로
 *   즉시 재probe 프레임을 산출한다. render/TTS/mux/upload 없음. lock 없음.
 *
 * Owner 승인 (2026-07-02, _ai/HANDOFF_NOW.md Current Approved Slice):
 *   FLUX.2 [pro] 최대 2장 (scene s6_result_clear_after only), 비용 $0.50 상한,
 *   BFL_API_KEY 사용 허용. 기존 성공 구도 유지 + banknote back side / folded notes /
 *   denomination side facing down / no visible numeral 강제.
 *
 * 안전 규칙:
 *   - FLUX.2 [pro] 단일 provider. 타 provider 경로 자체가 없다.
 *   - 공식 단일 endpoint https://api.bfl.ai/v1/flux-2-pro — endpoint/size/provider fallback 없음.
 *   - create call hard cap = 2. retry로 호출 수 늘리기 금지 (후보당 정확히 1 create).
 *   - create HTTP 오류 발생 시 이후 create 전체 중단, evidence만 기록.
 *   - polling call은 create call과 분리 집계 (과금 아님).
 *   - .env.local에서 BFL_API_KEY만 읽고 나머지 줄은 파싱 즉시 버린다. 값 출력/기록 금지.
 *   - width=1088, height=1936 고정.
 *   - 재실행 가드: 생성 이미지가 이미 존재하면 create 재호출 방지를 위해 abort(exit 11).
 *     probe 좌표 조정 등 재probe만 필요하면 --probe-only 사용 (네트워크/key 접근 자체 없음).
 *   - s1~s5 이미지 접근/수정 없음. ffmpeg/ffprobe는 spawnSync(args array, shell:false)만.
 *
 * 사용:
 *   node scripts/run-golden-sample-v2-s6-flux2-denomination-patch-v1.mjs            # 생성 + probe
 *   node scripts/run-golden-sample-v2-s6-flux2-denomination-patch-v1.mjs --probe-only  # probe만 (비용 0)
 * exit: 0 = 완료, 1 = 실행 불가, 4 = ffmpeg 실패, 11 = 중복 생성 가드
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";
import { createHash } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_v2_s6_flux2_denomination_patch_prompts.v1.json");

const FLUX_ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"; // 공식 단일 endpoint — fallback 금지
const SIZE = { w: 1088, h: 1936 }; // 고정 — size fallback 금지
const MAX_CREATE_CALLS = 2; // Owner 승인 hard cap (s6 패치 2장)
const COST_CEILING_USD = 0.5;
const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };
const HALT_ON_CREATE_HTTP_ERROR = true;
const PROBE_ONLY = process.argv.includes("--probe-only");

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][s6-patch] ${m}`); }
function warn(m) { console.warn(`[WARN][s6-patch] ${m}`); }

// ── .env.local 로드 (BFL_API_KEY만, 값 미출력, 수정 없음) ────────────────────
function loadBflKey() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  let key = null;
  try {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m || m[1] !== "BFL_API_KEY") continue; // 다른 env/secret은 즉시 버림
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      key = v;
    }
  } catch { /* .env.local 없으면 process env만 사용 */ }
  return process.env.BFL_API_KEY || key || null;
}

// ── 이미지 차원 sniff (PNG/JPEG/WebP) ────────────────────────────────────────
function sniffImageDims(buf) {
  if (!buf || buf.length < 32) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let p = 2;
    while (p + 9 < buf.length) {
      if (buf[p] !== 0xff) { p++; continue; }
      const marker = buf[p + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { format: "jpeg", w: buf.readUInt16BE(p + 7), h: buf.readUInt16BE(p + 5) };
      }
      p += 2 + buf.readUInt16BE(p + 2);
    }
    return { format: "jpeg", w: null, h: null };
  }
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
    const chunk = buf.slice(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { format: "webp", w, h };
    }
    if (chunk === "VP8 ") return { format: "webp", w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { format: "webp", w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
  }
  return null;
}

function gateEval(w, h) {
  if (!w || !h) return "FAIL_UNMEASURABLE";
  const aspect = w / h;
  const resOk = w >= GATE.minW && h >= GATE.minH;
  const aspectOk = Math.abs(aspect - GATE.aspectTarget) <= GATE.aspectTol;
  if (resOk && aspectOk) return "PASS_1080x1920_NATIVE";
  if (!resOk) return "FAIL_RESOLUTION";
  return "FAIL_ASPECT";
}

function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 120000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
}

// ── 단일 후보 생성 (create 1회, retry 없음) ──────────────────────────────────
async function generateOne(BFL_KEY, outDir, sceneId, cand, counters) {
  const rec = { sceneId, candidateId: cand.candidateId, patchLever: cand.patchLever, attempted: false, generated: false };
  counters.createCalls++;
  rec.attempted = true;
  try {
    log(`${cand.candidateId} create call ${counters.createCalls}/${MAX_CREATE_CALLS} — ${SIZE.w}x${SIZE.h}`);
    const resp = await fetch(FLUX_ENDPOINT, {
      method: "POST",
      headers: { "x-key": BFL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: cand.prompt, width: SIZE.w, height: SIZE.h }),
      signal: AbortSignal.timeout(60000),
    });
    const bodyText = await resp.text();
    if (!resp.ok) {
      rec.error = `http_${resp.status}: ${bodyText.slice(0, 250)}`;
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      rec.httpError = true;
      warn(`${cand.candidateId} create 거부 — retry/fallback 없이 기록: ${rec.error}`);
      return rec;
    }
    const task = JSON.parse(bodyText);
    const pollUrl = task.polling_url || `https://api.bfl.ai/v1/get_result?id=${task.id}`;
    let sampleUrl = null; let lastStatus = "";
    for (let i = 0; i < 90; i++) { // 후보당 최대 180s 폴링
      await new Promise(r => setTimeout(r, 2000));
      counters.pollCalls++;
      const pr = await fetch(pollUrl, { headers: { "x-key": BFL_KEY }, signal: AbortSignal.timeout(30000) });
      const pj = await pr.json().catch(() => null);
      lastStatus = pj?.status || `http_${pr.status}`;
      if (lastStatus === "Ready") { sampleUrl = pj?.result?.sample || null; break; }
      if (/Error|Failed|Moderated|Not Found/i.test(lastStatus)) break;
    }
    if (!sampleUrl) {
      rec.error = `poll_end_status=${lastStatus}`;
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      warn(`${cand.candidateId} 결과 없음 — 추가 생성 없이 기록: ${rec.error}`);
      return rec;
    }
    const ir = await fetch(sampleUrl, { signal: AbortSignal.timeout(120000) });
    const buf = Buffer.from(await ir.arrayBuffer());
    if (!buf || buf.length < 10000) {
      rec.error = "empty_sample_download";
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      return rec;
    }
    const dims = sniffImageDims(buf) || {};
    const ext = dims.format === "jpeg" ? "jpg" : (dims.format || "png");
    const file = path.join(outDir, `gsv2-${sceneId}-${cand.candidateId}.${ext}`);
    fs.writeFileSync(file, buf);
    rec.generated = true;
    rec.imagePath = path.relative(REPO_ROOT, file).replace(/\\/g, "/");
    rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
    rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
    rec.fileSizeBytes = buf.length;
    rec.md5 = createHash("md5").update(buf).digest("hex").toUpperCase();
    rec.requestedSize = `${SIZE.w}x${SIZE.h}`;
    rec.gate = gateEval(dims.w, dims.h);
    log(`${cand.candidateId} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} md5=${rec.md5.slice(0, 8)}… (${Math.round(buf.length / 1024)}KB)`);
    return rec;
  } catch (e) {
    rec.error = String(e?.message || e).slice(0, 200);
    rec.gate = "FAIL_PROVIDER_BLOCKED";
    warn(`${cand.candidateId} 실패 — 추가 생성 없이 기록: ${rec.error}`);
    return rec;
  }
}

// ── ASS overlay 빌드 (직전 probe runner와 동일 스타일 — 정착 상태, entry 없음) ──
function buildAss(fixture) {
  const P = fixture.probe;
  const W = P.canvas.widthPx, H = P.canvas.heightPx;
  const ST = P.overlayStyle;
  const CBGR = ST.colorsAssBgr;
  const esc = (t) => (t || "").replace(/\{/g, "(").replace(/\}/g, ")");
  const rrAbs = (x1, y1, x2, y2, r) =>
    `m ${x1 + r} ${y1} l ${x2 - r} ${y1} b ${x2} ${y1} ${x2} ${y1} ${x2} ${y1 + r} l ${x2} ${y2 - r} b ${x2} ${y2} ${x2} ${y2} ${x2 - r} ${y2} l ${x1 + r} ${y2} b ${x1} ${y2} ${x1} ${y2} ${x1} ${y2 - r} l ${x1} ${y1 + r} b ${x1} ${y1} ${x1} ${y1} ${x1 + r} ${y1}`;
  const runsToAss = (runs) => runs.map((r) => `{\\c${CBGR[r.c] || CBGR.white}}${esc(r.t)}`).join("");
  const lines = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`,
    "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Txt,${ST.font},60,${CBGR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,${ST.cardTextOutline},1.2,5,60,60,60,1`,
    `Style: Cap,${ST.font},60,${CBGR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,${ST.captionOutline},${ST.captionShadow},8,60,60,60,1`,
    `Style: Drw,${ST.font},20,${CBGR.white},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const T0 = "0:00:00.00", T1 = "0:00:05.00";
  const ov = P.sceneOverlay;
  lines.push(`Dialogue: 0,${T0},${T1},Drw,,0,0,0,,{\\an7\\pos(0,0)\\bord0\\shad0\\1c${ST.panelFillAssBgr}\\1a${ST.panelAlpha}\\p1}${rrAbs(ov.card.panel.x1, ov.card.panel.y1, ov.card.panel.x2, ov.card.panel.y2, 26)}{\\p0}`);
  for (const ln of ov.card.lines) {
    lines.push(`Dialogue: 2,${T0},${T1},Txt,,0,0,0,,{\\an8\\pos(540,${ln.y})\\fs${ln.fs}}${runsToAss(ln.runs)}`);
  }
  const cap = ov.caption;
  const i = cap.text.indexOf(cap.emphasis);
  const capRuns = i < 0 ? [{ t: cap.text, c: "white" }] : [
    ...(i > 0 ? [{ t: cap.text.slice(0, i), c: "white" }] : []),
    { t: cap.emphasis, c: cap.emphasisColor },
    ...(i + cap.emphasis.length < cap.text.length ? [{ t: cap.text.slice(i + cap.emphasis.length), c: "white" }] : []),
  ];
  lines.push(`Dialogue: 3,${T0},${T1},Cap,,0,0,0,,{\\an8\\pos(${cap.posX},${cap.posY})\\fs${cap.fs}}${runsToAss(capRuns)}`);
  return lines.join("\n") + "\n";
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  if (fixture.schemaVersion !== "golden_sample_v2_s6_flux2_denomination_patch_prompts_v1") {
    console.error("ABORT: fixture schemaVersion 불일치");
    process.exit(1);
  }
  if (fixture.sceneId !== "s6_result_clear_after") {
    console.error("ABORT: sceneId가 s6_result_clear_after가 아님 — scene 범위 위반");
    process.exit(1);
  }
  const cands = fixture.candidates || [];
  if (cands.length !== 2) {
    console.error(`ABORT: candidates=${cands.length} (정확히 2 필요)`);
    process.exit(1);
  }
  for (const c of cands) {
    if (typeof c.prompt !== "string" || c.prompt.length < 200) {
      console.error(`ABORT: ${c.candidateId} prompt 비정상 — fixture 확인 필요`);
      process.exit(1);
    }
  }
  const OUT_DIR = path.join(REPO_ROOT, fixture.outputs.outDir);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 배경 체인 parity 검증 — 직전 probe와 동일해야 비교 가능
  const BT = fixture.probe.backgroundTreatment;
  const W = fixture.probe.canvas.widthPx, H = fixture.probe.canvas.heightPx;
  const zoomW = Math.round((W * BT.driftZoomMid) / 2) * 2;
  const zoomH = Math.round((H * BT.driftZoomMid) / 2) * 2;
  const bgChain = [BT.scaleCrop, BT.dim, BT.blur, `scale=${zoomW}:${zoomH}`, `crop=${W}:${H}`, "format=rgb24"].join(",");
  if (bgChain !== BT.expectedChain) {
    console.error(`ABORT: 배경 체인 parity 불일치\n계산: ${bgChain}\n기대: ${BT.expectedChain}`);
    process.exit(1);
  }

  const counters = { createCalls: 0, pollCalls: 0 };
  const results = [];
  let halted = null;

  const existingFor = (cand) => {
    for (const ext of ["jpg", "png", "webp"]) {
      const f = path.join(OUT_DIR, `gsv2-${fixture.sceneId}-${cand.candidateId}.${ext}`);
      if (fs.existsSync(f)) return f;
    }
    return null;
  };

  if (!PROBE_ONLY) {
    // 재실행 가드 — create 중복 호출 방지
    const dup = cands.map(existingFor).filter(Boolean);
    if (dup.length > 0) {
      console.error(`ABORT(11): 생성 이미지가 이미 존재 — create 재호출 금지. 재probe만 필요하면 --probe-only 사용.\n${dup.join("\n")}`);
      process.exit(11);
    }
    const BFL_KEY = loadBflKey();
    if (!BFL_KEY) {
      console.error("ABORT: BFL_API_KEY 없음 (존재 여부 boolean만 판정, 값 미출력)");
      process.exit(1);
    }
    log("BFL_API_KEY 존재 확인 (값 미출력) — s6 denomination patch 생성 시작");
    log(`endpoint: ${FLUX_ENDPOINT} (단일, fallback 없음) size: ${SIZE.w}x${SIZE.h} (고정) — s6 only, hard cap ${MAX_CREATE_CALLS}`);
    for (const c of cands) {
      if (counters.createCalls >= MAX_CREATE_CALLS) {
        warn(`hard cap ${MAX_CREATE_CALLS} 도달 — 남은 후보 생성 중단`);
        halted = "HARD_CAP_REACHED";
        break;
      }
      const rec = await generateOne(BFL_KEY, OUT_DIR, fixture.sceneId, c, counters);
      results.push(rec);
      if (rec.httpError && HALT_ON_CREATE_HTTP_ERROR) {
        halted = `CREATE_HTTP_ERROR_AT_${c.candidateId}`;
        warn("create HTTP 오류 → billing/quota/schema 가능성 — 이후 생성 전체 중단 (evidence만 기록)");
        break;
      }
    }
  } else {
    log("--probe-only — 네트워크/key 접근 없이 기존 생성 이미지로 probe만 수행");
    for (const c of cands) {
      const f = existingFor(c);
      if (!f) { warn(`${c.candidateId} 생성 이미지 없음 — probe 대상 제외`); continue; }
      const buf = fs.readFileSync(f);
      const dims = sniffImageDims(buf) || {};
      results.push({
        sceneId: fixture.sceneId, candidateId: c.candidateId, patchLever: c.patchLever,
        attempted: false, generated: true, imagePath: path.relative(REPO_ROOT, f).replace(/\\/g, "/"),
        width: dims.w, height: dims.h, format: dims.format, fileSizeBytes: buf.length,
        md5: createHash("md5").update(buf).digest("hex").toUpperCase(),
        gate: gateEval(dims.w, dims.h), probeOnlyReuse: true,
      });
    }
  }

  // ── probe 프레임 생성 (생성 성공 후보만) ──────────────────────────────────
  const assContent = buildAss(fixture);
  const frames = [];
  for (const rec of results.filter(r => r.generated)) {
    const src = path.join(REPO_ROOT, rec.imagePath);
    const tag = `${rec.sceneId}-${rec.candidateId}`;

    const bgPng = path.join(OUT_DIR, `probe-${tag}-background.png`);
    runFfmpeg(["-y", "-i", src, "-vf", bgChain, "-frames:v", "1", bgPng], `bg ${tag}`);
    frames.push({ candidateId: rec.candidateId, kind: "background_probe", file: path.relative(REPO_ROOT, bgPng).replace(/\\/g, "/") });

    const assPath = path.join(OUT_DIR, `probe-${tag}-overlay.ass`);
    fs.writeFileSync(assPath, assContent, "utf8");
    const ovPng = path.join(OUT_DIR, `probe-${tag}-overlay.png`);
    const assFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
    runFfmpeg(["-y", "-i", bgPng, "-vf", `ass='${assFilter}'`, "-frames:v", "1", ovPng], `overlay ${tag}`);
    frames.push({ candidateId: rec.candidateId, kind: "overlay_probe", file: path.relative(REPO_ROOT, ovPng).replace(/\\/g, "/") });

    const z = fixture.probe.denominationZoomCrop.perCandidate[rec.candidateId];
    if (z) {
      const zoomPng = path.join(OUT_DIR, `probe-${tag}-denomination-zoom.png`);
      runFfmpeg(["-y", "-i", bgPng, "-vf", `crop=${z.w}:${z.h}:${z.x}:${z.y},scale=${z.w * z.scale}:${z.h * z.scale}:flags=lanczos`, "-frames:v", "1", zoomPng], `zoom ${tag}`);
      frames.push({ candidateId: rec.candidateId, kind: "denomination_zoom_crop", evidenceOnly: true, file: path.relative(REPO_ROOT, zoomPng).replace(/\\/g, "/") });
    }
    log(`[${rec.candidateId}] background + overlay + zoom-crop probe OK`);
  }

  // ── summary ────────────────────────────────────────────────────────────────
  const generated = results.filter(r => r.generated);
  const mpPerImage = Math.round((SIZE.w * SIZE.h) / 1e6 * 1000) / 1000;
  const summary = {
    schemaVersion: "golden_sample_v2_s6_flux2_denomination_patch_summary_v1",
    taskId: fixture.taskId,
    provider: "flux_2_pro_bfl",
    mode: PROBE_ONLY ? "PROBE_ONLY" : "GENERATE_AND_PROBE",
    status: halted ? `HALTED_${halted}` : "RAN",
    endpoint: FLUX_ENDPOINT,
    endpointFallbackUsed: false,
    sizeFallbackUsed: false,
    requestedSize: `${SIZE.w}x${SIZE.h}`,
    sceneScope: fixture.sceneId,
    promptSource: "scripts/fixtures/golden_sample_v2_s6_flux2_denomination_patch_prompts.v1.json candidates[].prompt",
    createCalls: counters.createCalls,
    createCallHardCap: MAX_CREATE_CALLS,
    pollCalls: counters.pollCalls,
    costCeilingUsd: COST_CEILING_USD,
    costEstimateNote: `MP-based 추정: ${mpPerImage}MP/장 × ${counters.createCalls} create calls — 공식 from $0.03/MP 기준 약 $${Math.round(mpPerImage * 0.03 * counters.createCalls * 100) / 100} (정확 금액은 BFL 대시보드 확인 필요, 상한 $${COST_CEILING_USD})`,
    gateRule: GATE,
    backgroundChain: bgChain,
    rendererParity: "직전 denomination probe(golden_sample_v2_denomination_render_probe)와 동일 체인 + 동일 s6 overlay 스펙 — parity 사전 검증됨",
    generatedCount: generated.length,
    attemptedCount: results.length,
    results,
    frameCount: frames.length,
    viewerFrameCount: frames.filter(f => !f.evidenceOnly).length,
    frames,
    visionQaNote: "raw/background/overlay risk 판정과 story evidence 판정은 Claude vision이 qa-report에 기록한다. denomination_zoom_crop은 evidence 전용.",
    boundary: { ...fixture.boundary },
    createdAt: new Date().toISOString(),
    secretValuesLogged: false,
  };
  const outPath = path.join(OUT_DIR, fixture.outputs.runSummary);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);
  log(`완료 — createCalls=${counters.createCalls}/${MAX_CREATE_CALLS} pollCalls=${counters.pollCalls} generated=${generated.length}/${results.length} frames=${frames.length} halted=${halted || "no"}`);
}

main().catch((e) => {
  console.error("[FATAL][s6-patch]", String(e?.message || e).slice(0, 300));
  process.exit(1);
});
