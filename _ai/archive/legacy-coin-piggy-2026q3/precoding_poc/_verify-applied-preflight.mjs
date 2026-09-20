// 적용된 fail-closed checkPreflight 로직 검증 — 외부호출 없음.
// scripts/_ep003-jdm-veo-generate.mjs 의 수정된 hash 게이트 분기를 미러한다.
// (generate runner 는 import 시 메인이 실행되어 단위 import 불가하므로 로직을 미러로 재현)

const SCENE_ID = "S3";
let aborts = [];
function abort(code, m) { aborts.push({ code, m }); }

function checkPreflightGate(pf, promptHash, refHash) {
  aborts = [];
  if (!pf) { abort("no_preflight", "없음"); return [...aborts]; }
  if (pf.result !== "PREFLIGHT_PASS") { abort("preflight_not_pass", pf.result); return [...aborts]; }

  const pfPromptHash = pf.prompt_checks?.[SCENE_ID]?.hash;
  if (!pfPromptHash) abort("PREFLIGHT_INCOMPLETE", "prompt hash 없음");
  else if (pfPromptHash !== promptHash) abort("PREFLIGHT_STALE", "prompt hash 불일치");

  const pfRefHash = pf.ref_checks?.[SCENE_ID]?.hash;
  if (!pfRefHash) abort("PREFLIGHT_INCOMPLETE", "ref hash 없음");
  else if (pfRefHash !== refHash) abort("PREFLIGHT_STALE", "ref hash 불일치");

  return [...aborts];
}

const GOOD_P = "aaaa", GOOD_R = "bbbb";
const cases = [
  { name: "정상: 일치하는 hash",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:GOOD_P}}, ref_checks:{S3:{hash:GOOD_R}} },
    p: GOOD_P, r: GOOD_R, expectAbort: false },
  { name: "정상 차단: prompt hash 불일치",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:"WRONG"}}, ref_checks:{S3:{hash:GOOD_R}} },
    p: GOOD_P, r: GOOD_R, expectAbort: true },
  { name: "fail-closed: prompt_checks 필드 누락",
    pf: { result:"PREFLIGHT_PASS", ref_checks:{S3:{hash:GOOD_R}} },
    p: "ANY", r: GOOD_R, expectAbort: true },
  { name: "fail-closed: prompt_checks.S3 누락",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{}, ref_checks:{S3:{hash:GOOD_R}} },
    p: "ANY", r: GOOD_R, expectAbort: true },
  { name: "fail-closed: hash 빈 문자열",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:""}}, ref_checks:{S3:{hash:""}} },
    p: "ANY", r: "ANY2", expectAbort: true },
  { name: "fail-closed: ref_checks 필드 누락",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:GOOD_P}} },
    p: GOOD_P, r: "ANY", expectAbort: true },
];

console.log("=== 적용된 fail-closed checkPreflight 검증 ===\n");
let weak = [];
for (const c of cases) {
  const ab = checkPreflightGate(c.pf, c.p, c.r);
  const aborted = ab.length > 0;
  const safe = aborted === c.expectAbort;
  console.log(`${safe ? "✅" : "🔴"} ${c.name} — aborted=${aborted} (기대=${c.expectAbort})${aborted ? ` [${ab[0].code}]` : ""}`);
  if (!safe) weak.push(c.name);
}
console.log(`\n불안전 케이스: ${weak.length}개`);
process.exit(weak.length > 0 ? 1 : 0);
