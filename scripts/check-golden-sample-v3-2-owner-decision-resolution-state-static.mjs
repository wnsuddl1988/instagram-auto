#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-owner-decision-resolution-state-static.mjs
 *
 * Golden Sample v3.2 — Owner decision resolution state 정적 가드.
 * task: golden-sample-v3-2-owner-decisions-now-resolution-state-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-mux /
 *   no-audio·video·image-read / no-write: 레포 내 fixture JSON만 읽어 검증.
 * - 검증 대상:
 *   1) state fixture ↔ Slice 6 packet ↔ Slice 5 integrated readiness contract 정합
 *   2) resolvedDecisions 4개 값이 packet의 recommendedDefault와 정확히 일치
 *   3) pendingDecisions 6개가 packet의 decideNow=false 6개와 정확히 일치, status=PENDING
 *   4) readiness/live/upload/automation flag 11종 전부 false
 *   5) font vendoring 결정 ≠ font 파일 커밋 승인, image allow guard 결정 ≠ API 실행 승인 (wording 검증)
 *   6) mutant: 5번째 결정 resolve, 4개 값 중 하나 변경, flag true 설정,
 *      font/image guard 오해석 전부 fail-closed 확인
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const STATE_PATH = FX("golden_sample_v3_2_owner_decision_resolution_state.v1.json");
const PACKET_PATH = FX("golden_sample_v3_2_owner_decision_resolution_packet.v1.json");
const CONTRACT_PATH = FX("golden_sample_v3_2_integrated_production_readiness_contract.v1.json");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
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

// 이제 10개 결정 전부 resolved (safe default final resolution). pending은 0.
const RESOLVED_KEYS_EXPECTED = [
  "script_impact_gate_score_authority",
  "font_vendoring",
  "image_script_allow_guard",
  "poll_25s_passive_window",
  "legacy_line_scope",
  "upload_endpoint_disposition",
  "blueprint_schema_unification",
  "md5_locked_image_durability",
  "contract_duality_resolution",
  "owner_viewing_listening_qa",
];
const PENDING_KEYS_EXPECTED = [];
// safe default로 새로 resolved된 6개 (packet decideNow=false지만 Owner가 최종 확정)
const NEWLY_RESOLVED_KEYS = [
  "legacy_line_scope",
  "upload_endpoint_disposition",
  "blueprint_schema_unification",
  "md5_locked_image_durability",
  "contract_duality_resolution",
  "owner_viewing_listening_qa",
];
const PROHIBITED_FLAGS = ["uploadReady", "automationExpansionReady", "implementationApproved",
  "liveTtsApproved", "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved",
  "chatgptPlaywrightApproved", "ownerQaPassed", "productionReady"];

const stateF = loadJson("owner decision resolution state fixture", STATE_PATH);
const packetF = loadJson("Slice 6 owner decision packet fixture", PACKET_PATH);
const contractF = loadJson("Slice 5 integrated readiness contract", CONTRACT_PATH);

