/**
 * check-owner-web-operator-ui-static.mjs
 *
 * 웹 운영 콘솔(/money-shorts) + safe local control API의 정적 가드.
 * task: owner-web-operator-ui-local-control-v1
 *
 * 이 가드는 no-live/no-execute다: 레포 내 소스 텍스트만 읽는다.
 * (network/env/secret 접근 없음, Instagram/YouTube/Blob/OAuth 호출 없음, 스크립트 실행 없음)
 *
 * 검증 대상:
 *  - app/api/money-shorts/operator/route.ts
 *      · runtime="nodejs" + dynamic="force-dynamic"
 *      · 허용 action enum만 존재, `--arm`/live publish/임의 명령 없음
 *      · production/local 분기(LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV) 존재
 *      · Instagram/YouTube/Blob/ledger write 호출 없음
 *      · .env.local 직접 read 없음, secret-shaped 출력 없음
 *  - lib/owner-web-operator.ts
 *      · spawnSync + shell:false + process.execPath + args array + timeout + cwd
 *      · `--arm`/`--live` 금지 토큰 검사 존재, 스크립트 화이트리스트 하드코딩
 *      · child env는 승인된 6개 key만(broad spread 없음)
 *      · sanitize 함수 존재
 *  - components/OperatorPanel.tsx / app/money-shorts/page.tsx
 *      · 쉬운 한국어 버튼 문구 존재
 *      · 옛 어려운 문구 부재
 *      · 점검 패널은 실제 업로드를 실행하지 않고 위저드 확인 게이트로 안내만 함
 *      · production/local 안내 문구 존재
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const ROUTE_PATH = path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const PANEL_PATH = path.join(ROOT, "components", "OperatorPanel.tsx");
const PAGE_PATH = path.join(ROOT, "app", "money-shorts", "page.tsx");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) {
    passes += 1;
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

function read(p) {
  return existsSync(p) ? readFileSync(p, "utf8") : "";
}

/** 주석(라인/블록)을 제거해 "실행 코드"만 남긴다. 문자열 리터럴은 남는다. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ── 파일 존재 ────────────────────────────────────────────────────────────────
check("route file exists (app/api/money-shorts/operator/route.ts)", existsSync(ROUTE_PATH));
check("helper file exists (lib/owner-web-operator.ts)", existsSync(HELPER_PATH));
check("panel file exists (components/OperatorPanel.tsx)", existsSync(PANEL_PATH));
check("page file exists (app/money-shorts/page.tsx)", existsSync(PAGE_PATH));

const routeSrc = read(ROUTE_PATH);
const helperSrc = read(HELPER_PATH);
const panelSrc = read(PANEL_PATH);
const pageSrc = read(PAGE_PATH);

const routeCode = stripComments(routeSrc);
const helperCode = stripComments(helperSrc);
const panelCode = stripComments(panelSrc);

// ── API route: Next.js 런타임 계약 ───────────────────────────────────────────
check('route exports runtime = "nodejs"', /export\s+const\s+runtime\s*=\s*["']nodejs["']/.test(routeSrc));
check('route exports dynamic = "force-dynamic"', /export\s+const\s+dynamic\s*=\s*["']force-dynamic["']/.test(routeSrc));
check("route exports GET", /export\s+async\s+function\s+GET/.test(routeSrc));
check("route exports POST", /export\s+async\s+function\s+POST/.test(routeSrc));

// ── API route: action enum 강제 ──────────────────────────────────────────────
check("route validates action against OPERATOR_ACTIONS allowlist", /OPERATOR_ACTIONS\s*as\s*readonly\s*string\[\]\)\.includes\(/.test(routeCode) || /OPERATOR_ACTIONS[\s\S]{0,80}\.includes\(/.test(routeCode));
check("route rejects unsupported action", /UNSUPPORTED_ACTION/.test(routeSrc));
check("route has production/local split blocker", /LOCAL_AUTOMATION_REQUIRES_LOCAL_DEV|LOCAL_ONLY_BLOCKER/.test(routeSrc));
check("route calls isLocalDevRuntime()", /isLocalDevRuntime\(\)/.test(routeCode));

// ── API route: live 실행 경로 부재 ────────────────────────────────────────────
check('route code has no "--arm"', !/--arm/.test(routeCode));
check('route code has no "--live"', !/--live/.test(routeCode));
check("route code has no approval token literal", !/APPROVE_[A-Z_]+/.test(routeCode));
check("route makes no fetch/axios/googleapis/graph API call", !/\bfetch\s*\(/.test(routeCode) && !/axios/.test(routeCode) && !/googleapis/.test(routeCode) && !/graph\.(facebook|instagram)\.com/.test(routeCode));
check("route does not import @vercel/blob", !/@vercel\/blob/.test(routeCode));
check("route performs no blob mutation (put/del/list/head/copy)", !/\b(put|del|list|head|copy)\s*\(/.test(routeCode));
check("route performs no ledger write", !/writePublishLedger|recordDualPlatformPublish/.test(routeCode));
// route는 직접 프로세스를 띄우지 않고 helper에 위임한다.
// (RegExp.prototype.exec 같은 `.exec(` 호출은 child_process가 아니므로 제외한다.)
check("route does not import node:child_process", !/from\s+["']node:child_process["']/.test(routeCode) && !/require\(["']child_process["']\)/.test(routeCode));
check("route does not spawn directly (delegates to helper)", !/\bspawnSync\s*\(/.test(routeCode) && !/\bexecSync\s*\(/.test(routeCode) && !/(?<![.\w])exec\s*\(/.test(routeCode) && !/(?<![.\w])spawn\s*\(/.test(routeCode));
check("route has no shell:true", !/shell\s*:\s*true/.test(routeCode));
check("route runs no ffmpeg/ffprobe", !/ffmpeg|ffprobe/.test(routeCode));
check("route calls no content-generation API (openai/elevenlabs/pexels/supabase)", !/openai|elevenlabs|pexels|supabase/i.test(routeCode));

// ── API route: env/secret 안전 ───────────────────────────────────────────────
check("route has no .env.local direct read", !/readFileSync\s*\([^)]*\.env/.test(routeCode) && !/\.env\.local/.test(routeCode));
check("route has no masked/prefix/suffix/hash value identifiers", !/maskSecret|maskedValue|valuePrefix|valueSuffix|valueHash|tokenType/.test(routeCode));
check("route never indexes process.env with a dynamic/user value", !/process\.env\[(?!"|')/.test(routeCode));
check("route has no secret-shaped literal (EAA/ya29/vercel_blob_rw_/GOCSPX)", !/EAA[A-Za-z0-9]{8,}|ya29\.[A-Za-z0-9_-]{8,}|vercel_blob_rw_[A-Za-z0-9]{8,}|GOCSPX-[A-Za-z0-9]/.test(routeSrc));
check("route only reports credential presence booleans", /readCredentialPresence\(\)/.test(routeCode));

// ── helper: spawn 안전 계약 ──────────────────────────────────────────────────
check("helper uses spawnSync", /spawnSync\s*\(/.test(helperCode));
check("helper spawns process.execPath (no shell string)", /spawnSync\(\s*process\.execPath/.test(helperCode));
check("helper passes args as array", /spawnSync\(\s*process\.execPath\s*,\s*\[/.test(helperCode));
check("helper sets shell:false", /shell\s*:\s*false/.test(helperCode));
check("helper has no shell:true", !/shell\s*:\s*true/.test(helperCode));
check("helper sets a timeout", /timeout\s*:\s*/.test(helperCode));
check("helper sets cwd to repo root", /cwd\s*:\s*repoRoot/.test(helperCode));
check(
  "helper never uses exec/execSync/spawn with shell string",
  !/\bexecSync\s*\(/.test(helperCode) && !/(?<![.\w])exec\s*\(/.test(helperCode),
);

// ── helper: 명령 화이트리스트 / live 게이트 계약 ─────────────────────────────
check("helper hardcodes script whitelist", /SCRIPT_ENTRYPOINT|SCRIPT_ORCHESTRATOR|SCRIPT_FINAL_E2E/.test(helperCode));
check("helper declares FORBIDDEN_ARG_TOKENS containing --live", /FORBIDDEN_ARG_TOKENS[\s\S]{0,80}--live/.test(helperCode));
check("helper re-checks forbidden args before spawn", /for\s*\(const\s+forbidden\s+of\s+FORBIDDEN_ARG_TOKENS\)/.test(helperCode));
// ── --arm 게이트 계약: 실게시 인자는 actualUpload 분기 + allowArm 실행 옵션에서만 ──
{
  // "--arm" 리터럴은 ARM_ARG_TOKEN 선언 딱 한 곳에만 존재해야 한다.
  const armLiteralCount = (helperCode.match(/"--arm"/g) ?? []).length;
  check("helper has exactly one --arm literal (ARM_ARG_TOKEN declaration only)", armLiteralCount === 1);
  check("helper declares ARM_ARG_TOKEN constant", /const\s+ARM_ARG_TOKEN\s*=\s*"--arm"/.test(helperCode));
  // buildOperatorCommand args 배열에 raw "--arm" 리터럴을 직접 넣는 분기는 없어야 한다.
  const armInArgs = /args\s*:\s*\[[^\]]*"--arm"/.test(helperCode) || /push\(\s*["']--arm["']/.test(helperCode);
  check("helper never puts a raw --arm literal into command args", !armInArgs);
  // ARM_ARG_TOKEN이 args로 들어가는 곳(후행 콤마 = 인자 사용)은 정확히 1곳, actualUpload 분기 안이어야 한다.
  {
    const armUsageCount = (helperCode.match(/ARM_ARG_TOKEN,/g) ?? []).length;
    const caseStart = helperCode.indexOf('case "actualUpload"');
    const nextCase = caseStart === -1 ? -1 : helperCode.indexOf('case "', caseStart + 10);
    const caseBlock = caseStart === -1 ? "" : helperCode.slice(caseStart, nextCase === -1 ? undefined : nextCase);
    check(
      "helper attaches ARM_ARG_TOKEN only inside the actualUpload branch",
      armUsageCount === 1 && caseBlock.includes("ARM_ARG_TOKEN,"),
    );
  }
  // 실행 게이트: allowArm 옵션 없이 --arm이 오면 실행 자체를 거부해야 한다(이중 방어).
  check(
    "helper runOperatorScript blocks --arm unless allowArm option is true",
    /arg\s*===\s*ARM_ARG_TOKEN\s*&&\s*opts\?\.allowArm\s*!==\s*true/.test(helperCode),
  );
}
// 업로드 fail-closed 계약: 게시 전 점검 evidence 필수 + 이미 게시 콘텐츠 차단 + repo 밖 ledger.
check("helper actualUpload requires preflight evidence (fail-closed)", /preflight_evidence_missing/.test(helperCode));
check(
  "helper blocks already-published evidence content ids (t1/t2)",
  /BLOCKED_PUBLISHED_CONTENT_IDS/.test(helperCode) && /t1_lifestyle_inflation/.test(helperSrc) && /t2_salary_3days/.test(helperSrc),
);
check(
  "helper publish ledger path is a fixed repo-outside C:\\tmp path",
  /WIZARD_PUBLISH_LEDGER_PATH\s*=[\s\S]{0,40}"C:\\\\tmp\\\\money-shorts-os\\\\/.test(helperSrc),
);
check("helper does not import @vercel/blob / googleapis", !/@vercel\/blob/.test(helperCode) && !/googleapis/.test(helperCode));
// helper의 네트워크 경로는 Claude 주제 생성 + Claude 대본 보정 2곳뿐이다.
// 둘 다 fetchImpl 주입 + 고정 ANTHROPIC_API_URL만 사용한다. 직접 fetch(...) 호출은 여전히 금지.
check("helper makes no direct global fetch call (injectable fetchImpl only)", !/\bfetch\s*\(/.test(helperCode));
check(
  "helper network calls target fixed ANTHROPIC_API_URL only (topic + script)",
  (helperCode.match(/fetchImpl\s*\(\s*ANTHROPIC_API_URL\s*,/g) ?? []).length === 2 &&
    /ANTHROPIC_API_URL\s*=\s*"https:\/\/api\.anthropic\.com\/v1\/messages"/.test(helperCode),
);
check("helper does not import an Anthropic SDK", !/@anthropic-ai|from\s+["']anthropic["']/.test(helperCode));
check("helper never logs/prints the Anthropic api key", !/console\.\w+\([^)]*apiKey/.test(helperCode) && !/console\.\w+\([^)]*ANTHROPIC_API_KEY/.test(helperCode));
check(
  "helper does not invoke ffmpeg/ffprobe binaries directly",
  !/(?:spawnSync|execSync)\s*\([\s\S]{0,240}["']ff(?:mpeg|probe)["']/.test(helperCode),
);

// ── helper: env 안전 ─────────────────────────────────────────────────────────
check("helper declares APPROVED_ENV_KEY_NAMES", /APPROVED_ENV_KEY_NAMES/.test(helperCode));
for (const name of [
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
]) {
  check(`helper allowlists approved key: ${name}`, helperSrc.includes(name));
}
check("helper has no parent env broad spread into child", !/\{\s*\.\.\.process\.env/.test(helperCode));
check("helper has no Object.assign(..., process.env) bulk copy", !/Object\.assign\([^)]*process\.env/.test(helperCode));
check("helper has no .env.local direct read", !/\.env\.local/.test(helperCode) && !/readFileSync\s*\([^)]*\.env/.test(helperCode));
check("helper exposes sanitizeOutput", /export\s+function\s+sanitizeOutput/.test(helperSrc));
check("helper sanitize redacts EAA/ya29/vercel_blob_rw_", /EAA/.test(helperSrc) && /ya29/.test(helperSrc) && /vercel_blob_rw_/.test(helperSrc));
check("helper has no masked/prefix/suffix/hash value output identifiers", !/maskSecret|maskedValue|valuePrefix|valueSuffix|valueHash|tokenType/.test(helperCode));
check("helper validates operator paths (absolute, no dash prefix)", /must_be_absolute_path/.test(helperSrc) && /must_not_start_with_dash/.test(helperSrc));

// ── UI: 쉬운 한국어 문구 존재 ────────────────────────────────────────────────
const uiText = panelSrc + "\n" + pageSrc;
const REQUIRED_UI_PHRASES = [
  "상태 확인",
  "업로드 키 확인",
  "재업로드 차단 확인",
  "게시 전 점검",
  "새 쇼츠 만들기",
  "AI 쇼츠 자동화",
];
for (const phrase of REQUIRED_UI_PHRASES) {
  check(`UI contains plain-Korean phrase: ${phrase}`, uiText.includes(phrase));
}

// ── UI: 옛 어려운 문구 부재 ──────────────────────────────────────────────────
const FORBIDDEN_UI_PHRASES = [
  "Workflow Hub",
  "SOURCE FIRST",
  "LOCAL ONLY",
  "Fact Card Overview",
  "Package Preview",
  "Package Library",
  "Live Latest Draft Candidate",
];
for (const phrase of FORBIDDEN_UI_PHRASES) {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  check(`UI must not contain hard phrase: ${phrase}`, !re.test(uiText), "found in page/panel");
}

// ── UI: 점검 패널의 실제 업로드 섹션 — 실행 없음, 위저드 확인 게이트로 안내만 ──
check("panel upload section points to the wizard confirm gate", /자동 쇼츠 만들기[\s\S]{0,120}확인 절차/.test(panelSrc));
check("panel states it never executes upload itself", /이 점검 화면에서는 업로드가 실행되지 않습니다/.test(panelSrc));
check("panel never calls upload actions", !/actualUpload/.test(panelCode) && !/--arm/.test(panelCode) && !/"publish"/.test(panelCode));

// ── UI: production/local 안내 문구 ───────────────────────────────────────────
check(
  "UI contains production/local notice (pnpm dev 로컬 화면)",
  /실제 영상 생성과 게시 준비는 Owner PC에서 pnpm dev로 연 로컬 화면에서 실행합니다/.test(panelSrc),
);
check("UI notice states deployed site is for status check only", /배포 사이트는 상태 확인과 화면 검토용입니다/.test(panelSrc));
check("route returns local-only notice text", /배포 사이트에서는 상태 확인만 가능합니다/.test(routeSrc));

// ── UI: 결과 표시 계약 ───────────────────────────────────────────────────────
check("UI has all run states (idle/running/success/blocked/error)", /"idle"/.test(panelSrc) && /"running"/.test(panelSrc) && /"success"/.test(panelSrc) && /"blocked"/.test(panelSrc) && /"error"/.test(panelSrc));
check("UI hides raw JSON inside <details>", /<details/.test(panelSrc) && /JSON\.stringify/.test(panelSrc));
check("UI shows human summary before raw JSON", panelSrc.indexOf("result.summary") < panelSrc.indexOf("JSON.stringify"));
check("page renders OperatorPanel", /<OperatorPanel\s*\/>/.test(pageSrc));

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log(`${passes + failures} checks — ${passes} PASS, ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
