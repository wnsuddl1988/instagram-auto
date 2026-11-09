#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-owner-decision-packet-static.mjs
 *
 * Golden Sample v3.2 Slice 6 — Owner decision resolution packet 정적 가드.
 * task: golden-sample-v3-2-owner-decision-resolution-packet-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-mux /
 *   no-audio·video·image-read / no-write: 레포 내 fixture JSON / markdown / 스크립트 소스만 읽어 검증.
 * - 검증 대상:
 *   1) packet fixture ↔ Slice 5 integrated readiness contract 10개 decision key coverage 정확 일치
 *   2) 모든 decision status = PENDING (RESOLVED/APPROVED/PASS 등 금지)
 *   3) readiness flag 11종 false + prohibitedEscalation flag 승격 없음
 *   4) owner_viewing_listening_qa 자동 PASS 불가 명시
 *   5) 각 decision 필수 필드(source/blocks/recommendedDefault/allowedChoices/decideNow/
 *      minimumEvidenceBeforeDecision/safeApprovalSnippet/nonApprovalWarning) 존재
 *   6) markdown packet이 같은 10개 key 참조 + "live 실행 승인이 아니다" wording 포함 +
 *      live approval 오해 wording 부재
 *   7) in-memory mutant — missing decision, status mutation, readiness escalation,
 *      Owner QA auto-pass 전부 fail-closed 확인
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const PACKET_PATH = FX("golden_sample_v3_2_owner_decision_resolution_packet.v1.json");
const CONTRACT_PATH = FX("golden_sample_v3_2_integrated_production_readiness_contract.v1.json");
const MD_PATH = path.join(ROOT, "_ai", "GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.every(isStr);
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

const REQUIRED_KEYS = [
  "script_impact_gate_score_authority",
  "legacy_line_scope",
  "upload_endpoint_disposition",
  "blueprint_schema_unification",
  "md5_locked_image_durability",
  "font_vendoring",
  "contract_duality_resolution",
  "image_script_allow_guard",
  "poll_25s_passive_window",
  "owner_viewing_listening_qa",
];
const FORBIDDEN_STATUS = ["RESOLVED", "APPROVED", "PASS", "DONE", "COMPLETE", "OWNER_APPROVED"];
const PROHIBITED_FLAGS = ["uploadReady", "automationExpansionReady", "implementationApproved",
  "liveTtsApproved", "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved",
  "chatgptPlaywrightApproved", "ownerQaPassed", "productionReady"];

const packetF = loadJson("owner decision packet fixture", PACKET_PATH);
const contractF = loadJson("Slice 5 integrated readiness contract", CONTRACT_PATH);

let md = null;
try { md = readFileSync(MD_PATH, "utf8"); check("markdown packet readable", true); }
catch (e) { check("markdown packet readable", false, String(e).slice(0, 120)); }

if (!packetF.parsed || !contractF.parsed || md === null) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

const packet = packetF.parsed;
const contract = contractF.parsed;

// ── 0. 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────
function validateDecisionStatuses(decisions) {
  const issues = [];
  if (!Array.isArray(decisions)) { issues.push("decisions 배열 없음"); return issues; }
  for (const d of decisions) {
    if (d.status !== "PENDING") issues.push(`decision ${d.key ?? "?"} status=${d.status} (PENDING 아님)`);
    if (isStr(d.status) && FORBIDDEN_STATUS.includes(d.status.toUpperCase())) issues.push(`decision ${d.key ?? "?"} 금지 status=${d.status}`);
  }
  return issues;
}
function validateKeyCoverage(decisions, requiredKeys) {
  const issues = [];
  const keys = Array.isArray(decisions) ? decisions.map((d) => d.key) : [];
  for (const rk of requiredKeys) if (!keys.includes(rk)) issues.push(`필수 decision key 누락: ${rk}`);
  for (const k of keys) if (!requiredKeys.includes(k)) issues.push(`알 수 없는 decision key: ${k}`);
  return issues;
}
function detectForbiddenFlagEscalation(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const name of PROHIBITED_FLAGS) if (f[name] !== false) issues.push(`prohibited flag ${name}=${f[name]} (false 아님)`);
  return issues;
}
function detectOwnerQaAutoPass(decisions, flags) {
  const issues = [];
  if ((flags ?? {}).ownerQaPassed === true) issues.push("ownerQaPassed=true (자동/기술 pass 대체 금지)");
  const oq = Array.isArray(decisions) ? decisions.find((d) => d.key === "owner_viewing_listening_qa") : null;
  if (oq) {
    if (oq.status !== "PENDING") issues.push("owner_viewing_listening_qa status가 PENDING 아님");
    const warn = `${oq.nonApprovalWarning ?? ""} ${oq.safeApprovalSnippet ?? ""}`;
    if (!/자동|automat/i.test(warn) || !(warn.includes("ownerQaPassed") || warn.includes("QA 통과") || warn.includes("PASS"))) {
      issues.push("owner QA 결정에 자동 대체 금지 wording 부족");
    }
  }
  return issues;
}

