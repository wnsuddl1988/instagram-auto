/**
 * FLUX.2 [pro] Scene 1 v2.3 Single Validation
 *
 * 목적:
 *   selected image set의 마지막 미해결 hook 씬(scene 1)만 1장 재검증한다.
 *   v2.2 유일 위반(봉투 플랩 glassine 워터마크 마크)을 재질(thick opaque matte white paper)
 *   + 구도(flap folded back low) 2중 패치로 차단했는지 확인한다.
 *   자동화 구현이 아니라 단일 validation이다. render/TTS/mux/upload 없음.
 *
 * Owner 승인 (2026-07-02):
 *   승인: FLUX2 scene 1 v2.3 단일 재검증 — FLUX.2 [pro] 최대 1장(scene 1 only), 비용 $0.25 상한,
 *   BFL_API_KEY 사용 허용, 봉투 플랩을 plain matte white paper / not glassine / not translucent /
 *   no watermark / no security pattern로 강화, render/TTS/mux/upload 없이 이미지 QA 보고 후 중단
 *
 * 안전 규칙:
 *   - FLUX.2 [pro] 단일 provider. OpenAI/ChatGPT/Gemini/Midjourney 경로 없음.
 *   - 공식 단일 endpoint https://api.bfl.ai/v1/flux-2-pro — endpoint/size/provider fallback 없음.
 *   - create call hard cap = 1. 실패해도 추가 호출/retry 없이 실패 기록만 남긴다.
 *   - scene 1만 생성. scene 2/3/4/5/6은 코드 수준에서 차단.
 *   - polling call은 create call과 분리 집계 (과금 아님).
 *   - .env.local에서 BFL_API_KEY만 읽고 나머지는 파싱 즉시 버린다. 값 출력/기록 금지.
 *   - width=1088, height=1936 고정.
 *   - prompt source of truth = v2.3 fixture의 scene.finalPrompt (없으면 실행 전 abort).
 *
 * 사용: node scripts/run-flux2-scene1-v2-3-single-validation.mjs
 * exit: 0 = 실행 완료(생성 실패 기록 포함 가능, summary 참조), 1 = 실행 자체 불가
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_flux2_scene1_v2_3_single_validation_prompt.json");
const OUT_DIR = path.join(REPO_ROOT, "output", "money-shorts", "flux2-scene1-v2-3-single-validation");

const FLUX_ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"; // 공식 문서 기준 단일 endpoint (fallback 없음)
const SIZE = { w: 1088, h: 1936 }; // 고정 — size fallback 금지
const MAX_CREATE_CALLS = 1; // Owner 승인 hard cap
const TARGET_SCENE = 1; // scene 2/3/4/5/6 = clean PASS 보유, 생성 금지
const FORBIDDEN_SCENES = new Set([2, 3, 4, 5, 6]);
const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][flux2-s1-v2.3] ${m}`); }
function warn(m) { console.warn(`[WARN][flux2-s1-v2.3] ${m}`); }

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

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const BFL_KEY = loadBflKey();
  if (!BFL_KEY) {
    console.error("ABORT: BFL_API_KEY 없음 (존재 여부 boolean만 판정, 값 미출력)");
    process.exit(1);
  }
  log("BFL_API_KEY 존재 확인 (값 미출력) — scene 1 v2.3 single validation 시작");

  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  if (fixture.schemaVersion !== "money_shorts_flux2_scene1_v2_3_single_validation_prompt") {
    console.error("ABORT: v2.3 fixture schemaVersion 불일치");
    process.exit(1);
  }
  const s = fixture.scene;
  if (!s || s.order !== TARGET_SCENE) {
    console.error(`ABORT: fixture scene이 scene 1이 아님 (order=${s?.order})`);
    process.exit(1);
  }
  if (FORBIDDEN_SCENES.has(s.order)) {
    console.error(`ABORT: scene ${s.order}는 생성 금지 대상`);
    process.exit(1);
  }
  if (typeof s.finalPrompt !== "string" || s.finalPrompt.length < 200) {
    console.error("ABORT: scene 1 finalPrompt가 없음/비정상 — fixture 확인 필요");
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`out-dir: ${OUT_DIR}`);
  log(`endpoint: ${FLUX_ENDPOINT} (단일, fallback 없음) size: ${SIZE.w}x${SIZE.h} (고정) scene: ${s.order} (${s.version})`);

  let createCalls = 0; // 과금 발생 call — hard cap 1
  let pollCalls = 0;   // 상태 polling — 과금 아님, 분리 집계
  const rec = { order: s.order, sceneRole: s.sceneRole, version: s.version, attempted: false, generated: false };

  createCalls++; // 단일 create — 실패해도 재시도 없음
  rec.attempted = true;
  try {
    log(`scene ${s.order} (${s.sceneRole} ${s.version}) create call ${createCalls}/${MAX_CREATE_CALLS} — ${SIZE.w}x${SIZE.h}`);
    const resp = await fetch(FLUX_ENDPOINT, {
      method: "POST",
      headers: { "x-key": BFL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: s.finalPrompt, width: SIZE.w, height: SIZE.h }),
      signal: AbortSignal.timeout(60000),
    });
    const bodyText = await resp.text();
    if (!resp.ok) {
      rec.error = `http_${resp.status}: ${bodyText.slice(0, 250)}`;
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      warn(`scene 1 create 거부 — retry/fallback 없이 기록: ${rec.error}`);
    } else {
      const task = JSON.parse(bodyText);
      const pollUrl = task.polling_url || `https://api.bfl.ai/v1/get_result?id=${task.id}`;
      let sampleUrl = null; let lastStatus = "";
      for (let i = 0; i < 90; i++) { // 최대 180s 폴링
        await new Promise(r => setTimeout(r, 2000));
        pollCalls++;
        const pr = await fetch(pollUrl, { headers: { "x-key": BFL_KEY }, signal: AbortSignal.timeout(30000) });
        const pj = await pr.json().catch(() => null);
        lastStatus = pj?.status || `http_${pr.status}`;
        if (lastStatus === "Ready") { sampleUrl = pj?.result?.sample || null; break; }
        if (/Error|Failed|Moderated|Not Found/i.test(lastStatus)) break;
      }
      if (!sampleUrl) {
        rec.error = `poll_end_status=${lastStatus}`;
        rec.gate = "FAIL_PROVIDER_BLOCKED";
        warn(`scene 1 결과 없음 — 추가 생성 없이 기록: ${rec.error}`);
      } else {
        const ir = await fetch(sampleUrl, { signal: AbortSignal.timeout(120000) });
        const buf = Buffer.from(await ir.arrayBuffer());
        if (!buf || buf.length < 10000) {
          rec.error = "empty_sample_download";
          rec.gate = "FAIL_PROVIDER_BLOCKED";
        } else {
          const dims = sniffImageDims(buf) || {};
          const ext = dims.format === "jpeg" ? "jpg" : (dims.format || "png");
          const file = path.join(OUT_DIR, `flux2s1v23-scene-01-${s.sceneRole}.${ext}`);
          fs.writeFileSync(file, buf);
          rec.generated = true;
          rec.imagePath = file;
          rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
          rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
          rec.fileSizeBytes = buf.length;
          rec.requestedSize = `${SIZE.w}x${SIZE.h}`;
          rec.gate = gateEval(dims.w, dims.h);
          log(`scene 1 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
        }
      }
    }
  } catch (e) {
    rec.error = String(e?.message || e).slice(0, 200);
    rec.gate = "FAIL_PROVIDER_BLOCKED";
    warn(`scene 1 실패 — 추가 생성 없이 기록: ${rec.error}`);
  }

  const mpPerImage = Math.round((SIZE.w * SIZE.h) / 1e6 * 1000) / 1000;
  const summary = {
    schemaVersion: "money_shorts_flux2_scene1_v2_3_single_validation_summary",
    taskId: "creative-v2-flux2-scene1-v2-3-single-validation",
    provider: "flux_2_pro_bfl",
    status: "RAN",
    endpoint: FLUX_ENDPOINT,
    endpointFallbackUsed: false,
    sizeFallbackUsed: false,
    requestedSize: `${SIZE.w}x${SIZE.h}`,
    targetScene: TARGET_SCENE,
    excludedScenes: { "2": "v1 PASS 보유", "3": "v2 PASS 보유", "4": "v2 PASS 보유", "5": "v2.1 PASS 보유", "6": "set-v1 PASS 보유" },
    promptSource: "scripts/fixtures/golden_sample_flux2_scene1_v2_3_single_validation_prompt.json scene.finalPrompt",
    createCalls,
    createCallHardCap: MAX_CREATE_CALLS,
    pollCalls,
    costCeilingUsd: 0.25,
    costEstimateNote: `MP-based 추정: ${mpPerImage}MP/장 × ${createCalls} create call — 공식 from $0.03/MP 기준 상한 $0.25 내 추정 (정확 금액은 BFL 대시보드 확인 필요)`,
    gateRule: GATE,
    results: [rec],
    createdAt: new Date().toISOString(),
    secretValuesLogged: false,
  };
  const outPath = path.join(OUT_DIR, "summary-flux2-scene1-v2-3-single-validation.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);
  log(`완료 — createCalls=${createCalls}/${MAX_CREATE_CALLS} pollCalls=${pollCalls} generated=${rec.generated ? 1 : 0}/1 gate=${rec.gate || "n/a"}`);
}

main().catch((e) => {
  console.error("[FATAL][flux2-s1-v2.3]", String(e?.message || e).slice(0, 300));
  process.exit(1);
});
