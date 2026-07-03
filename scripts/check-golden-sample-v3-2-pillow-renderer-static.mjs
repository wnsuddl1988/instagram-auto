#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-pillow-renderer-static.mjs
 *
 * Golden Sample v3.2 Slice 3 — Pillow renderer 계약/plan/harness 정적 가드.
 * task: golden-sample-v3-2-pillow-renderer-productionization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-write:
 *   레포 내 fixture JSON과 스크립트 소스를 읽어 검증만 한다.
 * - 검증 대상:
 *   1) renderer contract ↔ production standard v1 정합 (safe-frame/typography 드리프트 방지)
 *   2) sample plan — v3.2 manifest/acceptance-lock 참조 필수, font/typography/safe-frame 교차
 *   3) safe-frame geometry gate 동작 (v3.1 verbatim overlay element + fail-closed mutant)
 *   4) harness 소스 — 금지 render/pillow/video-mux/env/network/write 패턴 + import allowlist
 *   5) harness 동작 — import해 dry-run PASS + fail-closed mutant + pure helper 검증
 * - 전부 통과 시 exit 0 + PASS 카운트 출력, 위반 시 exit 1.
 * - 음성 테스트용: --plan <path> 로 plan 경로 대체 가능 (값 없으면 exit 2).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const CONTRACT_PATH = FX("golden_sample_v3_2_pillow_renderer_contract.v1.json");
const DEFAULT_PLAN_PATH = FX("golden_sample_v3_2_pillow_renderer_sample_plan.t1_lifestyle_inflation.v1.json");
const STANDARD_PATH = FX("golden_sample_v3_2_production_standard.v1.json");
const ACCEPTANCE_LOCK_PATH = FX("golden_sample_v3_2_acceptance_lock.t1_lifestyle_inflation.json");
const MANIFEST_PATH = FX("golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json");
const HARNESS_PATH = path.join(ROOT, "scripts", "run-golden-sample-pillow-renderer-standard-v1.mjs");

const argv = process.argv.slice(2);
const planArgIdx = argv.indexOf("--plan");
if (planArgIdx !== -1 && (!argv[planArgIdx + 1] || argv[planArgIdx + 1].startsWith("--"))) {
  console.error("ERROR  --plan requires a path argument (silent fallback to default plan is forbidden)");
  process.exit(2);
}
const PLAN_PATH = planArgIdx !== -1 ? path.resolve(argv[planArgIdx + 1]) : DEFAULT_PLAN_PATH;

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");
const clone = (o) => JSON.parse(JSON.stringify(o));

function loadJson(label, p) {
  try {
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    check(`${label} parses as JSON`, true);
    return { raw, parsed };
  } catch (e) {
    check(`${label} parses as JSON`, false, String(e).slice(0, 160));
    return { raw: null, parsed: null };
  }
}

const contractF = loadJson("renderer contract fixture", CONTRACT_PATH);
const planF = loadJson(`sample plan fixture (${path.basename(PLAN_PATH)})`, PLAN_PATH);
const standardF = loadJson("production standard v1 fixture", STANDARD_PATH);
const lockF = loadJson("v3.2 acceptance lock", ACCEPTANCE_LOCK_PATH);
const manifestF = loadJson("v3.2 tts-anchored render manifest", MANIFEST_PATH);