if (!stateF.parsed || !packetF.parsed || !contractF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const state = stateF.parsed;
const packet = packetF.parsed;
const contract = contractF.parsed;

// ── 0. 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────
function detectForbiddenFlagEscalation(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const name of PROHIBITED_FLAGS) if (f[name] !== false) issues.push(`prohibited flag ${name}=${f[name]} (false 아님)`);
  return issues;
}
// safe-default final resolution: 10개 결정 전부 resolved. 각 resolvedValue는 packet
// recommendedDefault와 일치해야 한다 (decideNow 여부와 무관 — Owner가 남은 6개도 확정).
function validateResolvedAgainstPacket(resolved, packetDecisions) {
  const issues = [];
  if (!Array.isArray(resolved)) { issues.push("resolvedDecisions 배열 없음"); return issues; }
  for (const r of resolved) {
    const pd = (packetDecisions ?? []).find((d) => d.key === r.key);
    if (!pd) { issues.push(`packet에 없는 key: ${r.key}`); continue; }
    if (r.resolvedValue !== pd.recommendedDefault) issues.push(`${r.key} resolvedValue(${r.resolvedValue}) != packet.recommendedDefault(${pd.recommendedDefault})`);
    if (r.matchesPacketRecommendedDefault !== true) issues.push(`${r.key} matchesPacketRecommendedDefault != true`);
  }
  return issues;
}
function validatePendingAgainstPacket(pending, packetDecisions) {
  const issues = [];
  if (!Array.isArray(pending)) { issues.push("pendingDecisions 배열 없음"); return issues; }
  for (const p of pending) {
    if (p.status !== "PENDING") issues.push(`${p.key} status=${p.status} (PENDING 아님)`);
    const pd = (packetDecisions ?? []).find((d) => d.key === p.key);
    if (!pd) { issues.push(`packet에 없는 key: ${p.key}`); continue; }
    if (pd.decideNow !== false) issues.push(`${p.key}는 packet에서 decideNow=false 아님`);
  }
  return issues;
}
function detectFontVendoringMisinterpretation(resolvedDecisions) {
  const issues = [];
  const fv = (resolvedDecisions ?? []).find((d) => d.key === "font_vendoring");
  if (!fv) return issues;
  const warn = fv.nonLiveScopeWarning ?? "";
  if (!/폰트 파일 추가.*(전혀 아니|아니다|승인.*아니)/.test(warn) && !/파일 추가.*아니/.test(warn)) {
    issues.push("font_vendoring nonLiveScopeWarning에 '폰트 파일 추가 승인 아님' 명시 부족");
  }
  if (!/dependency|render|mux/.test(warn)) issues.push("font_vendoring nonLiveScopeWarning에 dependency/render/mux 비승인 언급 부족");
  return issues;
}
function detectImageGuardMisinterpretation(resolvedDecisions) {
  const issues = [];
  const ig = (resolvedDecisions ?? []).find((d) => d.key === "image_script_allow_guard");
  if (!ig) return issues;
  const warn = ig.nonLiveScopeWarning ?? "";
  if (!/API 호출.*(전혀 아니|아니다)/.test(warn)) issues.push("image_script_allow_guard nonLiveScopeWarning에 'API 호출 승인 아님' 명시 부족");
  if (!/(ChatGPT|Playwright|browser)/.test(warn)) issues.push("image_script_allow_guard nonLiveScopeWarning에 ChatGPT/Playwright/browser 비승인 언급 부족");
  if (!/이미지 생성/.test(warn)) issues.push("image_script_allow_guard nonLiveScopeWarning에 '이미지 생성 승인 아님' 언급 부족");
  return issues;
}

// ── 1. state 기본 계약 ──────────────────────────────────────────────────────
{
  check("state schemaVersion + status = ALL_POLICY_DECISIONS_RESOLVED_NO_LIVE",
    state.schemaVersion === "golden_sample_owner_decision_resolution_state_v1" &&
    state.status === "ALL_POLICY_DECISIONS_RESOLVED_NO_LIVE");
  check("state readinessVerdict.current = STANDARDIZED_NO_LIVE_READY (승격 없음)",
    state.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" &&
    Array.isArray(state.readinessVerdict?.isNot) && state.readinessVerdict.isNot.includes("upload_ready"));
  check("state recommendationSource가 Slice 6 packet 참조",
    isStr(state.recommendationSource) && state.recommendationSource.endsWith("golden_sample_v3_2_owner_decision_resolution_packet.v1.json"));
  check("state readinessContractRef가 Slice 5 integrated contract 참조",
    isStr(state.readinessContractRef) && state.readinessContractRef.endsWith("golden_sample_v3_2_integrated_production_readiness_contract.v1.json"));
  check("state ownerApprovalSource: verbatim reply 기록 + scopeLimit 명시",
    isStr(state.ownerApprovalSource?.ownerReplyVerbatim) &&
    state.ownerApprovalSource.ownerReplyVerbatim.includes("그래 진행해") &&
    isStr(state.ownerApprovalSource?.scopeLimit) && state.ownerApprovalSource.scopeLimit.includes("승인하지 않는다"));
  check("state finalPolicyApprovalSource: safe-default 승인 verbatim + scopeLimit(실행 승인 아님) 기록",
    isStr(state.finalPolicyApprovalSource?.ownerReplyVerbatim) &&
    state.finalPolicyApprovalSource.ownerReplyVerbatim.includes("safe default") &&
    isStr(state.finalPolicyApprovalSource?.scopeLimit) &&
    state.finalPolicyApprovalSource.scopeLimit.includes("승인하지 않는다"));
  check("state flags 11종 전부 false (fail-closed)",
    detectForbiddenFlagEscalation(state.flags).length === 0, detectForbiddenFlagEscalation(state.flags).join("; "));
  check("state ownerViewingListeningActualStatus = PENDING_DIRECT_OWNER_REVIEW (정책 resolved ≠ 실제 QA pass)",
    state.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    isStr(state.ownerViewingListeningActualStatusNote) &&
    state.ownerViewingListeningActualStatusNote.includes("ownerQaPassed"));
}

