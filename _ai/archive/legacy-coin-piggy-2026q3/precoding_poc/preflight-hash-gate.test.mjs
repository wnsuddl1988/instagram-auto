// PoC 검증 — generate의 checkPreflight() hash 게이트 우회 가능성 (무비용)
// scripts/_ep003-jdm-veo-generate.mjs L155~199 로직 미러.
// 가설: preflight JSON에 prompt_checks/ref_checks 필드가 없으면 hash 검사를 silent skip 한다.

let aborts = [];
function abort(code, m) { aborts.push({ code, m }); }

// checkPreflight 로직 미러 (DRY=false 기준, STALE 무시)
function checkPreflight(pf, promptHash, refHash) {
  aborts = [];
  if (!pf) { abort("no_preflight", "없음"); return; }
  if (pf.result !== "PREFLIGHT_PASS") { abort("preflight_not_pass", pf.result); return; }
  let promptChecked = false, refChecked = false;
  if (pf.prompt_checks && pf.prompt_checks.S3) {
    promptChecked = true;
    const pfHash = pf.prompt_checks.S3.hash;
    if (pfHash && pfHash !== promptHash) abort("PREFLIGHT_STALE", "prompt hash 불일치");
  }
  if (pf.ref_checks && pf.ref_checks.S3) {
    refChecked = true;
    const pfRef = pf.ref_checks.S3.hash;
    if (pfRef && pfRef !== refHash) abort("PREFLIGHT_STALE", "ref hash 불일치");
  }
  return { aborts: [...aborts], promptChecked, refChecked };
}

const GOOD_PROMPT = "aaaa";
const GOOD_REF = "bbbb";

const cases = [
  {
    name: "정상: 일치하는 hash",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:GOOD_PROMPT}}, ref_checks:{S3:{hash:GOOD_REF}} },
    pHash: GOOD_PROMPT, rHash: GOOD_REF,
    expectAbort: false,
  },
  {
    name: "정상 차단: prompt hash 불일치",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:"WRONG"}}, ref_checks:{S3:{hash:GOOD_REF}} },
    pHash: GOOD_PROMPT, rHash: GOOD_REF,
    expectAbort: true,
  },
  {
    name: "⚠️ 우회 위험: prompt_checks 필드 누락",
    pf: { result:"PREFLIGHT_PASS", ref_checks:{S3:{hash:GOOD_REF}} },
    pHash: "ANY-DIFFERENT-HASH", rHash: GOOD_REF,
    expectAbort: true, // 안전하려면 막아야 함
  },
  {
    name: "⚠️ 우회 위험: prompt_checks.S3 누락",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{}, ref_checks:{S3:{hash:GOOD_REF}} },
    pHash: "ANY-DIFFERENT-HASH", rHash: GOOD_REF,
    expectAbort: true,
  },
  {
    name: "⚠️ 우회 위험: hash 필드가 빈 문자열",
    pf: { result:"PREFLIGHT_PASS", prompt_checks:{S3:{hash:""}}, ref_checks:{S3:{hash:""}} },
    pHash: "ANY", rHash: "ANY2",
    expectAbort: true,
  },
];

console.log("=== checkPreflight hash 게이트 우회 검증 ===\n");
let weak = [];
for (const c of cases) {
  const r = checkPreflight(c.pf, c.pHash, c.rHash);
  const aborted = r.aborts.length > 0;
  const safe = aborted === c.expectAbort;
  const mark = safe ? "✅" : "🔴";
  console.log(`${mark} ${c.name}`);
  console.log(`     promptChecked=${r.promptChecked} refChecked=${r.refChecked} aborted=${aborted} (기대 abort=${c.expectAbort})`);
  if (!safe) weak.push(c.name);
}

console.log(`\n게이트 우회 가능 케이스: ${weak.length}개`);
weak.forEach(w => console.log("  🔴", w));
console.log(weak.length === 0 ? "\nPASS 🎉" : "\n⚠️ 잠재 우회 존재 — Codex 검토 필요");
