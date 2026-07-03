/**
 * OpenAI Full Selected Image Candidates v1 (Golden Sample T2)
 *
 * 목적:
 *   T2("월급이 3일 만에 사라지는 이유") 6-scene × 후보 2장 = 총 12장 상한으로
 *   OpenAI gpt-image-2 selected image 후보를 생성하고 실측/게이트 결과를 남긴다.
 *   render/TTS/mux/upload 없음. 이미지 QA 보고 후 중단하는 slice의 실행부.
 *
 * Owner 승인: "OpenAI gpt-image-2 6-scene full selected image 후보 생성 승인 —
 *   12장 상한, 비용 $5 상한, render/TTS/mux/upload 없이 이미지 QA 보고 후 중단"
 *
 * 안전 규칙:
 *   - OpenAI gpt-image-2 only. 다른 provider/model fallback 금지 —
 *     size/model 거부 시 즉시 BLOCKED로 전체 중단(추가 paid call 방지).
 *   - 총 generation call 12회 하드캡. 재시도 없음.
 *   - secret 값 미출력: .env.local은 OPENAI_API_KEY 한 key만 메모리 보관.
 *   - .env.local 수정 없음.
 *
 * 사용: node scripts/run-openai-full-selected-image-candidates-v1.mjs
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROMPTS_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_openai_full_selected_image_prompts.v1.json");
const OUT_DIR = path.join(REPO_ROOT, "output", "money-shorts", "openai-full-selected-image-candidates-v1");

const MODEL = "gpt-image-2";
const SIZE = "1088x1936";
const QUALITY = "high";
const MAX_CALLS = 12;
const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][openai-full-candidates] ${m}`); }
function warn(m) { console.warn(`[WARN][openai-full-candidates] ${m}`); }

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
assertPaidImageAllowed("ALLOW_OPENAI_IMAGE");

// ── .env.local 로드 (값 미출력, 수정 없음, secret 최소화: OPENAI_API_KEY만) ──
function loadOpenAIKeyFromEnvLocal() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  try {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^OPENAI_API_KEY\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[1].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      return v;
    }
  } catch { /* .env.local 없으면 process env만 사용 */ }
  return null;
}
const OPENAI_KEY = process.env.OPENAI_API_KEY || loadOpenAIKeyFromEnvLocal();
if (!OPENAI_KEY) {
  console.error("ABORT: OPENAI_API_KEY 없음 (값 미출력)");
  process.exit(1);
}