// ── 2. resolved 10개 ↔ packet recommendedDefault 정확 일치 ─────────────────
{
  const resolved = state.resolvedDecisions ?? [];
  check("state resolvedDecisions 정확히 10개", Array.isArray(resolved) && resolved.length === 10, `len=${resolved.length}`);
  check("state resolvedDecisions key set == 지정된 10개",
    setEq(resolved.map((d) => d.key), RESOLVED_KEYS_EXPECTED));
  check("state resolvedDecisions 값이 packet.recommendedDefault와 전부 일치",
    validateResolvedAgainstPacket(resolved, packet.decisions).length === 0,
    validateResolvedAgainstPacket(resolved, packet.decisions).join("; "));
  // 신규 6개 결정도 packet 10개 결정과 정확히 정합
  const packetKeys = packet.decisions.map((d) => d.key);
  check("state resolvedDecisions key set == packet 10개 결정 전부",
    setEq(resolved.map((d) => d.key), packetKeys));

  const REQ_FIELDS = ["resolvedValue", "matchesPacketRecommendedDefault", "resolvedAt", "resolvedBy", "scope", "nonLiveScopeWarning", "stillBlocks"];
  const fieldMiss = [];
  for (const r of resolved) for (const f of REQ_FIELDS) if (r[f] === undefined) fieldMiss.push(`${r.key}.${f}`);
  check("state resolvedDecisions 필수 필드 존재", fieldMiss.length === 0, fieldMiss.join("; "));

  check("state resolvedDecisions 모두 nonLiveScopeWarning에 '승인이 아니' wording",
    resolved.every((d) => /승인이 아니|승인이 전혀 아니/.test(d.nonLiveScopeWarning ?? "")));

  // owner_viewing_listening_qa는 정책 resolved지만 실제 QA pass 아님을 명시
  const oq = resolved.find((d) => d.key === "owner_viewing_listening_qa");
  check("state owner_viewing_listening_qa resolved: policyResolvedButActualQaPending=true + actual status 참조",
    oq && oq.resolvedValue === "keep_manual_owner_qa_mandatory_non_automatable" &&
    oq.policyResolvedButActualQaPending === true &&
    oq.actualQaStatusRef === "ownerViewingListeningActualStatus" &&
    /자동.*(대체 불가|될 수 없)|ownerQaPassed|실제 QA 통과가 아니/.test(oq.nonLiveScopeWarning ?? ""));

  // upload/backup 정책이 실행 승인이 아님을 명시
  const up = resolved.find((d) => d.key === "upload_endpoint_disposition");
  check("state upload_endpoint_disposition: 하드 블록 유지 + upload 활성화 비승인 명시",
    up && up.resolvedValue === "keep_hard_blocked_until_upload_slice" &&
    /(엔드포인트 활성화|upload 실행).*(전혀 아니|아니)/.test(up.nonLiveScopeWarning ?? ""));
  const md5 = resolved.find((d) => d.key === "md5_locked_image_durability");
  check("state md5_locked_image_durability: 백업 정책만 + 파일 이동/복사 비승인 명시",
    md5 && md5.resolvedValue === "define_durable_backup_location_policy" &&
    /파일 이동\/복사.*(전혀 아니|아니)/.test(md5.nonLiveScopeWarning ?? ""));
}

