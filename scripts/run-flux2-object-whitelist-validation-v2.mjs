/**
 * FLUX.2 [pro] Object-Whitelist Validation v2
 *
 * 목적:
 *   object-whitelist contract v2(golden_sample_flux2_object_whitelist_contract.v2.json)가
 *   FLUX2에서 no-text와 subject delivery를 동시에 잡는지 scene 1/3/4/5로 재검증한다.
 *   scene 2는 v1 PASS 이미지 보유로 제외, scene 6은 후순위 제외.
 *   자동화 구현이 아니라 소량 validation이다. render/TTS/mux/upload 없음.
 *
 * Owner 승인 (2026-07-02):
 *   FLUX2 object-whitelist v2 재검증 승인 — FLUX.2 [pro] 최대 4장, 비용 $1 상한,
 *   BFL_API_KEY 사용 허용, render/TTS/mux/upload 없이 이미지 QA 보고 후 중단
 *
 * 안전 규칙:
 *   - FLUX.2 [pro] 단일 provider. OpenAI/ChatGPT/Gemini/Midjourney 경로 없음.
 *   - 공식 단일 endpoint https://api.bfl.ai/v1/flux-2-pro — endpoint/size/provider fallback 없음.
 *   - create call hard cap = 4. 이미지 추가 생성 retry 없음.
 *   - polling call은 create call과 분리 집계 (과금 아님).
 *   - .env.local에서 BFL_API_KEY만 읽고 나머지는 파싱 즉시 버린다. 값 출력/기록 금지.
 *   - width=1088, height=1936 고정.
 *   - prompt source of truth = contract v2 fixture의 finalPromptV2 (null이면 실행 전 abort).
 *
 * 사용: node scripts/run-flux2-object-whitelist-validation-v2.mjs
 * exit: 0 = 실행 완료(개별 이미지 실패 포함 가능, summary 참조), 1 = 실행 자체 불가
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CONTRACT_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_flux2_object_whitelist_contract.v2.json");
const OUT_DIR = path.join(REPO_ROOT, "output", "money-shorts", "flux2-object-whitelist-validation-v2");

const FLUX_ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"; // 공식 문서 기준 단일 endpoint (fallback 없음)
const SIZE = { w: 1088, h: 1936 }; // 고정 — size fallback 금지
const MAX_CREATE_CALLS = 4; // Owner 승인 hard cap
const TARGET_SCENES = [1, 3, 4, 5]; // scene 2 = v1 PASS 보유 제외, scene 6 = 후순위 제외
const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][flux2-wl-v2] ${m}`); }
function warn(m) { console.warn(`[WARN][flux2-wl-v2] ${m}`); }

// ── fail-closed paid image allow guard (secret read / API 호출 전에 반드시 통과) ──
// PAID_API_ENABLED=true 하나만으로는 열리지 않는다. provider allow flag도 명시 true여야 한다.
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
function assertPaidImageAllowed(providerFlagKey) {
  const isTrue = (k) => String(process.env[k] ?? "").toLowerCase() === "true";
  const master = isTrue("PAID_API_ENABLED");
  const provider = isTrue(providerFlagKey);
  if (!master || !provider) {
    const need = [];
    if (!master) need.push("PAID_API_ENABLED=true");
    if (!provider) need.push(`${providerFlagKey}=true`);
    console.error(`ABORT: paid image 경로 차단 (fail-closed). 필요한 env: ${need.join(", ")} — secret/API 호출 전에 중단.`);
    process.exit(2);
  }
}
assertPaidImageAllowed("ALLOW_BFL_FLUX2");

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
  log("BFL_API_KEY 존재 확인 (값 미출력) — object-whitelist v2 validation 시작");

  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  if (contract.schemaVersion !== "money_shorts_flux2_object_whitelist_contract_v2") {
    console.error("ABORT: contract v2 schemaVersion 불일치");
    process.exit(1);
  }
  const scenes = TARGET_SCENES
    .map(o => (contract.sceneRewritesForT2 || []).find(s => s.order === o))
    .filter(Boolean)
    .sort((a, b) => a.order - b.order);
  if (scenes.length !== 4) {
    console.error(`ABORT: 대상 scene 4개를 찾지 못함 (found=${scenes.length})`);
    process.exit(1);
  }
  for (const s of scenes) {
    if (s.order === 2) { console.error("ABORT: scene 2는 생성 금지 대상"); process.exit(1); }
    if (typeof s.finalPromptV2 !== "string" || s.finalPromptV2.length < 200) {
      console.error(`ABORT: scene ${s.order} finalPromptV2가 null/비정상 — contract v2 확인 필요`);
      process.exit(1);
    }
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  log(`out-dir: ${OUT_DIR}`);
  log(`endpoint: ${FLUX_ENDPOINT} (단일, fallback 없음) size: ${SIZE.w}x${SIZE.h} (고정) scenes: ${scenes.map(s => s.order).join(",")}`);

  let createCalls = 0; // 과금 발생 call — hard cap 4
  let pollCalls = 0;   // 상태 polling — 과금 아님, 분리 집계
  const results = [];

  for (const s of scenes) {
    const rec = { order: s.order, sceneRole: s.sceneRole, attempted: false, generated: false };
    if (createCalls >= MAX_CREATE_CALLS) {
      rec.error = "create_call_cap_reached_before_attempt";
      results.push(rec);
      continue;
    }
    rec.attempted = true;
    createCalls++; // create 1회/scene — 실패해도 재생성 retry 없음
    try {
      log(`scene ${s.order} (${s.sceneRole}) create call ${createCalls}/${MAX_CREATE_CALLS} — ${SIZE.w}x${SIZE.h}`);
      const resp = await fetch(FLUX_ENDPOINT, {
        method: "POST",
        headers: { "x-key": BFL_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: s.finalPromptV2, width: SIZE.w, height: SIZE.h }),
        signal: AbortSignal.timeout(60000),
      });
      const bodyText = await resp.text();
      if (!resp.ok) {
        rec.error = `http_${resp.status}: ${bodyText.slice(0, 250)}`;
        rec.gate = "FAIL_PROVIDER_BLOCKED";
        warn(`scene ${s.order} create 거부 — retry/fallback 없이 기록: ${rec.error}`);
        results.push(rec);
        continue;
      }
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
        warn(`scene ${s.order} 결과 없음 — 추가 생성 없이 기록: ${rec.error}`);
        results.push(rec);
        continue;
      }
      const ir = await fetch(sampleUrl, { signal: AbortSignal.timeout(120000) });
      const buf = Buffer.from(await ir.arrayBuffer());
      if (!buf || buf.length < 10000) {
        rec.error = "empty_sample_download";
        rec.gate = "FAIL_PROVIDER_BLOCKED";
        results.push(rec);
        continue;
      }
      const dims = sniffImageDims(buf) || {};
      const ext = dims.format === "jpeg" ? "jpg" : (dims.format || "png");
      const file = path.join(OUT_DIR, `flux2wl-scene-${String(s.order).padStart(2, "0")}-${s.sceneRole}.${ext}`);
      fs.writeFileSync(file, buf);
      rec.generated = true;
      rec.imagePath = file;
      rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
      rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
      rec.fileSizeBytes = buf.length;
      rec.requestedSize = `${SIZE.w}x${SIZE.h}`;
      rec.gate = gateEval(dims.w, dims.h);
      log(`scene ${s.order} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
    } catch (e) {
      rec.error = String(e?.message || e).slice(0, 200);
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      warn(`scene ${s.order} 실패 — 추가 생성 없이 기록: ${rec.error}`);
    }
    results.push(rec);
  }

  const mpPerImage = Math.round((SIZE.w * SIZE.h) / 1e6 * 1000) / 1000;
  const summary = {
    schemaVersion: "money_shorts_flux2_object_whitelist_validation_summary_v2",
    taskId: "creative-v2-flux2-object-whitelist-validation-v2",
    provider: "flux_2_pro_bfl",
    status: "RAN",
    endpoint: FLUX_ENDPOINT,
    endpointFallbackUsed: false,
    sizeFallbackUsed: false,
    requestedSize: `${SIZE.w}x${SIZE.h}`,
    targetScenes: TARGET_SCENES,
    excludedScenes: { "2": "v1 PASS 이미지 보유 — 재지출 불필요", "6": "후순위 (scene 2와 동일 오브젝트 계열, 최저 위험)" },
    promptSource: "scripts/fixtures/golden_sample_flux2_object_whitelist_contract.v2.json sceneRewritesForT2[].finalPromptV2",
    createCalls,
    createCallHardCap: MAX_CREATE_CALLS,
    pollCalls,
    costCeilingUsd: 1,
    costEstimateNote: `MP-based 추정: ${mpPerImage}MP/장 × ${createCalls} create calls — 공식 from $0.03/MP 기준 상한 $1 내 추정 (정확 금액은 BFL 대시보드 확인 필요)`,
    gateRule: GATE,
    results,
    createdAt: new Date().toISOString(),
    secretValuesLogged: false,
  };
  const outPath = path.join(OUT_DIR, "summary-flux2-object-whitelist-validation-v2.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);

  const gen = results.filter(r => r.generated);
  const pass = gen.filter(r => r.gate === "PASS_1080x1920_NATIVE");
  log(`완료 — createCalls=${createCalls}/${MAX_CREATE_CALLS} pollCalls=${pollCalls} generated=${gen.length}/${results.length} gatePass=${pass.length}`);
}

main().catch((e) => {
  console.error("[FATAL][flux2-wl-v2]", String(e?.message || e).slice(0, 300));
  process.exit(1);
});