// ── 프롬프트 fixture ─────────────────────────────────────────────────────────
const promptsDoc = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
if (promptsDoc.schemaVersion !== "money_shorts_openai_full_selected_image_prompts_v1" || (promptsDoc.scenes || []).length !== 6) {
  console.error("ABORT: prompts fixture 불일치");
  process.exit(1);
}
const scenes = promptsDoc.scenes.slice().sort((a, b) => a.order - b.order);
const jobs = [];
for (const s of scenes) {
  for (const v of s.variants) {
    jobs.push({ order: s.order, sceneRole: s.sceneRole, variant: v.variant, composition: v.composition, finalPrompt: v.finalPrompt });
  }
}
if (jobs.length > MAX_CALLS) {
  console.error(`ABORT: job 수(${jobs.length})가 상한 ${MAX_CALLS}장을 초과`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

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
  if (w >= GATE.minW && h >= GATE.minH && Math.abs(aspect - GATE.aspectTarget) <= GATE.aspectTol) return "PASS_1080x1920_NATIVE";
  if (w < GATE.minW || h < GATE.minH) return "FAIL_RESOLUTION";
  return "FAIL_ASPECT";
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== OpenAI full selected image candidates — ${jobs.length} jobs (cap ${MAX_CALLS}) ===`);
  log(`model=${MODEL} size=${SIZE} quality=${QUALITY}`);
  log(`out-dir: ${OUT_DIR}`);

  const results = [];
  let calls = 0;
  let blocked = null;

  for (const job of jobs) {
    if (blocked) break;
    if (calls >= MAX_CALLS) { warn("call 상한 도달 — 중단"); break; }
    calls++;
    const label = `scene ${job.order}${job.variant} (${job.sceneRole})`;
    const rec = { order: job.order, sceneRole: job.sceneRole, variant: job.variant, composition: job.composition, attempted: true, generated: false };
    try {
      log(`${label} 생성 요청 (${calls}/${MAX_CALLS})`);
      const resp = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: MODEL, prompt: job.finalPrompt, size: SIZE, quality: QUALITY, n: 1 }),
        signal: AbortSignal.timeout(180000),
      });
      const bodyText = await resp.text();
      if (!resp.ok) {
        let errMsg = "";
        try { errMsg = JSON.parse(bodyText)?.error?.message || bodyText.slice(0, 200); } catch { errMsg = bodyText.slice(0, 200); }
        rec.error = `http_${resp.status}: ${errMsg.slice(0, 200)}`;
        // size/model 거부는 이후 호출도 전부 실패할 것이므로 전체 BLOCKED (fallback 금지)
        if (/size|model/i.test(errMsg) && /invalid|not|unsupported|unknown/i.test(errMsg)) {
          blocked = rec.error;
          rec.gate = "FAIL_PROVIDER_BLOCKED";
          warn(`size/model 거부 감지 — fallback 없이 전체 BLOCKED: ${rec.error}`);
        } else {
          rec.gate = "FAIL_PROVIDER_ERROR";
          warn(`${label} 실패 (계속 진행): ${rec.error}`);
        }
        results.push(rec);
        continue;
      }
      const data = JSON.parse(bodyText);
      const item = data?.data?.[0];
      let buf = null;
      if (item?.b64_json) buf = Buffer.from(item.b64_json, "base64");
      else if (item?.url) {
        const ir = await fetch(item.url, { signal: AbortSignal.timeout(120000) });
        buf = Buffer.from(await ir.arrayBuffer());
      }
      if (!buf || buf.length < 10000) { rec.error = "empty_image_payload"; rec.gate = "FAIL_PROVIDER_ERROR"; results.push(rec); continue; }
      const dims = sniffImageDims(buf) || {};
      const file = path.join(OUT_DIR, `scene-${String(job.order).padStart(2, "0")}${job.variant}-${job.sceneRole.replace(/^scene_\d+_/, "")}.png`);
      fs.writeFileSync(file, buf);
      rec.generated = true;
      rec.imagePath = file;
      rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
      rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
      rec.fileSizeBytes = buf.length;
      rec.gate = gateEval(dims.w, dims.h);
      rec.usage = data?.usage ?? null; // cost evidence (API 응답)
      log(`${label} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
      results.push(rec);
    } catch (e) {
      rec.error = String(e?.message || e).slice(0, 200);
      rec.gate = "FAIL_PROVIDER_ERROR";
      warn(`${label} 예외 (계속 진행): ${rec.error}`);
      results.push(rec);
    }
  }

  const gen = results.filter(r => r.generated);
  const pass = gen.filter(r => r.gate === "PASS_1080x1920_NATIVE");
  const totalOutputTokens = gen.reduce((s, r) => s + (r.usage?.output_tokens || 0), 0);
  const totalInputTokens = gen.reduce((s, r) => s + (r.usage?.input_tokens || 0), 0);

  const summary = {
    schemaVersion: "money_shorts_openai_full_selected_image_summary_v1",
    taskId: "creative-v2-openai-full-selected-image-candidates-v1",
    ownerApproval: "OpenAI gpt-image-2 6-scene full selected image 후보 생성 승인 — 12장 상한, 비용 $5 상한, render/TTS/mux/upload 없이 이미지 QA 보고 후 중단",
    topic: promptsDoc.topic,
    provider: "openai_gpt_image_2",
    model: MODEL, size: SIZE, quality: QUALITY,
    gateRule: GATE,
    callsUsed: calls, callCap: MAX_CALLS,
    generated: gen.length, gatePassed: pass.length,
    blocked,
    costEvidence: {
      type: "api_usage_tokens",
      totalOutputImageTokens: totalOutputTokens,
      totalInputTextTokens: totalInputTokens,
      note: "정확 달러 환산은 gpt-image-2 공식 토큰 단가 기준 산정 필요. 4-scene test 기준 5,322 output tokens/장 ≈ 기준사이즈 High $0.165 수준과 유사 범위 추정.",
    },
    secretValuesLogged: false,
    uploadReady: false,
    renderReady: false,
    createdAt: new Date().toISOString(),
    results,
  };
  const outPath = path.join(OUT_DIR, "summary-openai-full-candidates.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);
  log(`완료 — calls=${calls}/${MAX_CALLS} generated=${gen.length} gatePass=${pass.length}${blocked ? ` BLOCKED=${blocked}` : ""}`);
  if (blocked) process.exitCode = 2;
}

main().catch((e) => {
  console.error("[FATAL][openai-full-candidates]", String(e?.message || e).slice(0, 300));
  process.exit(1);
});
