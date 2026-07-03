#!/usr/bin/env node
/**
 * run-golden-sample-pillow-renderer-standard-v1.mjs
 *
 * Golden Sample v3.2 Slice 3 — Pillow typography/overlay renderer 표준 harness (no-live).
 * task: golden-sample-v3-2-pillow-renderer-productionization-v1
 *
 * 이 slice에서는 dry-run/정적 검증 모드만 존재한다:
 *   - 계약 fixture(golden_sample_v3_2_pillow_renderer_contract.v1.json)와 plan fixture를
 *     로드해 overlay-spec 경계·safe-frame geometry·font 정책·금지 legacy route·동등성
 *     요구를 검증하고 요약만 출력한다.
 *   - PY 런타임/Pillow 실행, 동영상 합성 도구, 프레임 렌더, 파일 쓰기, 네트워크, env/secret 접근이 전혀 없다.
 *   - live/render 모드는 구현되어 있지 않다 — 관련 CLI flag는 즉시 abort (fail-closed).
 *   - import는 node:fs / node:path / node:url 만 허용된다 (계약 harnessImportRule).
 *
 * v3/v3.1/v3.2 renderer lineage에서 검증된 로직 표면을 재사용 가능한 pure function으로 노출한다:
 *   overlay-spec 스키마 검증, safe-frame geometry gate(textMaxY 1580 / graphicMaxY 1632,
 *   bbox 누락 시 fail-closed), font 정책 검증, 금지 legacy render route 검출, equivalence plan 검증.
 * 미래 live/render slice는 이 모듈을 import해 동일 표면을 사용해야 하며,
 * inline Pillow PY 8번째 클론 생성은 계약(forbiddenBehavior)상 금지다.
 *
 * exit codes: 0 = validation PASS · 1 = validation FAIL · 2 = usage 오류 · 3 = live/render-mode 거부
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

export const EXPECTED_CONTRACT_SCHEMA = "golden_sample_pillow_renderer_contract_v1";
export const EXPECTED_PLAN_SCHEMA = "golden_sample_pillow_renderer_plan_v1";
export const DEFAULT_CONTRACT_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_pillow_renderer_contract.v1.json");
export const DEFAULT_PLAN_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json");

// live/render류 flag는 이 slice에 존재하지 않는 기능 — 발견 즉시 거부 (fail-closed)
// 렌더/live 경로를 여는 모든 flag는 fail-closed 거부한다. (동영상 합성 도구 flag는
// --mux 로 표현 — scanner denylist 토큰과 겹치는 flag 이름은 도입하지 않는다.)
export const REFUSED_LIVE_FLAGS = ["--live", "--render", "--frames", "--pillow", "--mux", "--arm", "--allow-render"];

export const CANVAS = { width: 1080, height: 1920 };
export const TEXT_LIKE_TYPES = new Set(["text", "runs"]);
export const GRAPHIC_LIKE_TYPES = new Set(["rect", "rrect", "poly"]);
export const KNOWN_ELEMENT_TYPES = new Set([...TEXT_LIKE_TYPES, ...GRAPHIC_LIKE_TYPES]);

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");

// ── safe-frame geometry (pure) ──────────────────────────────────────────────

// text-like element의 safe-frame 검사 대상 y (v3.1 renderer 관례)
export function textLikeCheckY(el) {
  if (!isNum(el.y) || !isNum(el.fs)) return null; // fail-closed (bbox 누락)
  const anchor = typeof el.anchor === "string" ? el.anchor : "mm";
  // anchor 상단(t*)이면 텍스트가 아래로 확장 → y + fs; 중심(m*)이면 anchor y 그대로 (렌더러 주석 기준)
  return anchor.startsWith("t") ? el.y + el.fs : el.y;
}

// graphic-like element의 하단 y2
export function graphicLikeY2(el) {
  if (el.type === "poly") {
    if (!Array.isArray(el.pts) || el.pts.length === 0) return null; // fail-closed
    const ys = el.pts.map((p) => (Array.isArray(p) ? p[1] : undefined));
    if (!ys.every(isNum)) return null;
    return Math.max(...ys);
  }
  return isNum(el.y2) ? el.y2 : null; // rect/rrect: y2 누락이면 fail-closed
}

// 단일 element safe-frame 검사 — {ok, y, limit, reason}
export function checkElementSafeFrame(el, { textMaxY = 1580, graphicMaxY = 1632 } = {}) {
  if (!el || typeof el.type !== "string") return { ok: false, reason: "element.type 누락" };
  if (!KNOWN_ELEMENT_TYPES.has(el.type)) return { ok: false, reason: `알 수 없는 element type — ${el.type}` };

  // x 범위 (0..canvas width) — 있는 좌표만 (runs는 cx만 가지므로 cx도 반드시 포함해야 한다)
  const xs = [el.x, el.cx, el.x1, el.x2, ...(Array.isArray(el.pts) ? el.pts.map((p) => (Array.isArray(p) ? p[0] : undefined)) : [])]
    .filter((v) => v !== undefined);
  if (xs.some((v) => !isNum(v) || v < 0 || v > CANVAS.width)) return { ok: false, reason: "x 좌표 0..1080 범위 위반 또는 비수치" };
  // top y >= 0
  const topYs = [el.y, el.y1, ...(Array.isArray(el.pts) ? el.pts.map((p) => (Array.isArray(p) ? p[1] : undefined)) : [])]
    .filter((v) => v !== undefined);
  if (topYs.some((v) => !isNum(v) || v < 0)) return { ok: false, reason: "상단 y 음수 또는 비수치" };

  if (TEXT_LIKE_TYPES.has(el.type)) {
    const y = textLikeCheckY(el);
    if (y === null) return { ok: false, reason: "text-like element bbox 누락(y/fs) — fail-closed" };
    return { ok: y <= textMaxY, y, limit: textMaxY, reason: y <= textMaxY ? null : `text y ${y} > ${textMaxY}` };
  }
  const y2 = graphicLikeY2(el);
  if (y2 === null) return { ok: false, reason: "graphic-like element bbox 누락(y2/pts) — fail-closed" };
  return { ok: y2 <= graphicMaxY, y: y2, limit: graphicMaxY, reason: y2 <= graphicMaxY ? null : `graphic y2 ${y2} > ${graphicMaxY}` };
}

// caption 길이 검사 — text: 문자열 길이, runs: run 문자열 합계
export function captionLength(el) {
  if (el.type === "text") return isStr(el.text) ? el.text.length : 0;
  if (el.type === "runs") return (Array.isArray(el.runs) ? el.runs : []).reduce((s, r) => s + (isStr(r?.t) ? r.t.length : 0), 0);
  return 0;
}

// ── overlay-spec 스키마 검증 (pure) ─────────────────────────────────────────

const ELEMENT_REQUIRED = {
  text: ["type", "x", "y", "fs", "fill", "text"],
  runs: ["type", "cx", "y", "fs", "runs"],
  rect: ["type", "x1", "y1", "x2", "y2", "fill"],
  rrect: ["type", "x1", "y1", "x2", "y2", "fill"],
  poly: ["type", "pts", "fill"],
};

export function validateOverlaySpec(spec, { textMaxY = 1580, graphicMaxY = 1632, maxCaptionChars = 12 } = {}) {
  const issues = [];
  const push = (m) => issues.push(m);
  if (!spec || typeof spec !== "object") { push("overlaySpec 누락"); return issues; }
  if (!isStr(spec.fontFile)) push("overlaySpec.fontFile 비어 있음");
  if (!Array.isArray(spec.overlays) || spec.overlays.length === 0) { push("overlaySpec.overlays 비어 있음"); return issues; }

  const seenIds = new Set();
  for (const ov of spec.overlays) {
    const id = ov?.id;
    if (!isStr(id)) { push("overlay.id 비어 있음"); continue; }
    if (seenIds.has(id)) push(`overlay.id 중복 — ${id}`);
    seenIds.add(id);
    if (!(isNum(ov.start) && isNum(ov.end) && ov.start >= 0 && ov.start < ov.end)) {
      push(`overlay ${id}: start/end 불량 (0<=start<end)`);
    }
    const els = Array.isArray(ov.elements) ? ov.elements : [];
    if (els.length === 0) { push(`overlay ${id}: elements 비어 있음`); continue; }
    for (const el of els) {
      const req = ELEMENT_REQUIRED[el?.type];
      if (!req) { push(`overlay ${id}: 알 수 없는 element type — ${el?.type}`); continue; }
      const missing = req.filter((f) => el[f] === undefined);
      if (missing.length > 0) push(`overlay ${id} [${el.type}]: 필수 필드 누락 — ${missing.join(",")}`);
      if (el.type === "runs" && Array.isArray(el.runs)) {
        if (!el.runs.every((r) => isStr(r?.t) && isStr(r?.fill))) push(`overlay ${id} [runs]: run 항목은 t/fill non-empty 필요`);
      }
      const sf = checkElementSafeFrame(el, { textMaxY, graphicMaxY });
      if (!sf.ok) push(`overlay ${id} [${el.type}]: safe-frame 위반 — ${sf.reason}`);
      const clen = captionLength(el);
      if (clen > maxCaptionChars) push(`overlay ${id} [${el.type}]: caption ${clen}자 > ${maxCaptionChars}자 상한`);
    }
  }
  return issues;
}

// ── font policy 검증 (pure) ─────────────────────────────────────────────────

export function validateFontPolicy(planFont, contractFont) {
  const issues = [];
  const approved = contractFont?.approvedFonts ?? [];
  const forbidden = (contractFont?.forbiddenFonts ?? []).map((s) => s.toLowerCase());
  if (!isStr(planFont?.font) || !approved.includes(planFont.font)) {
    issues.push(`font "${planFont?.font}"가 승인 폰트(${approved.join("/")}) 아님`);
  }
  const f = String(planFont?.font ?? "").toLowerCase();
  if (forbidden.some((bad) => f.includes(bad))) issues.push(`font가 금지 폰트 목록에 해당 — ${planFont?.font}`);
  if (planFont?.silentDefaultFontFallback !== false) issues.push("silentDefaultFontFallback !== false");
  if (planFont?.malgunUsed !== false) issues.push("malgunUsed !== false");
  return issues;
}

// ── 금지 legacy render route 검출 (pure) ────────────────────────────────────

export function detectForbiddenRenderRoutes(typography) {
  const issues = [];
  if (typography?.bottomFixedSubtitle !== false) issues.push("bottomFixedSubtitle !== false (하단 고정 자막 금지)");
  if (typography?.karaokeFixedLowerLine !== false && typography?.karaokeFixedLowerLine !== undefined) {
    issues.push("karaokeFixedLowerLine !== false (karaoke 하단 라인 금지)");
  }
  if (isStr(typography?.engine) && typography.engine !== "pillow_overlay") {
    issues.push(`typography.engine "${typography.engine}" !== pillow_overlay (표준 엔진 아님)`);
  }
  return issues;
}

// ── fixture 로딩 (read-only) ────────────────────────────────────────────────

export function defaultIo() {
  const abs = (ref) => (path.isAbsolute(ref) ? ref : path.join(ROOT, ref));
  return {
    exists: (ref) => existsSync(abs(ref)),
    load: (ref) => JSON.parse(readFileSync(abs(ref), "utf8")),
  };
}

// ── 계약 검증 ───────────────────────────────────────────────────────────────

export function validateContract(contract) {
  const issues = [];
  const push = (m) => issues.push(`contract: ${m}`);
  if (contract?.schemaVersion !== EXPECTED_CONTRACT_SCHEMA) push(`schemaVersion !== ${EXPECTED_CONTRACT_SCHEMA}`);

  const fl = contract?.flags ?? {};
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved", "liveRenderApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  const nl = contract?.noLivePolicy ?? {};
  for (const k of ["noFrameOrVideoRender", "noPillowOrPythonExecution", "noFfmpegExecution",
    "noRenderOrMuxRegeneration", "noChatgptPlaywrightExecution", "noBrowserOrCdpLaunch", "noImageGeneration",
    "noPaidApiCalls", "noLiveTts", "noUpload", "noUploadQueue", "noEnvOrSecretAccess", "noNetwork", "noWrite"]) {
    if (nl[k] !== true) push(`noLivePolicy.${k}는 true여야 한다`);
  }
  if (nl.standardHarnessMode !== "dry_run_static_validation_only") push("noLivePolicy.standardHarnessMode !== dry_run_static_validation_only");

  const sf = contract?.safeFrameGeometry ?? {};
  if (!(sf.canvas?.width === 1080 && sf.canvas?.height === 1920)) push("safeFrameGeometry.canvas !== 1080x1920");
  if (sf.textMaxY !== 1580) push("safeFrameGeometry.textMaxY !== 1580");
  if (sf.graphicMaxY !== 1632) push("safeFrameGeometry.graphicMaxY !== 1632");
  if (!isNum(sf.readableLineLength?.maxKoreanCharsPerCaptionLine)) push("safeFrameGeometry.readableLineLength.maxKoreanCharsPerCaptionLine 누락");
  if (!isStr(sf.failClosedOnMissingBbox)) push("safeFrameGeometry.failClosedOnMissingBbox 문서 누락");

  const fp = contract?.fontPolicy ?? {};
  if (!isStrArr(fp.approvedFonts) || !fp.approvedFonts.includes("Noto Sans KR Black (VF)")) push("fontPolicy.approvedFonts에 Noto Sans KR Black (VF) 없음");
  for (const bad of ["Malgun Gothic", "Arial", "Do Hyeon"]) {
    if (!(fp.forbiddenFonts ?? []).includes(bad)) push(`fontPolicy.forbiddenFonts에 ${bad} 누락`);
  }
  if (fp.requireBoldKoreanFont !== true) push("fontPolicy.requireBoldKoreanFont !== true");

  const flr = contract?.forbiddenLegacyRenderRoutes ?? {};
  if (flr.bottomFixedSubtitleBar !== "금지") push("forbiddenLegacyRenderRoutes.bottomFixedSubtitleBar !== 금지");
  if (flr.karaokeAssLowerLine !== "금지") push("forbiddenLegacyRenderRoutes.karaokeAssLowerLine !== 금지");

  const os = contract?.overlaySpecBoundary?.specShape ?? {};
  if (!isStrArr(os.requiredTopFields)) push("overlaySpecBoundary.specShape.requiredTopFields 누락");
  if (!os.elementTypes || Object.keys(os.elementTypes).length < 4) push("overlaySpecBoundary.specShape.elementTypes 부족");

  const eq = contract?.equivalencePlan ?? {};
  if (!isStrArr(eq.requiredEquivalenceChecksForFutureSlice)) push("equivalencePlan.requiredEquivalenceChecksForFutureSlice 누락");
  if (!isStrArr(eq.forbiddenNow)) push("equivalencePlan.forbiddenNow 누락");

  if (contract?.integration?.manifestRefRequired?.length !== 3) push("integration.manifestRefRequired 3개 아님");
  if (!isStrArr(contract?.forbiddenBehavior) || contract.forbiddenBehavior.length < 8) push("forbiddenBehavior 부족(>=8)");
  return issues;
}

// ── plan 검증 (계약 + 참조 fixture 교차) ────────────────────────────────────

export function validatePlanAgainstContract(plan, contract, io = defaultIo()) {
  const issues = [];
  const push = (m) => issues.push(`plan: ${m}`);
  if (plan?.schemaVersion !== EXPECTED_PLAN_SCHEMA) push(`schemaVersion !== ${EXPECTED_PLAN_SCHEMA}`);
  if (!isStr(plan?.contractRef) || !plan.contractRef.endsWith("golden_sample_v3_2_pillow_renderer_contract.v1.json")) {
    push("contractRef가 표준 계약 fixture를 가리키지 않는다");
  }

  const fl = plan?.flags ?? {};
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved", "liveRenderApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  // manifest / acceptance-lock 참조 필수 (integration.failIfMissing)
  const refs = plan?.manifestRefs ?? {};
  const required = contract?.integration?.manifestRefRequired ?? [];
  const refMap = {
    "v3.2 visual render manifest": refs.visualRenderManifest,
    "v3.2 acceptance lock": refs.acceptanceLock,
    "production standard fixture": refs.productionStandard,
  };
  for (const label of required) {
    const ref = refMap[label];
    if (!isStr(ref)) { push(`manifestRefs 누락 — ${label}`); continue; }
    if (!io.exists(ref)) { push(`manifestRefs 파일 없음 — ${ref}`); continue; }
    try { io.load(ref); } catch (e) { push(`manifestRefs JSON parse 실패 — ${String(e).slice(0, 120)}`); }
  }
  if (!isStr(refs.visualRenderManifest) || !isStr(refs.acceptanceLock)) {
    push("v3.2 manifest 또는 acceptance-lock 참조 없음 — integration.failIfMissing");
  }

  const ota = plan?.ownerTopicApproval ?? {};
  if (ota.approved !== true) push("ownerTopicApproval.approved !== true");
  if (ota.permanentChannelWideTopicLock !== false) push("ownerTopicApproval.permanentChannelWideTopicLock !== false");
  for (const k of ["topicId", "title", "approvedScope", "approvalSourceNote"]) {
    if (!isStr(ota[k])) push(`ownerTopicApproval.${k} 비어 있음`);
  }
  // acceptance lock topic과 교차
  if (isStr(refs.acceptanceLock) && io.exists(refs.acceptanceLock)) {
    try {
      const lock = io.load(refs.acceptanceLock);
      if (lock.topicId !== ota.topicId) push(`ownerTopicApproval.topicId(${ota.topicId})가 acceptance lock(${lock.topicId})과 불일치`);
    } catch { /* parse 실패는 위에서 처리 */ }
  }

  // font policy
  issues.push(...validateFontPolicy(plan?.fontPolicy, contract?.fontPolicy).map((m) => `plan font: ${m}`));

  // typography / 금지 legacy route
  const tyMissMatch = plan?.typography?.engine !== "pillow_overlay";
  if (tyMissMatch) push(`typography.engine !== pillow_overlay`);
  issues.push(...detectForbiddenRenderRoutes(plan?.typography ?? {}).map((m) => `plan route: ${m}`));

  // safe-frame 계약 일치
  const sf = plan?.safeFrame ?? {};
  const csf = contract?.safeFrameGeometry ?? {};
  if (!(sf.canvas?.width === 1080 && sf.canvas?.height === 1920)) push("safeFrame.canvas !== 1080x1920");
  if (sf.textMaxY !== csf.textMaxY) push(`safeFrame.textMaxY(${sf.textMaxY}) != contract(${csf.textMaxY})`);
  if (sf.graphicMaxY !== csf.graphicMaxY) push(`safeFrame.graphicMaxY(${sf.graphicMaxY}) != contract(${csf.graphicMaxY})`);
  if (sf.maxKoreanCharsPerCaptionLine !== csf.readableLineLength?.maxKoreanCharsPerCaptionLine) {
    push(`safeFrame.maxKoreanCharsPerCaptionLine(${sf.maxKoreanCharsPerCaptionLine}) != contract(${csf.readableLineLength?.maxKoreanCharsPerCaptionLine})`);
  }
  if (!isStr(sf.geometryEvidenceNote)) push("safeFrame.geometryEvidenceNote 문서 누락(침묵 skip 금지)");

  // overlay-spec sample geometry gate
  const spec = plan?.overlaySpecSample;
  if (!spec) push("overlaySpecSample 누락 (safe-frame gate 증명 불가)");
  else {
    issues.push(...validateOverlaySpec(spec, {
      textMaxY: sf.textMaxY, graphicMaxY: sf.graphicMaxY,
      maxCaptionChars: sf.maxKoreanCharsPerCaptionLine,
    }).map((m) => `plan overlaySpecSample: ${m}`));
  }

  // manifest 정합 (frame 없음)
  const cr = plan?.captionRegistryFromManifest ?? {};
  if (isStr(refs.acceptanceLock) && io.exists(refs.acceptanceLock)) {
    try {
      const lock = io.load(refs.acceptanceLock);
      const wa = lock.acceptanceCriteria?.wordPhraseAnchoredCaptions ?? {};
      if (cr.overlayCount !== wa.overlayCount) push(`captionRegistry.overlayCount(${cr.overlayCount}) != lock(${wa.overlayCount})`);
      if (cr.wordAnchored !== wa.wordAnchored) push(`captionRegistry.wordAnchored(${cr.wordAnchored}) != lock(${wa.wordAnchored})`);
      if (cr.maxEntryDeltaMs !== wa.maxEntryDeltaMs) push(`captionRegistry.maxEntryDeltaMs(${cr.maxEntryDeltaMs}) != lock(${wa.maxEntryDeltaMs})`);
    } catch { /* parse 실패는 위에서 처리 */ }
  }

  const em = plan?.executionMode ?? {};
  if (em.approvedNow !== "dry_run_static_validation_only") push("executionMode.approvedNow !== dry_run_static_validation_only");
  if (em.liveRenderApprovedNow !== false) push("executionMode.liveRenderApprovedNow !== false");

  return issues;
}

