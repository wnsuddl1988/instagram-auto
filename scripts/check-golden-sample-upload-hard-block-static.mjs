#!/usr/bin/env node
/**
 * check-golden-sample-upload-hard-block-static.mjs
 *
 * Golden Sample v3.2 Slice 0 — upload hard block 정적 가드.
 * - HTTP 서버/외부 API를 호출하지 않는다. 소스 검사 + pure helper 로컬 assertion만 수행.
 * - 실패 시 exit 1, 전부 통과 시 exit 0.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE = path.join(ROOT, "app", "api", "upload", "route.ts");
const HELPER = path.join(ROOT, "lib", "upload-hard-block.ts");
const POLICY = path.join(
  ROOT,
  "scripts",
  "fixtures",
  "golden_sample_v3_2_upload_hard_block_policy.v1.json"
);

let failures = 0;
function check(name, ok, detail) {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

const routeSrc = readFileSync(ROUTE, "utf8");
const helperSrc = readFileSync(HELPER, "utf8");

// 주석 안의 심볼 언급이 ordering 검사를 속이지 못하도록, 위치 기반 검사는
// 주석 제거본에서 수행한다 (route에는 문자열 내 주석 유사 토큰 없음 — 한계 명시).
const stripComments = (src) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
const routeCode = stripComments(routeSrc);

// ── 1. route: guard가 업로드 호출보다 먼저 실행되는가 (주석 제거본 기준) ──
const guardCallIdx = routeCode.indexOf("evaluateGoldenSampleUploadHardBlock(");
const igCallIdx = routeCode.indexOf("uploadInstagramReel({");
check(
  "route imports guard from @/lib/upload-hard-block",
  /import\s*\{[^}]*evaluateGoldenSampleUploadHardBlock[^}]*\}\s*from\s*"@\/lib\/upload-hard-block"/.test(
    routeSrc
  )
);
check("route calls guard", guardCallIdx !== -1);
check("route still contains legacy uploadInstagramReel call site", igCallIdx !== -1);
check(
  "guard call comes BEFORE uploadInstagramReel call",
  guardCallIdx !== -1 && igCallIdx !== -1 && guardCallIdx < igCallIdx,
  `guardIdx=${guardCallIdx} igIdx=${igCallIdx}`
);

// guard 이전에 req.json() 외의 await 호출(잠재적 side effect)이 없는지
const beforeGuard = routeCode.slice(0, guardCallIdx === -1 ? 0 : guardCallIdx);
check(
  "no awaited call other than req.json() before guard",
  !/await\s+(?!req\.json\b)/.test(beforeGuard)
);

// ── 2. route: blocked 응답이 403 + machine-readable인가 ──
const guardBlock = routeCode.slice(guardCallIdx === -1 ? 0 : guardCallIdx, igCallIdx === -1 ? routeCode.length : igCallIdx);
check("route checks guard.allowed !== true", guardBlock.includes("guard.allowed !== true"));
check("blocked response returns status 403", /status:\s*403/.test(guardBlock));
check("blocked response has success: false", /success:\s*false/.test(guardBlock));
check(
  "blocked response propagates guard.error / flags / blockerCodes",
  guardBlock.includes("guard.error") &&
    guardBlock.includes("guard.uploadReady") &&
    guardBlock.includes("guard.automationExpansionReady") &&
    guardBlock.includes("guard.blockerCodes")
);
check(
  "guard runs even on malformed body (json().catch)",
  /req\.json\(\)\.catch\(/.test(routeCode)
);

// ── 3. route: 클라이언트 body 플래그를 인가에 쓰지 않는가 (직접 접근 + 구조분해 모두) ──
check(
  "route never reads body.uploadReady / body.ownerApproved / body.automationExpansionReady",
  !/body\s*[.?]+\s*(uploadReady|ownerApproved|automationExpansionReady)/.test(routeCode) &&
    !/\{[^}]*(uploadReady|ownerApproved|automationExpansionReady)[^}]*\}\s*=\s*body/.test(routeCode)
);

// ── 4. helper: fail-closed + pure ──
check(
  "helper contains UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD",
  helperSrc.includes("UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD")
);
check("helper returns allowed: false", /allowed:\s*false/.test(helperSrc));
check("helper has NO allowed: true path", !/allowed:\s*true/.test(helperSrc));
check(
  "helper is dependency-free (no import/require)",
  !/^\s*import\s/m.test(helperSrc) && !/require\(/.test(helperSrc)
);
check(
  "helper reads no env / does no network / spawns nothing",
  !/process\.env|fetch\(|https?:\/\/api|child_process|spawn|exec\(/.test(helperSrc)
);
// 파라미터 식별자를 시그니처에서 추출해 검사 — 파라미터명 변경으로 검사를 우회할 수 없게 한다
const paramMatch = helperSrc.match(
  /export function evaluateGoldenSampleUploadHardBlock\(\s*([A-Za-z_$][\w$]*)\??\s*:/
);
check("helper signature has a single typed input parameter", Boolean(paramMatch));
if (paramMatch) {
  const param = paramMatch[1];
  const derefRe = new RegExp(`${param.replace(/\$/g, "\\$")}\\s*[.\\[(]`);
  check(
    `helper never dereferences its input "${param}" (client flags cannot flip result)`,
    !derefRe.test(stripComments(helperSrc))
  );
}
for (const code of [
  "upload_not_owner_approved",
  "upload_ready_false",
  "automation_expansion_not_approved",
  "server_side_upload_contract_missing",
]) {
  check(`helper blockerCodes include ${code}`, helperSrc.includes(`"${code}"`));
}

// ── 5. 금지 상태/secret 패턴 (신규/수정 파일) ──
const policySrc = readFileSync(POLICY, "utf8");
const forbidden = [
  /uploadReady["']?\s*[:=]\s*true/i,
  /automationExpansionReady["']?\s*[:=]\s*true/i,
  /implementationApproved["']?\s*[:=]\s*true/i,
  /renderReady["']?\s*[:=]\s*true/i,
  /sk-[A-Za-z0-9]{10,}/,
  /xi-api-key\s*[:=]/i,
  /AIza[A-Za-z0-9_-]{20,}/,
];
for (const [label, src] of [
  ["route.ts", routeSrc],
  ["upload-hard-block.ts", helperSrc],
  ["policy fixture", policySrc],
]) {
  const hit = forbidden.find((p) => p.test(src));
  check(`no forbidden state/secret pattern in ${label}`, !hit, hit ? String(hit) : "");
}

// ── 6. policy fixture parse + flags ──
let policy = null;
try {
  policy = JSON.parse(policySrc);
  check("policy fixture parses", true);
} catch (e) {
  check("policy fixture parses", false, String(e));
}
if (policy) {
  check(
    "policy flags: uploadReady=false, automationExpansionReady=false, uploadBlocked=true",
    policy.uploadReady === false &&
      policy.automationExpansionReady === false &&
      policy.uploadBlocked === true
  );
}

// ── 7. pure helper 로컬 assertion (HTTP/외부 API 없음; Node type-stripping 사용) ──
try {
  const mod = await import(new URL("../lib/upload-hard-block.ts", import.meta.url).href);
  const fn = mod.evaluateGoldenSampleUploadHardBlock;
  const adversarialInputs = [
    undefined,
    null,
    {},
    { uploadReady: true, automationExpansionReady: true, ownerApproved: true },
    { allowed: true },
    "uploadReady:true",
  ];
  let behavioralOk = true;
  const detail = [];
  for (const input of adversarialInputs) {
    const r = fn(input);
    const ok =
      r.allowed === false &&
      r.error === "UPLOAD_BLOCKED_BY_GOLDEN_SAMPLE_GUARD" &&
      r.uploadReady === false &&
      r.automationExpansionReady === false &&
      Array.isArray(r.blockerCodes) &&
      r.blockerCodes.length === 4;
    if (!ok) {
      behavioralOk = false;
      detail.push(JSON.stringify({ input, result: r }));
    }
  }
  check(
    "helper behavioral assertion: always blocked incl. adversarial client flags",
    behavioralOk,
    detail.join(" | ")
  );
} catch (e) {
  // 안전 가드의 최강 회귀 검출기이므로 fail-closed: import 실패도 FAIL로 처리한다.
  // (Node 23.6+ 기본 type-stripping 필요 — 이 레포 기준 Node 24)
  check(
    "helper behavioral assertion: always blocked incl. adversarial client flags",
    false,
    `runtime import failed: ${String(e).slice(0, 160)}`
  );
}

console.log(failures === 0 ? "\nRESULT: ALL PASS" : `\nRESULT: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
