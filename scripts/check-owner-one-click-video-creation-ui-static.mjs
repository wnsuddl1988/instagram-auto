/**
 * check-owner-one-click-video-creation-ui-static.mjs
 *
 * 자동 쇼츠 만들기 위저드(/money-shorts)의 정적 가드.
 * task: owner-one-click-video-creation-ui-v1
 *
 * 이 가드는 no-live/no-execute다: 레포 내 소스 텍스트와 fixture 존재만 확인한다.
 * (network/env/secret 접근 없음, 스크립트 실행 없음)
 *
 * 검증 대상:
 *  - app/money-shorts/page.tsx — 위저드가 메인 흐름, 수동 입력은 "고급"으로 강등
 *  - components/VideoCreationWizard.tsx — 8단계 흐름 라벨 + 8개 카테고리 + 업로드 잠금
 *  - lib/owner-web-operator.ts — 위저드 action이 하드코딩 fixture/no-live 스크립트만 실행
 *  - app/api/money-shorts/operator/route.ts — 업로드/외부 API 경로 부재 유지
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const PAGE_PATH = path.join(ROOT, "app", "money-shorts", "page.tsx");
const WIZARD_PATH = path.join(ROOT, "components", "VideoCreationWizard.tsx");
const PANEL_PATH = path.join(ROOT, "components", "OperatorPanel.tsx");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const ROUTE_PATH = path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts");

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

/** 주석(라인/블록)을 제거해 실행 코드만 남긴다. 문자열 리터럴은 남는다. */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

// ── 파일 존재 ────────────────────────────────────────────────────────────────
check("page file exists", existsSync(PAGE_PATH));
check("wizard file exists (components/VideoCreationWizard.tsx)", existsSync(WIZARD_PATH));
check("helper file exists", existsSync(HELPER_PATH));
check("route file exists", existsSync(ROUTE_PATH));

const pageSrc = read(PAGE_PATH);
const wizardSrc = read(WIZARD_PATH);
const panelSrc = read(PANEL_PATH);
const helperSrc = read(HELPER_PATH);
const routeSrc = read(ROUTE_PATH);

const helperCode = stripComments(helperSrc);
const routeCode = stripComments(routeSrc);
const wizardCode = stripComments(wizardSrc);

// ── 메인 흐름: 위저드가 첫 화면의 중심 ───────────────────────────────────────
check(
  'page/wizard contains primary CTA "자동 쇼츠 만들기" (or 영상 만들기 시작)',
  wizardSrc.includes("자동 쇼츠 만들기") || pageSrc.includes("자동 쇼츠 만들기") || pageSrc.includes("영상 만들기 시작"),
);
check("page renders <VideoCreationWizard />", /<VideoCreationWizard\s*\/>/.test(pageSrc));
check("page renders wizard before OperatorPanel (wizard is primary)", pageSrc.indexOf("<VideoCreationWizard") !== -1 && pageSrc.indexOf("<VideoCreationWizard") < pageSrc.indexOf("<OperatorPanel"));

// ── 8단계 흐름 라벨 ──────────────────────────────────────────────────────────
for (const label of ["카테고리 선택", "주제 추천", "대본 만들기", "음성 만들기", "영상 만들기", "미리보기", "게시 전 점검", "실제 업로드"]) {
  check(`wizard contains flow label: ${label}`, wizardSrc.includes(label));
}

// ── 8개 카테고리 + 준비 중 표기 ──────────────────────────────────────────────
for (const cat of ["AI생성활용", "밈&짤", "충격뉴스", "TMI지식", "게임클립", "재테크팁", "귀여운동물", "셀럽엔터"]) {
  check(`wizard lists category: ${cat}`, wizardSrc.includes(cat));
}
check('wizard marks unready categories as "준비 중"', wizardSrc.includes("준비 중"));

// ── 첫 화면에 개발자 용어 금지 ───────────────────────────────────────────────
const initialUi = pageSrc + "\n" + wizardSrc;
for (const term of ["Fact Card", "authorManualFactCard", "sourceName", "currentValue", "validation error", "Validation Errors"]) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  check(`initial UI must not show dev term: ${term}`, !re.test(initialUi));
}

// ── 수동 입력 화면은 "고급"으로 강등 ─────────────────────────────────────────
check('page demotes manual input as "고급: 출처 직접 입력"', pageSrc.includes("고급: 출처 직접 입력"));
check("page labels manual input as expert-only", pageSrc.includes("숫자와 출처를 직접 넣는 전문가용 화면입니다."));