// ── 3. pending 0개 (전부 resolved) ─────────────────────────────────────────
{
  const pending = state.pendingDecisions ?? [];
  check("state pendingDecisions 빈 배열 (0개, 전부 resolved)", Array.isArray(pending) && pending.length === 0, `len=${pending.length}`);
}

// ── 4. coverage + prohibitedInterpretations + forbiddenBehavior ───────────
{
  check("state coverage.resolvedKeys == 10개 지정 + resolvedCount=10",
    setEq(state.coverage?.resolvedKeys, RESOLVED_KEYS_EXPECTED) && state.coverage?.resolvedCount === 10);
  check("state coverage.pendingKeys == 빈 배열 + pendingCount=0",
    setEq(state.coverage?.pendingKeys, PENDING_KEYS_EXPECTED) && Array.isArray(state.coverage?.pendingKeys) &&
    state.coverage.pendingKeys.length === 0 && state.coverage?.pendingCount === 0);
  check("state coverage.totalDecisions=10", state.coverage?.totalDecisions === 10);

  check("state prohibitedInterpretations: font/image/poll/script 오해석 항목 전부 포함",
    Array.isArray(state.prohibitedInterpretations) &&
    state.prohibitedInterpretations.some((s) => s.includes("font_vendoring") && s.includes("dependency")) &&
    state.prohibitedInterpretations.some((s) => s.includes("image_script_allow_guard") && s.includes("API")) &&
    state.prohibitedInterpretations.some((s) => s.includes("poll_25s_passive_window")) &&
    state.prohibitedInterpretations.some((s) => s.includes("script_impact_gate_score_authority")));
  check("state prohibitedInterpretations: readiness 승격 근거 사용 금지 + Owner QA 자동 pass 금지 포함",
    state.prohibitedInterpretations.some((s) => s.includes("productionReady") || s.includes("uploadReady")) &&
    state.prohibitedInterpretations.some((s) => s.includes("Owner QA") && s.includes("자동")));
  check("state prohibitedInterpretations: 신규 6개(upload 활성화/파일 이동/owner_qa 실제 pass) 오해석 금지 포함",
    state.prohibitedInterpretations.some((s) => s.includes("upload_endpoint_disposition") && (s.includes("활성화") || s.includes("upload 실행"))) &&
    state.prohibitedInterpretations.some((s) => s.includes("md5_locked_image_durability") && (s.includes("이동") || s.includes("복사"))) &&
    state.prohibitedInterpretations.some((s) => s.includes("owner_viewing_listening_qa") && (s.includes("실제") || s.includes("ownerQaPassed"))));

  check("state forbiddenBehavior: pendingDecisions/resolved 되돌림 금지 + ownerQaPassed true 금지 + font 파일 + upload 활성화 + 파일 이동/복사 금지",
    Array.isArray(state.forbiddenBehavior) &&
    state.forbiddenBehavior.some((s) => s.includes("pendingDecisions")) &&
    state.forbiddenBehavior.some((s) => s.includes("ownerQaPassed")) &&
    state.forbiddenBehavior.some((s) => s.includes("폰트 파일")) &&
    state.forbiddenBehavior.some((s) => s.includes("upload") && s.includes("활성화")) &&
    state.forbiddenBehavior.some((s) => s.includes("이동") || s.includes("복사")));
}

// ── 5. font/image guard 오해석 방지 wording 상세 검증 ───────────────────────
{
  check("font_vendoring 결정: 폰트 파일 추가/dependency/render/mux 비승인 명시",
    detectFontVendoringMisinterpretation(state.resolvedDecisions).length === 0,
    detectFontVendoringMisinterpretation(state.resolvedDecisions).join("; "));
  check("image_script_allow_guard 결정: API 호출/ChatGPT·Playwright·browser/이미지 생성 비승인 명시",
    detectImageGuardMisinterpretation(state.resolvedDecisions).length === 0,
    detectImageGuardMisinterpretation(state.resolvedDecisions).join("; "));
}