if (!contractF.parsed || !planF.parsed || !standardF.parsed || !lockF.parsed || !manifestF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const contract = contractF.parsed;
const plan = planF.parsed;
const standard = standardF.parsed;
const lock = lockF.parsed;
const manifest = manifestF.parsed;

// ── 1. 계약 ↔ production standard 정합 (드리프트 방지) ──────────────────────
{
  const stdSf = standard.typographyCaptionStandard?.safeFrame ?? {};
  const csf = contract.safeFrameGeometry ?? {};
  check("contract safeFrame textMaxY/graphicMaxY match standard (1580/1632)",
    csf.textMaxY === stdSf.textMaxY && csf.textMaxY === 1580 &&
    csf.graphicMaxY === stdSf.graphicMaxY && csf.graphicMaxY === 1632,
    `contract=${csf.textMaxY}/${csf.graphicMaxY} standard=${stdSf.textMaxY}/${stdSf.graphicMaxY}`);
  check("contract canvas matches standard (1080x1920)",
    csf.canvas?.width === 1080 && csf.canvas?.height === 1920 && String(stdSf.canvas) === "1080x1920");
  check("contract forbids bottom-fixed subtitle + karaoke (matches standard)",
    contract.typographyCaptionRules?.bottomFixedSubtitleBar === false &&
    contract.typographyCaptionRules?.karaokeFixedLowerLine === false &&
    standard.typographyCaptionStandard?.bottomFixedSubtitleBar === false &&
    standard.typographyCaptionStandard?.karaokeFixedLowerLine === false);
  check("contract font policy matches standard (Noto Sans KR Black, Malgun forbidden)",
    (contract.fontPolicy?.approvedFonts ?? []).some((f) => f.includes("Noto Sans KR Black")) &&
    isStr(standard.typographyCaptionStandard?.font) && standard.typographyCaptionStandard.font.includes("Noto Sans KR Black") &&
    (contract.fontPolicy?.forbiddenFonts ?? []).includes("Malgun Gothic") &&
    isStr(standard.typographyCaptionStandard?.forbiddenLook) && standard.typographyCaptionStandard.forbiddenLook.includes("Malgun"));
  check("contract renderer=Pillow (동등성 검증 전 대체 금지, standard와 동일)",
    isStr(contract.typographyCaptionRules?.renderer) && contract.typographyCaptionRules.renderer.includes("Pillow") &&
    isStr(standard.typographyCaptionStandard?.renderer) && standard.typographyCaptionStandard.renderer.includes("Pillow"));
  check("contract equivalence muxMd5 matches acceptance lock",
    contract.equivalencePlan?.lockReference?.muxMd5 === lock.lockedArtifacts?.muxMd5 &&
    contract.equivalencePlan?.lockReference?.muxMd5 === "9f5ad22c02cb4f4f813a1ed16fd658b0");
  check("contract equivalence ffprobe matches acceptance lock (1080x1920, 53.966667s)",
    contract.equivalencePlan?.lockReference?.expectedFfprobe?.width === lock.expectedFfprobe?.width &&
    contract.equivalencePlan?.lockReference?.expectedFfprobe?.height === lock.expectedFfprobe?.height &&
    contract.equivalencePlan?.lockReference?.expectedFfprobe?.videoDurationSec === lock.expectedFfprobe?.videoDurationSec);
}

// ── 2. 계약 핵심 의미 고정 (no-live / overlay 경계 / 금지 route / 폰트) ──────
{
  const fl = contract.flags ?? {};
  check("contract flags: uploadReady/automationExpansionReady/implementationApproved/liveRenderApproved 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false &&
    fl.implementationApproved === false && fl.liveRenderApproved === false);
  const nl = contract.noLivePolicy ?? {};
  const nlKeys = ["noFrameOrVideoRender", "noPillowOrPythonExecution", "noFfmpegExecution", "noRenderOrMuxRegeneration",
    "noChatgptPlaywrightExecution", "noBrowserOrCdpLaunch", "noImageGeneration", "noPaidApiCalls", "noLiveTts",
    "noUpload", "noUploadQueue", "noEnvOrSecretAccess", "noNetwork", "noWrite"];
  check("contract noLivePolicy 14개 항목 전부 true + dry_run_static_validation_only",
    nlKeys.every((k) => nl[k] === true) && nl.standardHarnessMode === "dry_run_static_validation_only",
    `false=${nlKeys.filter((k) => nl[k] !== true).join(",")}`);
  check("contract harnessImportRule restricts to node:fs/path/url (read-only)",
    isStr(nl.harnessImportRule) && nl.harnessImportRule.includes("node:fs") && nl.harnessImportRule.includes("node:url"));

  const os = contract.overlaySpecBoundary?.specShape ?? {};
  check("contract overlay-spec boundary: requiredTopFields + 5 element types (text/runs/rect/rrect/poly)",
    setEq(os.requiredTopFields, ["fontFile", "variation", "overlays"]) &&
    ["text", "runs", "rect", "rrect", "poly"].every((t) => os.elementTypes?.[t]));
  check("contract element classification: textLike(text/runs) vs graphicLike(rect/rrect/poly)",
    setEq(os.elementClassification?.textLike, ["text", "runs"]) &&
    setEq(os.elementClassification?.graphicLike, ["rect", "rrect", "poly"]));

  const fp = contract.fontPolicy ?? {};
  check("contract font: requireBoldKoreanFont + silent fallback forbidden + vendoring unresolved(#6)",
    fp.requireBoldKoreanFont === true && isStr(fp.silentDefaultFontFallback) &&
    fp.fontVendoringDecision?.status === "unresolved_owner_decision_6");
  check("contract forbiddenFonts include Malgun/Arial/BlackHanSans/DoHyeon",
    ["Malgun Gothic", "Arial", "BlackHanSans", "DoHyeon"].every((f) => (fp.forbiddenFonts ?? []).includes(f)));

  const flr = contract.forbiddenLegacyRenderRoutes ?? {};
  const forbidden = (v) => isStr(v) && v.startsWith("금지");
  check("contract forbids legacy render routes (bottom bar / karaoke ASS / drawtext / char-weight / silent font / fixed 30s)",
    forbidden(flr.bottomFixedSubtitleBar) && forbidden(flr.karaokeAssLowerLine) && forbidden(flr.assDrawtextLowerBar) &&
    forbidden(flr.renderV2PyCharWeightSceneSync) && forbidden(flr.silentFallbackFonts) && forbidden(flr.fixed30sAssumption));

  const sf = contract.safeFrameGeometry ?? {};
  check("contract safe-frame: fail-closed on missing bbox + readable line length + limitation 문서화",
    isStr(sf.failClosedOnMissingBbox) && isStr(sf.readableLineLength?.note) && isStr(sf.limitation));
  check("contract readable line length = 12 (v3.1 renderer capLenGuard verbatim)",
    sf.readableLineLength?.maxKoreanCharsPerCaptionLine === 12);

  const eq = contract.equivalencePlan ?? {};
  check("contract equivalence: future checks defined + frame render forbidden now",
    isStrArr(eq.requiredEquivalenceChecksForFutureSlice) && eq.requiredEquivalenceChecksForFutureSlice.length >= 4 &&
    isStrArr(eq.forbiddenNow) && eq.forbiddenNow.some((s) => s.includes("frame")));
  check("contract integration mandates v3.2 manifest + acceptance-lock refs",
    setEq(contract.integration?.manifestRefRequired,
      ["v3.2 visual render manifest", "v3.2 acceptance lock", "production standard fixture"]) &&
    isStr(contract.integration?.failIfMissing));
  check("contract forbiddenBehavior non-empty (>=8, inline PY 클론 금지 포함)",
    isStrArr(contract.forbiddenBehavior) && contract.forbiddenBehavior.length >= 8 &&
    contract.forbiddenBehavior.some((s) => s.includes("클론")));
  check("contract verifiedRendererLineage exists in repo",
    Array.isArray(contract.basedOn?.verifiedRendererLineage) &&
    contract.basedOn.verifiedRendererLineage.length === 3 &&
    contract.basedOn.verifiedRendererLineage.every((p) => existsSync(path.join(ROOT, p))));
}

// ── 3. sample plan 검증 (manifest 참조 / font / safe-frame / overlay geometry) ──
{
  check("plan references the renderer contract fixture",
    isStr(plan.contractRef) && plan.contractRef.endsWith("golden_sample_v3_2_pillow_renderer_contract.v1.json"));
  const fl = plan.flags ?? {};
  check("plan flags: uploadReady/automationExpansionReady/implementationApproved/liveRenderApproved 전부 false",
    fl.uploadReady === false && fl.automationExpansionReady === false &&
    fl.implementationApproved === false && fl.liveRenderApproved === false);

  const refs = plan.manifestRefs ?? {};
  check("plan references v3.2 visual render manifest + acceptance lock + production standard (파일 존재)",
    isStr(refs.visualRenderManifest) && refs.visualRenderManifest.endsWith(path.basename(MANIFEST_PATH)) &&
    isStr(refs.acceptanceLock) && refs.acceptanceLock.endsWith(path.basename(ACCEPTANCE_LOCK_PATH)) &&
    isStr(refs.productionStandard) && refs.productionStandard.endsWith(path.basename(STANDARD_PATH)) &&
    existsSync(path.join(ROOT, refs.visualRenderManifest)) && existsSync(path.join(ROOT, refs.acceptanceLock)));

  const ota = plan.ownerTopicApproval ?? {};
  check("plan ownerTopicApproval approved=true + permanentChannelWideTopicLock=false + topic matches lock",
    ota.approved === true && ota.permanentChannelWideTopicLock === false &&
    ota.topicId === lock.topicId && ota.title === lock.topic,
    `plan=${ota.topicId}/${ota.title} lock=${lock.topicId}/${lock.topic}`);

  const fp = plan.fontPolicy ?? {};
  check("plan font: Noto Sans KR Black VF + no silent fallback + no Malgun",
    fp.font === "Noto Sans KR Black (VF)" && fp.silentDefaultFontFallback === false && fp.malgunUsed === false);

  const ty = plan.typography ?? {};
  check("plan typography: engine=pillow_overlay + bottomFixedSubtitle=false + karaoke=false",
    ty.engine === "pillow_overlay" && ty.bottomFixedSubtitle === false && ty.karaokeFixedLowerLine === false);

  const sf = plan.safeFrame ?? {};
  check("plan safeFrame matches contract (1080x1920, 1580/1632, caption 12자)",
    sf.canvas?.width === 1080 && sf.canvas?.height === 1920 &&
    sf.textMaxY === contract.safeFrameGeometry?.textMaxY && sf.graphicMaxY === contract.safeFrameGeometry?.graphicMaxY &&
    sf.maxKoreanCharsPerCaptionLine === contract.safeFrameGeometry?.readableLineLength?.maxKoreanCharsPerCaptionLine);
  check("plan safeFrame documents geometry evidence limitation (침묵 skip 금지)",
    isStr(sf.geometryEvidenceNote) && sf.geometryEvidenceNote.includes("C:\\tmp"));

  const spec = plan.overlaySpecSample ?? {};
  check("plan overlaySpecSample present with fontFile + overlays (safe-frame gate 증명)",
    isStr(spec.fontFile) && Array.isArray(spec.overlays) && spec.overlays.length > 0);
  // 대표 sample이 모든 element type을 커버하는지
  const allEls = (spec.overlays ?? []).flatMap((o) => o.elements ?? []);
  const typesCovered = new Set(allEls.map((e) => e.type));
  check("plan overlaySpecSample covers all 5 element types (text/runs/rect/rrect/poly)",
    ["text", "runs", "rect", "rrect", "poly"].every((t) => typesCovered.has(t)),
    `covered=${[...typesCovered].join(",")}`);

  const cr = plan.captionRegistryFromManifest ?? {};
  const wa = lock.acceptanceCriteria?.wordPhraseAnchoredCaptions ?? {};
  check("plan captionRegistry matches acceptance lock (overlayCount 29, wordAnchored 27, maxEntryDeltaMs 50)",
    cr.overlayCount === wa.overlayCount && cr.overlayCount === 29 &&
    cr.wordAnchored === wa.wordAnchored && cr.wordAnchored === 27 &&
    cr.maxEntryDeltaMs === wa.maxEntryDeltaMs && cr.maxEntryDeltaMs === 50);
  check("plan captionRegistry overlayCount matches manifest overlays length (29)",
    cr.overlayCount === (manifest.overlays?.length ?? -1));

  check("plan executionMode: dry_run_static_validation_only + liveRenderApprovedNow=false",
    plan.executionMode?.approvedNow === "dry_run_static_validation_only" &&
    plan.executionMode?.liveRenderApprovedNow === false);
}

// ── 4. harness 소스 정적 스캔 (render/pillow/video-mux/env/network/write 차단) ──
// NOTE(HANDOFF 예외 보고): 이 스캐너는 금지 토큰을 분할-연결(split-concatenated) 형태로만
// 보유하므로 스캐너 소스 자체에는 금지 문자열이 literal로 존재하지 않는다.
const harnessSrc = readFileSync(HARNESS_PATH, "utf8");
{
  const J = (a, b) => a + b;
  // literal substring 토큰 — 실행 형태에서만 나타나는 것
  const renderTokens = [
    J("child_", "process"),
    J("spawn", "("),
    J("exec", "("),
    J("execFile", "("),
    J("Image", "Draw"),
    J("ff", "mpeg"),
    J("process", ".env"),
    J("fetch", "("),
    J("chromium", ".launch"),
    J("page", ".goto"),
    J("browser", ".newPage"),
  ];
  // 단어-경계 토큰 — "Pillow"/"PILLOW" 같은 정당한 단어의 부분일치를 피하기 위해 \b 사용
  // (HANDOFF denylist의 PY 런타임 명령 / PY 이미지 라이브러리 import를 겨냥하되 Pillow 렌더러 이름은 오탐하지 않는다)
  const renderWordRegexes = [new RegExp(J("\\bpy", "thon\\b"), "i"), new RegExp(J("\\bPI", "L\\b"))];
  const writeTokens = [
    J("write", "File"),
    J("append", "File"),
    J("mk", "dir"),
    J("rm", "Sync"),
    J("un", "link"),
    J("re", "name("),
    J("createWrite", "Stream"),
  ];
  const flagTrue = (name) => new RegExp(J(name, "[\"']?\\s*[:=]\\s*true"), "i");
  const flagRegexes = ["uploadReady", "automationExpansionReady", "implementationApproved", "liveRenderApproved"].map(flagTrue);

  const scan = (label, src) => {
    const rHit = renderTokens.find((t) => src.includes(t));
    const rwHit = renderWordRegexes.find((r) => r.test(src));
    const wHit = writeTokens.find((t) => src.includes(t));
    const fHit = flagRegexes.find((r) => r.test(src));
    check(`no forbidden render/write pattern in ${label}`, !rHit && !rwHit && !wHit && !fHit,
      rHit ? `render=${rHit}` : rwHit ? `word=${String(rwHit)}` : wHit ? `write=${wHit}` : fHit ? `regex=${String(fHit)}` : "");
  };
  scan("renderer contract fixture", contractF.raw);
  scan("sample plan fixture", planF.raw);
  scan("standard harness source", harnessSrc);
  scan("guard script (self)", readFileSync(SELF, "utf8"));

  // harness 전용 추가: dynamic import / subprocess / network 표면 금지
  const liveSurfaceTokens = [
    J("connectOver", "CDP"),
    J("node:", "http"),
    J("Web", "Socket"),
    J("require", "("),
    J("import", "("),
  ];
  const liveHit = liveSurfaceTokens.find((t) => harnessSrc.includes(t));
  check("harness source has no subprocess/network/dynamic-import surface", !liveHit, `token=${liveHit}`);

  // import allowlist: node:fs / node:path / node:url 만 허용 (계약 harnessImportRule)
  const specifiers = [...harnessSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  const badImports = specifiers.filter((s) => !allow.has(s));
  check("harness imports restricted to node:fs/node:path/node:url", specifiers.length > 0 && badImports.length === 0,
    `bad=${badImports.join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 5. harness 동작 검증 (import + in-memory, no-live) ───────────────────────
const harness = await import(pathToFileURL(HARNESS_PATH).href);
{
  const fns = ["textLikeCheckY", "graphicLikeY2", "checkElementSafeFrame", "captionLength", "validateOverlaySpec",
    "validateFontPolicy", "detectForbiddenRenderRoutes", "validateContract", "validatePlanAgainstContract",
    "runDryRunValidation", "defaultIo"];
  check("harness exports all reusable logic surfaces", fns.every((f) => typeof harness[f] === "function"),
    `missing=${fns.filter((f) => typeof harness[f] !== "function").join(",")}`);
  check("harness refuses live/render-mode flags (fail-closed list)",
    Array.isArray(harness.REFUSED_LIVE_FLAGS) &&
    ["--live", "--render", "--pillow", "--mux"].every((f) => harness.REFUSED_LIVE_FLAGS.includes(f)));
  check("harness default fixture paths point at standard contract/plan",
    String(harness.DEFAULT_CONTRACT_PATH).endsWith(path.basename(CONTRACT_PATH)) &&
    String(harness.DEFAULT_PLAN_PATH).endsWith(path.basename(DEFAULT_PLAN_PATH)));

  const dry = harness.runDryRunValidation({ contractPath: CONTRACT_PATH, planPath: PLAN_PATH });
  check("harness dry-run validation PASS on contract + sample plan (0 issues)",
    dry.ok === true && dry.issues.length === 0, dry.issues.slice(0, 3).join(" | "));
  check("harness dry-run summary: overlays/elements counted + all safe-frame PASS",
    dry.summary && dry.summary.overlayCountInSample >= 5 && dry.summary.elementCountInSample >= 8 &&
    dry.summary.textLikeCount > 0 && dry.summary.graphicLikeCount > 0);

  // ── safe-frame geometry gate 직접 검증 (pure) ──
  // text-like: anchor 'mm' → y 기준
  const okText = harness.checkElementSafeFrame({ type: "text", x: 540, y: 1560, fs: 62, fill: "#fff", anchor: "mm", text: "x" });
  const badText = harness.checkElementSafeFrame({ type: "text", x: 540, y: 1600, fs: 62, fill: "#fff", anchor: "mm", text: "x" });
  const boundaryText = harness.checkElementSafeFrame({ type: "text", x: 540, y: 1580, fs: 62, fill: "#fff", anchor: "mm", text: "x" });
  check("safe-frame text: y=1560 PASS, y=1600 FAIL, y=1580 경계 PASS",
    okText.ok === true && badText.ok === false && boundaryText.ok === true);
  // text anchor 상단 't' → y + fs 기준
  const topAnchor = harness.checkElementSafeFrame({ type: "text", x: 540, y: 1560, fs: 62, fill: "#fff", anchor: "ta", text: "x" });
  check("safe-frame text anchor 'ta': y=1560+fs62=1622 > 1580 FAIL (상단 앵커는 아래로 확장)",
    topAnchor.ok === false && topAnchor.y === 1622);
  // graphic: y2 기준
  const okRect = harness.checkElementSafeFrame({ type: "rrect", x1: 250, y1: 1496, x2: 830, y2: 1632, fill: "#00f" });
  const badRect = harness.checkElementSafeFrame({ type: "rect", x1: 100, y1: 1600, x2: 900, y2: 1700, fill: "#f00" });
  check("safe-frame graphic: y2=1632 경계 PASS, y2=1700 FAIL",
    okRect.ok === true && badRect.ok === false);
  // poly: max y 기준
  const okPoly = harness.checkElementSafeFrame({ type: "poly", pts: [[820, 1272], [864, 1272], [842, 1220]], fill: "#f00" });
  const badPoly = harness.checkElementSafeFrame({ type: "poly", pts: [[820, 1650], [864, 1650], [842, 1600]], fill: "#f00" });
  check("safe-frame poly: max-y 1272 PASS, max-y 1650 FAIL",
    okPoly.ok === true && badPoly.ok === false);
  // fail-closed: bbox 누락
  const missingText = harness.checkElementSafeFrame({ type: "text", x: 540, fill: "#fff", text: "x" });
  const missingRect = harness.checkElementSafeFrame({ type: "rect", x1: 100, y1: 100, x2: 900, fill: "#f00" });
  check("safe-frame fail-closed: text y/fs 누락 → FAIL, rect y2 누락 → FAIL (침묵 skip 아님)",
    missingText.ok === false && isStr(missingText.reason) && missingRect.ok === false);
  // x 범위 위반
  const badX = harness.checkElementSafeFrame({ type: "text", x: 1200, y: 500, fs: 60, fill: "#fff", text: "x" });
  check("safe-frame x range: x=1200 > 1080 canvas width → FAIL", badX.ok === false);
  // Codex review-fix: runs element는 x가 아니라 cx로 중심 x좌표를 가진다 — cx 범위 위반도 반드시 검출되어야 한다
  const badRunsCx = harness.checkElementSafeFrame({ type: "runs", cx: 1200, y: 300, fs: 60, runs: [{ t: "x", fill: "#fff" }] });
  const okRunsCx = harness.checkElementSafeFrame({ type: "runs", cx: 540, y: 300, fs: 60, runs: [{ t: "x", fill: "#fff" }] });
  check("safe-frame runs.cx range: cx=1200 > 1080 canvas width → FAIL (review-fix regression)",
    badRunsCx.ok === false && badRunsCx.reason === "x 좌표 0..1080 범위 위반 또는 비수치");
  check("safe-frame runs.cx range: cx=540 in-bounds → PASS (no false positive)", okRunsCx.ok === true);
  // unknown type
  const unknown = harness.checkElementSafeFrame({ type: "circle", x: 100, y: 100 });
  check("safe-frame unknown element type → FAIL", unknown.ok === false);

  // caption length
  check("captionLength: text 문자열 길이(공백 포함), runs run 합계",
    harness.captionLength({ type: "text", text: "느낌이 아니라 사실" }) === 10 &&
    harness.captionLength({ type: "runs", runs: [{ t: "월말 잔액은 " }, { t: "제자리" }] }) === 10);

  // ── validateOverlaySpec: caption 12자 초과 + safe-frame 위반 검출 ──
  const overCaption = harness.validateOverlaySpec({
    fontFile: "x.ttf",
    overlays: [{ id: "o1", start: 0, end: 1, elements: [{ type: "text", x: 540, y: 300, fs: 60, fill: "#fff", text: "열세글자가넘는긴자막입니다요" }] }],
  }, { maxCaptionChars: 12 });
  check("validateOverlaySpec: 13자+ caption → issue 검출", overCaption.some((i) => i.includes("caption")));
  const overSafe = harness.validateOverlaySpec({
    fontFile: "x.ttf",
    overlays: [{ id: "o1", start: 0, end: 1, elements: [{ type: "rect", x1: 100, y1: 1600, x2: 900, y2: 1700, fill: "#f00" }] }],
  });
  check("validateOverlaySpec: y2=1700 graphic → safe-frame issue 검출", overSafe.some((i) => i.includes("safe-frame")));

  // ── font policy ──
  const malgun = harness.validateFontPolicy({ font: "Malgun Gothic", silentDefaultFontFallback: false, malgunUsed: false }, contract.fontPolicy);
  check("validateFontPolicy: Malgun Gothic → issue (승인 폰트 아님 + 금지 목록)", malgun.length > 0);
  const silentFb = harness.validateFontPolicy({ font: "Noto Sans KR Black (VF)", silentDefaultFontFallback: true, malgunUsed: false }, contract.fontPolicy);
  check("validateFontPolicy: silent fallback true → issue", silentFb.some((i) => i.includes("silentDefaultFontFallback")));

  // ── forbidden render routes ──
  const bottomBar = harness.detectForbiddenRenderRoutes({ engine: "pillow_overlay", bottomFixedSubtitle: true });
  check("detectForbiddenRenderRoutes: bottomFixedSubtitle true → issue", bottomBar.some((i) => i.includes("bottomFixedSubtitle")));
  const assEngine = harness.detectForbiddenRenderRoutes({ engine: "ass_karaoke", bottomFixedSubtitle: false });
  check("detectForbiddenRenderRoutes: engine ass_karaoke → issue (pillow_overlay 아님)", assEngine.some((i) => i.includes("engine")));

  // ── fail-closed plan mutants (in-memory only) ──
  const io = harness.defaultIo();
  const mutate = (fn) => { const m = clone(plan); fn(m); return harness.validatePlanAgainstContract(m, contract, io); };
  const m1 = mutate((m) => { delete m.manifestRefs.acceptanceLock; });
  check("mutant: acceptance-lock 참조 제거 → plan validation fail (integration.failIfMissing)",
    m1.some((i) => i.includes("acceptance") || i.includes("manifestRefs")));
  const m2 = mutate((m) => { m.fontPolicy.font = "Malgun Gothic"; });
  check("mutant: font Malgun Gothic → fail", m2.some((i) => i.toLowerCase().includes("font")));
  const m3 = mutate((m) => { m.typography.bottomFixedSubtitle = true; });
  check("mutant: bottomFixedSubtitle true → fail", m3.some((i) => i.includes("bottomFixedSubtitle")));
  const m4 = mutate((m) => { m.overlaySpecSample.overlays[2].elements[0].y = 1650; });
  check("mutant: overlay text y=1650 (>1580) → safe-frame fail", m4.some((i) => i.includes("safe-frame")));
  const m5 = mutate((m) => { m.safeFrame.textMaxY = 1700; });
  check("mutant: safeFrame textMaxY 1700 (계약 불일치) → fail", m5.some((i) => i.includes("textMaxY")));
  const m6 = mutate((m) => { m.captionRegistryFromManifest.overlayCount = 99; });
  check("mutant: captionRegistry overlayCount 99 → fail (lock/manifest 불일치)", m6.some((i) => i.includes("overlayCount")));
  const m7 = mutate((m) => { m.executionMode.liveRenderApprovedNow = true; });
  check("mutant: liveRenderApprovedNow true → fail", m7.some((i) => i.includes("liveRenderApprovedNow")));

  // contract mutants
  const cMut1 = clone(contract); cMut1.safeFrameGeometry.textMaxY = 1700;
  check("mutant: contract textMaxY 1700 (standard 불일치) → contract validation fail",
    harness.validateContract(cMut1).some((i) => i.includes("textMaxY")));
  const cMut2 = clone(contract); cMut2.forbiddenLegacyRenderRoutes.bottomFixedSubtitleBar = "허용";
  check("mutant: contract bottomFixedSubtitleBar 허용 → fail",
    harness.validateContract(cMut2).some((i) => i.includes("bottomFixedSubtitleBar")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks) — plan=${PLAN_PATH}`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — plan=${PLAN_PATH}`);
process.exit(failures === 0 ? 0 : 1);
