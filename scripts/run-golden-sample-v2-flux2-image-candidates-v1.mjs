/**
 * Golden Sample v2 — FLUX.2 [pro] Image Candidate Generation v1
 *
 * 목적:
 *   Story-Causality First + Visual Evidence Second blueprint(salary_3days.v2)의
 *   6 scenes × 2 candidates = 최대 12장 이미지 후보를 생성하고 실측 gate를 기록한다.
 *   scene별 visual evidence QA(vision 판정)는 실행 후 별도 리포트에서 수행한다.
 *   render/TTS/mux/upload 없음.
 *
 * Owner 승인 (2026-07-02, _ai/HANDOFF_NOW.md Current Approved Slice):
 *   승인: Golden Sample v2 FLUX2 image candidate generation — FLUX.2 [pro] 최대 12장
 *   (6 scenes × 2 candidates), 비용 $3 상한, BFL_API_KEY 사용 허용.
 *   money-like objects 적극 허용, no readable AI-generated text 엄격 유지.
 *
 * 안전 규칙:
 *   - FLUX.2 [pro] 단일 provider. OpenAI/ChatGPT/Gemini/Midjourney 경로 없음.
 *   - 공식 단일 endpoint https://api.bfl.ai/v1/flux-2-pro — endpoint/size/provider fallback 없음.
 *   - create call hard cap = 12. retry로 호출 수 늘리기 금지 (후보당 정확히 1 create).
 *   - create HTTP 오류(401/402/403/429/5xx 등) 발생 시 이후 create 전체 중단, evidence만 기록.
 *   - polling call은 create call과 분리 집계 (과금 아님).
 *   - .env.local에서 BFL_API_KEY만 읽고 나머지 줄은 파싱 즉시 버린다. 값 출력/기록 금지.
 *   - width=1088, height=1936 고정.
 *   - prompt source of truth = fixture scenes[].candidates[].prompt (없으면 실행 전 abort).
 *
 * 사용: node scripts/run-golden-sample-v2-flux2-image-candidates-v1.mjs
 * exit: 0 = 실행 완료(개별 실패 기록 포함 가능, summary 참조), 1 = 실행 자체 불가
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const FIXTURE_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_v2_flux2_image_candidate_prompts.salary_3days.v1.json");
const OUT_DIR = path.join(REPO_ROOT, "output", "money-shorts", "golden-sample-v2-flux2-image-candidates-v1");

const FLUX_ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"; // 공식 단일 endpoint — fallback 금지
const SIZE = { w: 1088, h: 1936 }; // 고정 — size fallback 금지
const MAX_CREATE_CALLS = 12; // Owner 승인 hard cap (6 scenes × 2 candidates)
const COST_CEILING_USD = 3.0;
const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };
// create 자체가 HTTP 오류면 billing/quota/schema 문제 가능성 — 이후 생성 전체 중단
const HALT_ON_CREATE_HTTP_ERROR = true;

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][gsv2-flux2] ${m}`); }
function warn(m) { console.warn(`[WARN][gsv2-flux2] ${m}`); }

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

// ── 단일 후보 생성 (create 1회, retry 없음) ──────────────────────────────────
async function generateOne(BFL_KEY, sceneId, cand, counters) {
  const rec = {
    sceneId, candidateId: cand.candidateId, compositionIdea: cand.compositionIdea,
    attempted: false, generated: false,
  };
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
    const file = path.join(OUT_DIR, `gsv2-${sceneId}-${cand.candidateId}.${ext}`);
    fs.writeFileSync(file, buf);
    rec.generated = true;
    rec.imagePath = file;
    rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
    rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
    rec.fileSizeBytes = buf.length;
    rec.requestedSize = `${SIZE.w}x${SIZE.h}`;
    rec.gate = gateEval(dims.w, dims.h);
    log(`${cand.candidateId} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
    return rec;
  } catch (e) {
    rec.error = String(e?.message || e).slice(0, 200);
    rec.gate = "FAIL_PROVIDER_BLOCKED";
    warn(`${cand.candidateId} 실패 — 추가 생성 없이 기록: ${rec.error}`);
    return rec;
  }
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const BFL_KEY = loadBflKey();
  if (!BFL_KEY) {
    console.error("ABORT: BFL_API_KEY 없음 (존재 여부 boolean만 판정, 값 미출력)");
    process.exit(1);
  }
  log("BFL_API_KEY 존재 확인 (값 미출력) — Golden Sample v2 image candidates 생성 시작");

  const fixture = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8"));
  if (fixture.schemaVersion !== "golden_sample_v2_flux2_image_candidate_prompts_salary_3days_v1") {
    console.error("ABORT: fixture schemaVersion 불일치");
    process.exit(1);
  }
  const scenes = fixture.scenes || [];
  const totalCandidates = scenes.reduce((n, s) => n + (s.candidates?.length || 0), 0);
  if (scenes.length !== 6 || totalCandidates !== 12) {
    console.error(`ABORT: fixture 구조 이상 — scenes=${scenes.length} candidates=${totalCandidates} (기대 6/12)`);
    process.exit(1);
  }
  for (const s of scenes) {
    for (const c of s.candidates) {
      if (typeof c.prompt !== "string" || c.prompt.length < 200) {
        console.error(`ABORT: ${c.candidateId} prompt 비정상 — fixture 확인 필요`);
        process.exit(1);
      }
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`out-dir: ${OUT_DIR}`);
  log(`endpoint: ${FLUX_ENDPOINT} (단일, fallback 없음) size: ${SIZE.w}x${SIZE.h} (고정) — 6 scenes × 2 candidates`);

  const counters = { createCalls: 0, pollCalls: 0 };
  const results = [];
  let halted = null;

  outer:
  for (const s of scenes) {
    for (const c of s.candidates) {
      if (counters.createCalls >= MAX_CREATE_CALLS) {
        warn(`hard cap ${MAX_CREATE_CALLS} 도달 — 남은 후보 생성 중단`);
        halted = "HARD_CAP_REACHED";
        break outer;
      }
      const rec = await generateOne(BFL_KEY, s.sceneId, c, counters);
      results.push(rec);
      if (rec.httpError && HALT_ON_CREATE_HTTP_ERROR) {
        halted = `CREATE_HTTP_ERROR_AT_${c.candidateId}`;
        warn(`create HTTP 오류 → billing/quota/schema 가능성 — 이후 생성 전체 중단 (evidence만 기록)`);
        break outer;
      }
    }
  }

  const generated = results.filter(r => r.generated);
  const mpPerImage = Math.round((SIZE.w * SIZE.h) / 1e6 * 1000) / 1000;
  const summary = {
    schemaVersion: "golden_sample_v2_flux2_image_candidates_summary_v1",
    taskId: "creative-v2-golden-sample-v2-flux2-image-candidate-generation-v1",
    provider: "flux_2_pro_bfl",
    status: halted ? `HALTED_${halted}` : "RAN",
    endpoint: FLUX_ENDPOINT,
    endpointFallbackUsed: false,
    sizeFallbackUsed: false,
    requestedSize: `${SIZE.w}x${SIZE.h}`,
    promptSource: "scripts/fixtures/golden_sample_v2_flux2_image_candidate_prompts.salary_3days.v1.json scenes[].candidates[].prompt",
    blueprintSource: fixture.blueprintSource,
    createCalls: counters.createCalls,
    createCallHardCap: MAX_CREATE_CALLS,
    pollCalls: counters.pollCalls,
    costCeilingUsd: COST_CEILING_USD,
    costEstimateNote: `MP-based 추정: ${mpPerImage}MP/장 × ${counters.createCalls} create calls — 공식 from $0.03/MP 기준 약 $${Math.round(mpPerImage * 0.03 * counters.createCalls * 100) / 100}+ (정확 금액은 BFL 대시보드 확인 필요, 상한 $${COST_CEILING_USD})`,
    gateRule: GATE,
    generatedCount: generated.length,
    attemptedCount: results.length,
    results,
    visionQaNote: "scene별 visual evidence QA(must_show/must_not_show/no-readable-text/story relevance)는 별도 QA report에서 Claude vision 판정으로 수행",
    createdAt: new Date().toISOString(),
    secretValuesLogged: false,
  };
  const outPath = path.join(OUT_DIR, "summary-golden-sample-v2-flux2-image-candidates.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);
  log(`완료 — createCalls=${counters.createCalls}/${MAX_CREATE_CALLS} pollCalls=${counters.pollCalls} generated=${generated.length}/${results.length} halted=${halted || "no"}`);
}

main().catch((e) => {
  console.error("[FATAL][gsv2-flux2]", String(e?.message || e).slice(0, 300));
  process.exit(1);
});