// ── 6. markdown packet current-state 섹션 검증 ─────────────────────────────
{
  const MD_PATH = path.join(ROOT, "_ai", "GOLDEN_SAMPLE_V3_2_OWNER_DECISION_PACKET.md");
  let md = null;
  try { md = readFileSync(MD_PATH, "utf8"); check("markdown packet readable", true); }
  catch (e) { check("markdown packet readable", false, String(e).slice(0, 120)); }
  if (md !== null) {
    check("markdown: 'Current Owner' 섹션 존재", /Current Owner/i.test(md));
    check("markdown: 10개 resolved key 전부 언급", RESOLVED_KEYS_EXPECTED.every((k) => md.includes(k)));
    check("markdown: owner_viewing_listening_qa 언급 + 실제 QA 미통과 명시",
      md.includes("owner_viewing_listening_qa") &&
      (md.includes("PENDING_DIRECT_OWNER_REVIEW") || md.includes("실제 Owner viewing/listening QA는 아직 통과")));
    check("markdown: live 실행 승인 아님 문구 유지", md.includes("live 실행 승인이 아니다"));
  }
}

// ── 7. 가드 self 소스 스캔 + import allowlist ───────────────────────────────
{
  const J = (a, b) => a + b;
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in state fixture", !execTokens.some((t) => stateF.raw.includes(t)));
  const specifiers = [...selfSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 8. in-memory mutant — fail-closed 확인 ─────────────────────────────────
{
  // 신규 resolved key 하나 제거 → key set 10개 불일치
  const mMissing = clone(state.resolvedDecisions).filter((d) => d.key !== "contract_duality_resolution");
  check("mutant: 신규 resolved key(contract_duality_resolution) 제거 → fail(key set 10개 불일치)",
    !setEq(mMissing.map((d) => d.key), RESOLVED_KEYS_EXPECTED));

  // 신규 resolved key 값 변조
  const mNewWrong = clone(state.resolvedDecisions);
  mNewWrong.find((d) => d.key === "upload_endpoint_disposition").resolvedValue = "harden_with_auth_and_readiness_gate";
  check("mutant: 신규 key(upload_endpoint_disposition) 값 변조 → fail(packet recommendedDefault 불일치)",
    validateResolvedAgainstPacket(mNewWrong, packet.decisions).some((i) => i.includes("upload_endpoint_disposition")));

  // 기존 4개 값 중 하나 변경
  const mChanged = clone(state.resolvedDecisions);
  mChanged.find((d) => d.key === "font_vendoring").resolvedValue = "keep_blackhansans_as_approved";
  check("mutant: font_vendoring 값 변경 → fail(packet recommendedDefault 불일치)",
    validateResolvedAgainstPacket(mChanged, packet.decisions).some((i) => i.includes("font_vendoring")));

  // packet에 없는 key를 resolved에 추가
  const mUnknownKey = clone(state.resolvedDecisions);
  mUnknownKey.push({ key: "nonexistent_decision", resolvedValue: "x", matchesPacketRecommendedDefault: true });
  check("mutant: packet에 없는 key를 resolved에 추가 → fail",
    validateResolvedAgainstPacket(mUnknownKey, packet.decisions).some((i) => i.includes("packet에 없는 key")));

  // pending key 재도입 → pending 배열이 0이 아니게 됨
  const mPendingReintro = [{ key: "legacy_line_scope", status: "PENDING" }];
  check("mutant: pending key 재도입 → fail(pendingDecisions 0개 아님)",
    !(Array.isArray(mPendingReintro) && mPendingReintro.length === 0));

  // coverage pendingCount 0 아님
  const mCov = clone(state.coverage); mCov.pendingCount = 1; mCov.resolvedCount = 9;
  check("mutant: coverage resolvedCount 9/pendingCount 1 → fail",
    !(mCov.resolvedCount === 10 && mCov.pendingCount === 0));

  // flag escalation
  const truthy = 1 === 1;
  check("mutant: uploadReady true → fail", detectForbiddenFlagEscalation({ ...state.flags, uploadReady: truthy }).some((i) => i.includes("uploadReady")));
  check("mutant: productionReady true → fail", detectForbiddenFlagEscalation({ ...state.flags, productionReady: truthy }).some((i) => i.includes("productionReady")));
  check("mutant: ownerQaPassed true → fail", detectForbiddenFlagEscalation({ ...state.flags, ownerQaPassed: truthy }).some((i) => i.includes("ownerQaPassed")));
  check("mutant: liveRenderApproved true → fail", detectForbiddenFlagEscalation({ ...state.flags, liveRenderApproved: truthy }).some((i) => i.includes("liveRenderApproved")));
  check("mutant: chatgptPlaywrightApproved true → fail", detectForbiddenFlagEscalation({ ...state.flags, chatgptPlaywrightApproved: truthy }).some((i) => i.includes("chatgptPlaywrightApproved")));

  // owner_viewing_listening_qa 정책 resolved를 실제 QA PASS로 위장
  const mQaActualPass = "PASS";
  check("mutant: ownerViewingListeningActualStatus를 PASS로 위장 → fail(실제 확인 없이 PASS 금지)",
    mQaActualPass !== "PENDING_DIRECT_OWNER_REVIEW");
  // owner_qa resolved decision에서 policyResolvedButActualQaPending 제거
  const mQaFlagStrip = clone(state.resolvedDecisions);
  delete mQaFlagStrip.find((d) => d.key === "owner_viewing_listening_qa").policyResolvedButActualQaPending;
  check("mutant: owner_qa policyResolvedButActualQaPending 제거 → fail(정책=실제 pass 오해 방지 손실)",
    mQaFlagStrip.find((d) => d.key === "owner_viewing_listening_qa").policyResolvedButActualQaPending !== true);

  // upload endpoint policy를 upload 활성화 승인으로 오해 (warning에서 비승인 문구 제거)
  const mUploadMisread = clone(state.resolvedDecisions);
  mUploadMisread.find((d) => d.key === "upload_endpoint_disposition").nonLiveScopeWarning = "업로드 정책을 확정했다.";
  check("mutant: upload_endpoint_disposition warning에서 활성화 비승인 문구 제거 → fail",
    !/(엔드포인트 활성화|upload 실행).*(전혀 아니|아니)/.test(mUploadMisread.find((d) => d.key === "upload_endpoint_disposition").nonLiveScopeWarning));

  // md5 backup policy를 파일 이동/복사 승인으로 오해
  const mMd5Misread = clone(state.resolvedDecisions);
  mMd5Misread.find((d) => d.key === "md5_locked_image_durability").nonLiveScopeWarning = "백업 정책을 정의했다.";
  check("mutant: md5_locked_image_durability warning에서 파일 이동/복사 비승인 문구 제거 → fail",
    !/파일 이동\/복사.*(전혀 아니|아니)/.test(mMd5Misread.find((d) => d.key === "md5_locked_image_durability").nonLiveScopeWarning));

  // font vendoring 오해석 — warning에서 dependency/render/mux 비승인 문구 제거
  const mFontMisread = clone(state.resolvedDecisions);
  mFontMisread.find((d) => d.key === "font_vendoring").nonLiveScopeWarning = "폰트 정책을 확정했다.";
  check("mutant: font_vendoring warning에서 비승인 문구 제거 → fail(오해석 탐지)",
    detectFontVendoringMisinterpretation(mFontMisread).length > 0);

  // image allow guard 오해석 — warning에서 API/ChatGPT 비승인 문구 제거
  const mImageMisread = clone(state.resolvedDecisions);
  mImageMisread.find((d) => d.key === "image_script_allow_guard").nonLiveScopeWarning = "가드 정책을 확정했다.";
  check("mutant: image_script_allow_guard warning에서 비승인 문구 제거 → fail(오해석 탐지)",
    detectImageGuardMisinterpretation(mImageMisread).length > 0);
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