// ── 1. packet 기본 계약 ─────────────────────────────────────────────────────
{
  check("packet schemaVersion + status = DECISION_PREPARATION_NO_LIVE",
    packet.schemaVersion === "golden_sample_owner_decision_resolution_packet_v1" &&
    packet.status === "DECISION_PREPARATION_NO_LIVE");
  check("packet readinessVerdict.current = STANDARDIZED_NO_LIVE_READY (승격 없음)",
    packet.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" &&
    isStrArr(packet.readinessVerdict?.isNot) && packet.readinessVerdict.isNot.includes("upload_ready"));
  check("packet flags 11종 전부 false (fail-closed)",
    detectForbiddenFlagEscalation(packet.flags).length === 0, detectForbiddenFlagEscalation(packet.flags).slice(0, 2).join("; "));
  check("packet basedOn integrated readiness contract 참조 실재",
    isStr(packet.basedOn?.integratedReadinessContract) && existsSync(path.join(ROOT, packet.basedOn.integratedReadinessContract)));
  check("packet globalNonApprovalWarning: 결정≠실행 승인 명시",
    isStr(packet.globalNonApprovalWarning) && packet.globalNonApprovalWarning.includes("실행 승인이 아니다"));
}

// ── 2. decision 10개 coverage + Slice 5 contract 교차검증 ──────────────────
{
  const decisions = packet.decisions ?? [];
  check("packet decisions 10개", Array.isArray(decisions) && decisions.length === 10, `len=${decisions.length}`);
  check("packet decision key coverage = 필수 10개 정확 일치",
    validateKeyCoverage(decisions, REQUIRED_KEYS).length === 0, validateKeyCoverage(decisions, REQUIRED_KEYS).join("; "));

  // Slice 5 contract는 이제 10개 결정 전부를 ownerDecisionState.resolvedKeys/resolvedDecisions로 보유
  // (safe-default final resolution: unresolvedOwnerDecisions는 빈 배열, pending 0).
  const ods = contract.ownerDecisionState ?? {};
  const contractKeys = ods.resolvedKeys ?? [];
  check("packet key set == Slice 5 integrated contract ownerDecisionState.resolvedKeys (10개)",
    setEq(decisions.map((d) => d.key), contractKeys), `contract=${contractKeys.length} packet=${decisions.length}`);
  // resolved value가 packet recommendedDefault와 일치 (정합 확인)
  const rdMiss = (ods.resolvedDecisions ?? []).filter((rd) => {
    const pd = decisions.find((d) => d.key === rd.key);
    return !pd || pd.recommendedDefault !== rd.resolvedValue;
  }).map((rd) => rd.key);
  check("contract ownerDecisionState.resolvedDecisions 값 == packet recommendedDefault (10개 정합)",
    (ods.resolvedDecisions ?? []).length === 10 && rdMiss.length === 0, `mismatch=${rdMiss.join(",")}`);
  // pending은 전부 해소됨 (빈 배열 / 0)
  check("contract ownerDecisionState pendingKeys=[] + pendingCount=0 (전부 resolved)",
    Array.isArray(ods.pendingKeys) && ods.pendingKeys.length === 0 && ods.pendingCount === 0 &&
    Array.isArray(contract.unresolvedOwnerDecisions) && contract.unresolvedOwnerDecisions.length === 0);
  // readiness는 여전히 STANDARDIZED_NO_LIVE_READY이고 ownerQaPassed는 false (정책 resolved ≠ 실제 QA pass)
  check("contract readiness STANDARDIZED_NO_LIVE_READY + ownerQaPassed=false (owner_qa 정책 resolved ≠ 실제 pass)",
    contract.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" && contract.flags?.ownerQaPassed === false);

  // packet.coverage.requiredDecisionKeys도 동일해야
  check("packet.coverage.requiredDecisionKeys == 필수 10개",
    setEq(packet.coverage?.requiredDecisionKeys, REQUIRED_KEYS));
  check("packet.coverage.totalDecisions=10 + allPending=true",
    packet.coverage?.totalDecisions === 10 && packet.coverage?.allPending === true);
}

// ── 3. 모든 decision status PENDING + 필수 필드 ────────────────────────────
{
  const decisions = packet.decisions ?? [];
  check("packet 모든 decision status = PENDING (silent resolve 금지)",
    validateDecisionStatuses(decisions).length === 0, validateDecisionStatuses(decisions).slice(0, 3).join("; "));

  const REQ_FIELDS = ["source", "blocks", "recommendedDefault", "allowedChoices", "decideNow",
    "minimumEvidenceBeforeDecision", "safeApprovalSnippet", "nonApprovalWarning"];
  const fieldMiss = [];
  for (const d of decisions) {
    for (const f of REQ_FIELDS) {
      if (d[f] === undefined) { fieldMiss.push(`${d.key}.${f}`); continue; }
      if (f === "blocks" && !Array.isArray(d.blocks)) fieldMiss.push(`${d.key}.blocks(비배열)`);
      else if (f === "allowedChoices" && !(Array.isArray(d.allowedChoices) && d.allowedChoices.length >= 2)) fieldMiss.push(`${d.key}.allowedChoices(<2)`);
      else if (f === "decideNow" && typeof d.decideNow !== "boolean") fieldMiss.push(`${d.key}.decideNow(비boolean)`);
      else if (["source", "recommendedDefault", "minimumEvidenceBeforeDecision", "safeApprovalSnippet", "nonApprovalWarning"].includes(f) && !isStr(d[f])) fieldMiss.push(`${d.key}.${f}(빈값)`);
    }
  }
  check("packet 모든 decision 필수 8필드 존재/형식", fieldMiss.length === 0, fieldMiss.slice(0, 4).join("; "));

  // 각 nonApprovalWarning은 '실행≠승인'류 안전 wording 포함
  //  - "승인이 아니" (직접 부정) / "별도 ... 승인 필요" (별도 승인 요구) / "대체 불가" / "통과가 아니" (QA)
  const warnOk = (w) => /승인이 아니|승인이 절대 아니|대체 불가|별도 .*승인 (필요|있어야)|통과가 아니/.test(w ?? "");
  const warnMiss = decisions.filter((d) => !warnOk(d.nonApprovalWarning));
  check("packet 모든 decision nonApprovalWarning: 실행 승인 아님 명시", warnMiss.length === 0, warnMiss.map((d) => d.key).join(","));

  // safeApprovalSnippet에 recommendedDefault 값이 들어있어 결정-범위 한정 확인
  const snipMiss = decisions.filter((d) => isStr(d.recommendedDefault) && isStr(d.safeApprovalSnippet) && !d.safeApprovalSnippet.includes(d.recommendedDefault));
  check("packet safeApprovalSnippet이 recommendedDefault 값을 참조(결정-범위 한정)", snipMiss.length === 0, snipMiss.map((d) => d.key).join(","));
}

// ── 4. prohibitedEscalation + owner QA 자동 PASS 불가 ──────────────────────
{
  check("packet prohibitedEscalation.flags = 금지 10종",
    setEq(packet.prohibitedEscalation?.flags, PROHIBITED_FLAGS));
  check("packet prohibitedEscalation.forbiddenStatusValues 포함 RESOLVED/APPROVED/PASS",
    isStrArr(packet.prohibitedEscalation?.forbiddenStatusValues) &&
    ["RESOLVED", "APPROVED", "PASS"].every((s) => packet.prohibitedEscalation.forbiddenStatusValues.includes(s)));
  check("packet owner QA 자동 PASS 불가 (flags + decision wording)",
    detectOwnerQaAutoPass(packet.decisions, packet.flags).length === 0,
    detectOwnerQaAutoPass(packet.decisions, packet.flags).join("; "));
  check("packet forbiddenBehavior: recommendedDefault=승인 오해 금지 명시",
    isStrArr(packet.forbiddenBehavior) &&
    packet.forbiddenBehavior.some((s) => s.includes("recommendedDefault")) &&
    packet.forbiddenBehavior.some((s) => s.includes("ownerQaPassed")));
}

// ── 5. markdown packet 검증 ────────────────────────────────────────────────
{
  check("markdown: 'live 실행 승인이 아니다' 명시", md.includes("live 실행 승인이 아니다"));
  check("markdown: verdict STANDARDIZED_NO_LIVE_READY 유지 명시", md.includes("STANDARDIZED_NO_LIVE_READY"));
  const keyMiss = REQUIRED_KEYS.filter((k) => !md.includes(k));
  check("markdown: 10개 decision key 전부 참조", keyMiss.length === 0, keyMiss.join(","));
  // live approval 오해 wording 부재. escalation을 '주장'하는 문장만 잡고,
  // negation 문맥("될 수 없다/아니다/않는다")의 flag 언급은 안전하므로 제외 (줄 단위 검사).
  const badApproval = [
    /live\s+(TTS|render|mux|upload)\s+승인함/i,
    /업로드\s+승인함/i,
    /production\s*ready\s*=\s*true/i,
    /ownerQaPassed\s*=\s*true/i,
    /uploadReady\s*=\s*true/i,
  ];
  const negation = /(될 수 없|되지 않|아니다|아니라|아니며|금지|불가)/;
  const mdLines = md.split("\n");
  const badLine = mdLines.find((line) => badApproval.some((r) => r.test(line)) && !negation.test(line));
  check("markdown: live/upload/production 승인 주장 wording 부재 (negation 제외)", !badLine, badLine ? badLine.trim().slice(0, 80) : "");
  check("markdown: owner_qa 자동 대체 불가 명시",
    md.includes("ownerQaPassed=true") && /자동.*(될 수 없|불가)/.test(md));
  check("markdown: 복사용 승인 snippet 블록 존재", md.includes("복사용 승인 snippet") && md.includes("결정 #1"));
}

// ── 6. 가드 self + fixture forbidden 실행 패턴 스캔 ─────────────────────────
{
  const J = (a, b) => a + b;
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const scan = (label, src) => {
    const hit = execTokens.find((t) => src.includes(t));
    check(`no forbidden live/env/write pattern in ${label}`, !hit, hit ? `token=${hit}` : "");
  };
  scan("packet fixture", packetF.raw);
  scan("guard script (self)", readFileSync(SELF, "utf8"));
  const specifiers = [...readFileSync(SELF, "utf8").matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 7. in-memory mutant — fail-closed 확인 ─────────────────────────────────
{
  // status mutation
  const mResolved = clone(packet.decisions); mResolved[0].status = "RESOLVED";
  check("mutant: decision status RESOLVED → fail", validateDecisionStatuses(mResolved).some((i) => i.includes("RESOLVED")));
  const mApproved = clone(packet.decisions); mApproved[2].status = "APPROVED";
  check("mutant: decision status APPROVED → fail", validateDecisionStatuses(mApproved).some((i) => i.includes("APPROVED")));
  const mPass = clone(packet.decisions); mPass[9].status = "PASS";
  check("mutant: owner_qa status PASS → fail", validateDecisionStatuses(mPass).some((i) => i.includes("PASS")));

  // missing decision
  const mMissing = packet.decisions.filter((d) => d.key !== "font_vendoring");
  check("mutant: font_vendoring decision 제거 → fail", validateKeyCoverage(mMissing, REQUIRED_KEYS).some((i) => i.includes("font_vendoring")));
  const mMissingQa = packet.decisions.filter((d) => d.key !== "owner_viewing_listening_qa");
  check("mutant: owner_viewing_listening_qa decision 제거 → fail", validateKeyCoverage(mMissingQa, REQUIRED_KEYS).some((i) => i.includes("owner_viewing_listening_qa")));

  // readiness escalation
  const truthy = 1 === 1;
  check("mutant: uploadReady true → fail", detectForbiddenFlagEscalation({ ...packet.flags, uploadReady: truthy }).some((i) => i.includes("uploadReady")));
  check("mutant: productionReady true → fail", detectForbiddenFlagEscalation({ ...packet.flags, productionReady: truthy }).some((i) => i.includes("productionReady")));

  // owner QA auto-pass
  check("mutant: ownerQaPassed true → fail", detectOwnerQaAutoPass(packet.decisions, { ...packet.flags, ownerQaPassed: truthy }).some((i) => i.includes("ownerQaPassed")));
  const mQaFlip = clone(packet.decisions); mQaFlip.find((d) => d.key === "owner_viewing_listening_qa").status = "PASS";
  check("mutant: owner_qa decision status PASS → fail(auto-pass 탐지)", detectOwnerQaAutoPass(mQaFlip, packet.flags).some((i) => i.includes("PENDING 아님")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
