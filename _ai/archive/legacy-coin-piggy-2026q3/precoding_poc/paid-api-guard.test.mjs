// PoC 검증 — paidApiGuard 진리표 전수 테스트 (무비용, 외부호출 없음)
// lib/paidApiGuard.ts 로직을 동일 재현해 fail-open(실수 허용) 케이스 존재 여부 검증.
// 앱 코드 미반영. 검증 전용.

// ── lib/paidApiGuard.ts 로직 미러 ──
function envFlag(env, key) {
  const val = env[key];
  if (val === undefined) return undefined;
  return String(val).toLowerCase() === "true";
}
function providerToEnvKey(p) {
  return { "openai-generate":"ALLOW_OPENAI_GENERATE","openai-tts":"ALLOW_OPENAI_TTS",
           "imagen":"ALLOW_IMAGEN","elevenlabs":"ALLOW_ELEVENLABS" }[p];
}
function getPerProviderFlag(env, p) {
  return envFlag(env, providerToEnvKey(p)) !== false;
}
function checkPaidApi(env, provider) {
  const masterEnabled = envFlag(env, "PAID_API_ENABLED") === true;
  if (!masterEnabled) return { allowed: false };
  if (!getPerProviderFlag(env, provider)) return { allowed: false };
  return { allowed: true };
}

const PROVIDERS = ["openai-generate","openai-tts","imagen","elevenlabs"];
// 마스터 플래그 가능한 값
const MASTER_VALS = [undefined, "true", "false", "TRUE", "1", "yes", ""];
// 세부 플래그 가능한 값
const PROV_VALS   = [undefined, "true", "false", "TRUE", "1", "yes", ""];

let total=0, allowCount=0, fails=[];
for (const provider of PROVIDERS) {
  const key = providerToEnvKey(provider);
  for (const m of MASTER_VALS) {
    for (const pv of PROV_VALS) {
      const env = {};
      if (m  !== undefined) env["PAID_API_ENABLED"] = m;
      if (pv !== undefined) env[key] = pv;
      const r = checkPaidApi(env, provider);
      total++;
      if (r.allowed) allowCount++;

      // 안전 불변식 검증:
      // (1) 마스터가 정확히 "true"(대소문자 무시)가 아니면 절대 allowed=false 여야 함
      const masterTrue = m !== undefined && String(m).toLowerCase() === "true";
      if (!masterTrue && r.allowed) {
        fails.push(`FAIL-OPEN: master=${JSON.stringify(m)} → allowed (마스터 미허용인데 통과!)`);
      }
      // (2) 세부 플래그가 정확히 "false"면 마스터 true여도 차단되어야 함
      const provFalse = pv !== undefined && String(pv).toLowerCase() === "false";
      if (masterTrue && provFalse && r.allowed) {
        fails.push(`FAIL-OPEN: master=true, ${key}=${JSON.stringify(pv)} → allowed (세부 차단 무시!)`);
      }
    }
  }
}

console.log(`전수 조합: ${total}개 (${PROVIDERS.length} providers × ${MASTER_VALS.length} × ${PROV_VALS.length})`);
console.log(`allowed=true: ${allowCount}개`);
console.log(`fail-open 위반: ${fails.length}개`);
fails.forEach(f => console.log("  ❌", f));

// 핵심 시나리오 명시 검증
const scenarios = [
  ["미설정(기본)", {}, "openai-generate", false],
  ["마스터만 true", {PAID_API_ENABLED:"true"}, "openai-generate", true],
  ["마스터 true + 세부 false", {PAID_API_ENABLED:"true", ALLOW_OPENAI_GENERATE:"false"}, "openai-generate", false],
  ["마스터 false + 세부 true", {PAID_API_ENABLED:"false", ALLOW_OPENAI_GENERATE:"true"}, "openai-generate", false],
  ["마스터 오타(TRUE)", {PAID_API_ENABLED:"TRUE"}, "imagen", true],
  ["마스터 1(미허용)", {PAID_API_ENABLED:"1"}, "imagen", false],
];
console.log("\n핵심 시나리오:");
let sFail=0;
for (const [name, env, prov, expected] of scenarios) {
  const r = checkPaidApi(env, prov);
  const ok = r.allowed === expected;
  if(!ok) sFail++;
  console.log(`  ${ok?"✅":"❌"} ${name}: allowed=${r.allowed} (기대 ${expected})`);
}

const exit = fails.length>0 || sFail>0 ? 1 : 0;
console.log(`\n결과: fail-open ${fails.length}건, 시나리오 ${sFail}건 실패 → ${exit===0?"PASS 🎉":"FAIL"}`);
process.exit(exit);