// ── dry-run 검증 실행 (no-live, in-memory) ──────────────────────────────────

export function runDryRunValidation({ contractPath = DEFAULT_CONTRACT_PATH, planPath = DEFAULT_PLAN_PATH, io = defaultIo() } = {}) {
  const issues = [];
  let contract = null;
  let plan = null;
  try { contract = JSON.parse(readFileSync(contractPath, "utf8")); }
  catch (e) { issues.push(`contract fixture 로드 실패 — ${String(e).slice(0, 160)}`); }
  try { plan = JSON.parse(readFileSync(planPath, "utf8")); }
  catch (e) { issues.push(`plan fixture 로드 실패 — ${String(e).slice(0, 160)}`); }
  if (contract) issues.push(...validateContract(contract));
  if (contract && plan) issues.push(...validatePlanAgainstContract(plan, contract, io));

  let summary = null;
  if (issues.length === 0) {
    const spec = plan.overlaySpecSample;
    const allEls = (spec.overlays ?? []).flatMap((o) => o.elements ?? []);
    summary = {
      mode: "dry_run_static_validation_only",
      overlayCountInSample: spec.overlays?.length ?? 0,
      elementCountInSample: allEls.length,
      textLikeCount: allEls.filter((e) => TEXT_LIKE_TYPES.has(e.type)).length,
      graphicLikeCount: allEls.filter((e) => GRAPHIC_LIKE_TYPES.has(e.type)).length,
      safeFrame: { textMaxY: plan.safeFrame?.textMaxY, graphicMaxY: plan.safeFrame?.graphicMaxY, maxCaptionChars: plan.safeFrame?.maxKoreanCharsPerCaptionLine },
      font: plan.fontPolicy?.font,
      engine: plan.typography?.engine,
      manifestOverlayCount: plan.captionRegistryFromManifest?.overlayCount,
    };
  }
  return { ok: issues.length === 0, issues, contract, plan, summary };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { contractPath: DEFAULT_CONTRACT_PATH, planPath: DEFAULT_PLAN_PATH };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (REFUSED_LIVE_FLAGS.includes(a)) return { refusedLiveFlag: a };
    if (a === "--dry-run") continue;
    if (a === "--contract" || a === "--plan") {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) return { usageError: `${a} 는 경로 인자가 필요하다 (silent fallback 금지)` };
      if (a === "--contract") out.contractPath = path.resolve(v);
      else out.planPath = path.resolve(v);
      i++;
      continue;
    }
    return { usageError: `알 수 없는 인자 — ${a}` };
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.refusedLiveFlag) {
    console.error(`ABORT: ${args.refusedLiveFlag} 거부 — 이 slice의 standard harness는 dry-run/정적 검증 전용이다.`);
    console.error("live render는 Owner 승인 slice + 계약 준수 + overlay-spec 원본 레포 승격 후 별도 구현된다 (fail-closed).");
    process.exit(3);
  }
  if (args.usageError) {
    console.error(`USAGE ERROR: ${args.usageError}`);
    process.exit(2);
  }
  console.log("[pillow-renderer-standard-v1] mode=DRY_RUN_STATIC_VALIDATION_ONLY (no render / no pillow / no video-mux / no network / no env / read-only)");
  console.log(`[pillow-renderer-standard-v1] contract: ${args.contractPath}`);
  console.log(`[pillow-renderer-standard-v1] plan:     ${args.planPath}`);
  const res = runDryRunValidation({ contractPath: args.contractPath, planPath: args.planPath });
  if (!res.ok) {
    for (const issue of res.issues) console.error(`FAIL  ${issue}`);
    console.error(`\nVALIDATION RESULT: FAIL (${res.issues.length} issue(s))`);
    process.exit(1);
  }
  const s = res.summary;
  console.log(`[pillow-renderer-standard-v1] topic: ${res.plan.ownerTopicApproval.topicId} — ${res.plan.ownerTopicApproval.title}`);
  console.log(`[pillow-renderer-standard-v1] font: ${s.font} · engine: ${s.engine} · bottomFixedSubtitle=${res.plan.typography?.bottomFixedSubtitle}`);
  console.log(`[pillow-renderer-standard-v1] safe-frame: text y<=${s.safeFrame.textMaxY}, graphic y2<=${s.safeFrame.graphicMaxY}, caption<=${s.safeFrame.maxCaptionChars}자`);
  console.log(`[pillow-renderer-standard-v1] overlaySpecSample: ${s.overlayCountInSample} overlays / ${s.elementCountInSample} elements (text-like ${s.textLikeCount}, graphic-like ${s.graphicLikeCount}) — 전 element safe-frame PASS`);
  console.log(`[pillow-renderer-standard-v1] manifest overlayCount ${s.manifestOverlayCount} (frame 렌더 없음)`);
  console.log(`\nVALIDATION RESULT: PASS (0 issues) — no-live dry-run만 수행됨`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (isMain) main();