// ── 실제 업로드 잠금 ─────────────────────────────────────────────────────────
check(
  "wizard actual-upload button is disabled + aria-disabled",
  /disabled\s*\n?\s*aria-disabled="true"/.test(wizardSrc) || /<button[^>]*\bdisabled\b[\s\S]{0,200}aria-disabled="true"/.test(wizardSrc),
);
check("wizard actual-upload button has cursor-not-allowed", /cursor-not-allowed/.test(wizardSrc));
check("wizard states upload requires separate approval", wizardSrc.includes("실제 업로드는 별도 승인 후 활성화됩니다"));
check("panel still keeps its locked upload note", panelSrc.includes("실제 업로드는 별도 승인 후 활성화됩니다"));

// ── 배포/로컬 안내 ───────────────────────────────────────────────────────────
check("wizard shows production notice (로컬 실행 화면 안내)", wizardSrc.includes("실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다."));

// ── helper: 위저드 action 안전 계약 ──────────────────────────────────────────
check("helper declares wizard actions in OPERATOR_ACTIONS", ["topicRecommend", "scriptPreview", "voiceSample", "videoCreate", "previewStatus"].every((a) => helperSrc.includes(`"${a}"`)));
check("helper keeps FORBIDDEN_ARG_TOKENS (--arm/--live)", /FORBIDDEN_ARG_TOKENS[\s\S]{0,80}--arm/.test(helperCode) && /FORBIDDEN_ARG_TOKENS[\s\S]{0,120}--live/.test(helperCode));
{
  const armInArgs = /args\s*:\s*\[[^\]]*--arm/.test(helperCode) || /push\(\s*["']--arm["']/.test(helperCode) || /args\s*:\s*\[[^\]]*--live/.test(helperCode);
  check("helper never puts --arm/--live into any command args", !armInArgs);
}
check("helper wizard scripts are the known no-live local scripts", helperSrc.includes("scripts/build-local-mock-tts-audio-from-script.mjs") && helperSrc.includes("scripts/run-local-money-shorts-pipeline-dry-run.mjs"));
check("helper wizard out dirs are outside repo (C:\\tmp)", /WIZARD_VIDEO_OUT_ROOT\s*=\s*"C:\\\\tmp\\\\/.test(helperSrc) && /WIZARD_VOICE_OUT_DIR\s*=\s*"C:\\\\tmp\\\\/.test(helperSrc));
check("helper video streaming restricted to C:\\tmp\\money-shorts-os prefix", /WIZARD_VIDEO_ALLOWED_PREFIX\s*=\s*"C:\\\\tmp\\\\money-shorts-os\\\\"/.test(helperSrc));
check("helper video streaming restricted to .mp4", /endsWith\(["']\.mp4["']\)/.test(helperCode));
check("helper has no .env.local direct read", !/\.env\.local/.test(helperCode) && !/readFileSync\s*\([^)]*\.env/.test(helperCode));

// ── 회귀 방지: 선택 주제 → 영상 연결 (topic-linked render) ───────────────────
// wizard가 videoCreate/previewStatus에 topicId를 전달해야 한다.
check("wizard sends topicId on videoCreate", /postAction\(\s*["']videoCreate["']\s*,\s*\{\s*topicId/.test(wizardCode));
check("wizard sends topicId on previewStatus", /postAction\(\s*["']previewStatus["']\s*,\s*\{\s*topicId/.test(wizardCode));
// wizard가 대본 준비 안 된 주제의 영상 만들기를 막아야 한다.
check("wizard gates videoCreate on scriptReady", /disabled=\{[^}]*selectedTopic\?\.scriptReady/.test(wizardSrc) || /selectedTopic\?\.scriptReady/.test(wizardCode));
// 옛 고정 기준금리 문구/상수를 제거해야 한다.
check("wizard removed the fixed 기준금리 engine wording", !/영상 엔진은 기준금리/.test(wizardSrc));
check("wizard has no hardcoded VIDEO_READY_TOPIC_ID base-rate constant", !/VIDEO_READY_TOPIC_ID\s*=\s*["']base-rate/.test(wizardSrc));
// preview 영상 스트림에 topicId를 포함해야 한다.
check("wizard preview video src carries topicId", /video=muxed&topicId=/.test(wizardSrc));

// route/helper가 topicId를 검증/사용해야 한다.
check("route reads topicId for videoCreate/previewStatus", /\.topicId/.test(routeCode));
check("route fail-closes videoCreate without compiled script", /script_not_compiled_for_topic/.test(routeSrc) && /topic_id_invalid_or_empty/.test(routeSrc));
check("route passes topicId into interpret/status", /readWizardVideoStatus\(\s*topicId\s*\)/.test(routeCode));
check("route stream sanitizes topicId via helper (no raw client path)", /readWizardVideoBytes\(\s*videoParam\s*,\s*streamTopicId\s*\)/.test(routeCode));

// helper가 videoCreate에서 고정 provider fixture만 단독으로 쓰지 않아야 한다(회귀 핵심).
{
  // videoCreate 분기가 buildWizardVideoInputsForTopic로 topic-specific 입력을 만들어야 한다.
  const videoCreateUsesTopicBuilder =
    /case\s+"videoCreate"[\s\S]{0,400}buildWizardVideoInputsForTopic/.test(helperCode);
  check("helper videoCreate builds topic-specific inputs (not fixed provider fixture)", videoCreateUsesTopicBuilder);
  // videoCreate 분기가 옛 고정 render manifest fixture 경로를 직접 args로 쓰지 않아야 한다.
  const videoCreateUsesFixedManifest =
    /case\s+"videoCreate"[\s\S]{0,400}provider-candidate-render-manifest\.visual-only\.json/.test(helperCode);
  check("helper videoCreate does not hardcode provider/base-rate render manifest", !videoCreateUsesFixedManifest);
}
check("helper exposes buildWizardVideoInputsForTopic", /export function buildWizardVideoInputsForTopic/.test(helperSrc));
check("helper generates topic-specific inputs under repo-outside inputs dir", /WIZARD_INPUTS_ROOT\s*=\s*"C:\\\\tmp\\\\money-shorts-os\\\\web-wizard-create-v1\\\\inputs"/.test(helperSrc));
check("helper input builder writes render manifest with wizardTopicId", /wizardTopicId:\s*topicId/.test(helperCode));
check("helper reflects selected topic caption in generated manifest", /captionText:\s*sceneCaptions\[i\]/.test(helperCode));
check("helper upload metadata keeps notUploaded/ownerApprovalRequired", /notUploaded:\s*true/.test(helperCode) && /ownerApprovalRequired:\s*true/.test(helperCode));
check("helper generated owner approval keeps actualUploadAllowed:false", /actualUploadAllowed:\s*false/.test(helperCode));
check("helper safe topic slug restricts to [a-z0-9-]", /toSafeTopicSlug/.test(helperSrc) && /\[\^a-z0-9-\]/.test(helperCode));
check("helper video status reports artifact topicId/title from manifest", /wizardTopicId\?:\s*string/.test(helperSrc) && /topicId:\s*topicOfArtifact/.test(helperCode));

// ── 위저드가 소비하는 필수 fixture 존재(주제/대본 소스) ──────────────────────
for (const f of [
  "scripts/fixtures/topic_candidate_report.v1.json",
  "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
  "scripts/fixtures/provider-candidate-tts-script.local-mock.json",
]) {
  check(`wizard fixture exists: ${f}`, existsSync(path.join(ROOT, ...f.split("/"))));
}

// ── route: live/업로드 경로 부재 유지 ────────────────────────────────────────
check('route code has no "--arm"/"--live"', !/--arm/.test(routeCode) && !/--live/.test(routeCode));
check("route makes no fetch/axios/googleapis/graph API call", !/\bfetch\s*\(/.test(routeCode) && !/axios/.test(routeCode) && !/googleapis/.test(routeCode) && !/graph\.(facebook|instagram)\.com/.test(routeCode));
check("route does not import @vercel/blob", !/@vercel\/blob/.test(routeCode));
check("route performs no blob mutation (put/del/list/head/copy)", !/\b(put|del|list|head|copy)\s*\(/.test(routeCode));
check("route performs no ledger write", !/writePublishLedger|recordDualPlatformPublish/.test(routeCode));
check("route has no .env.local direct read", !/\.env\.local/.test(routeCode) && !/readFileSync\s*\([^)]*\.env/.test(routeCode));
check("route wizard actions are local-dev gated", /LOCAL_SCRIPT_ACTIONS[\s\S]{0,400}"videoCreate"/.test(routeSrc) && /LOCAL_SCRIPT_ACTIONS[\s\S]{0,400}"voiceSample"/.test(routeSrc));
check("route video stream input is enum only (no client path)", /videoParam\s*===\s*"muxed"\s*\|\|\s*videoParam\s*===\s*"silent"/.test(routeCode));

// ── wizard(client): 외부 API 직접 호출 부재 ──────────────────────────────────
check("wizard only calls the local operator API", !/https?:\/\//.test(wizardCode.replace(/\/api\/money-shorts\/operator/g, "")) || !/fetch\(\s*["']https?:/.test(wizardCode));
check("wizard has no upload/publish call words in code", !/instagramPublish|youtubeInsert|blobPut/.test(wizardCode));

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log(`${passes + failures} checks — ${passes} PASS, ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
