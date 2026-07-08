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
 *  - components/VideoCreationWizard.tsx — 8단계 흐름 + 8개 카테고리 전체 추천 + 확인 게이트형 업로드
 *  - lib/owner-web-operator.ts — 로컬 topic bank 생성 + 하드코딩 스크립트 + --arm 게이트(actualUpload 전용)
 *  - app/api/money-shorts/operator/route.ts — 서버 확인 게이트/allowArm 단일 지점/fail-closed 유지
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

// ── 8개 카테고리 — 전부 선택/추천 가능 ───────────────────────────────────────
for (const cat of ["AI생성활용", "밈&짤", "충격뉴스", "TMI지식", "게임클립", "재테크팁", "귀여운동물", "셀럽엔터"]) {
  check(`wizard lists category: ${cat}`, wizardSrc.includes(cat));
}
check("wizard no longer marks categories as 준비 중 (all selectable)", !wizardSrc.includes("준비 중"));

// ── 첫 화면에 개발자 용어 금지 ───────────────────────────────────────────────
const initialUi = pageSrc + "\n" + wizardSrc;
for (const term of ["Fact Card", "authorManualFactCard", "sourceName", "currentValue", "validation error", "Validation Errors"]) {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  check(`initial UI must not show dev term: ${term}`, !re.test(initialUi));
}

// ── 수동 입력 화면은 "고급"으로 강등 ─────────────────────────────────────────
check('page demotes manual input as "고급: 출처 직접 입력"', pageSrc.includes("고급: 출처 직접 입력"));
check("page labels manual input as expert-only", pageSrc.includes("숫자와 출처를 직접 넣는 전문가용 화면입니다."));

// ── 실제 업로드 — 확인 게이트 계약 (시안 영상 + 게시 전 점검 + 명시 확인) ─────
check("wizard upload warning present (누르면 실제 계정에 게시됩니다.)", wizardSrc.includes("누르면 실제 계정에 게시됩니다."));
check("wizard upload button label is 인스타그램·유튜브에 업로드", wizardSrc.includes("인스타그램·유튜브에 업로드"));
check("wizard requires typed confirm text 업로드", /confirmText\.trim\(\)\s*===\s*"업로드"/.test(wizardCode));
check(
  "wizard upload gate requires preflight + video + two checkboxes",
  /preflightDone[\s\S]{0,200}confirmReviewed[\s\S]{0,80}confirmPublish/.test(wizardCode) &&
    /videoDone\s*&&\s*preflightState\s*===\s*"success"/.test(wizardCode),
);
check("wizard upload button disabled unless uploadEnabled", /disabled=\{!uploadEnabled\}/.test(wizardSrc));
check("wizard sends confirm fields to actualUpload", /postAction\(\s*["']actualUpload["'][\s\S]{0,240}confirmReviewed[\s\S]{0,120}confirmPublish[\s\S]{0,120}confirmText/.test(wizardCode));
check("panel upload section defers to wizard confirm gate", panelSrc.includes("이 점검 화면에서는 업로드가 실행되지 않습니다"));

// ── 배포/로컬 안내 ───────────────────────────────────────────────────────────
check("wizard shows production notice (로컬 실행 화면 안내)", wizardSrc.includes("실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다."));

// ── helper: 위저드 action 안전 계약 ──────────────────────────────────────────
check("helper declares wizard actions in OPERATOR_ACTIONS", ["topicRecommend", "scriptPreview", "voiceSample", "videoCreate", "previewStatus", "wizardPreflight", "actualUpload"].every((a) => helperSrc.includes(`"${a}"`)));
check("helper keeps FORBIDDEN_ARG_TOKENS (--live)", /FORBIDDEN_ARG_TOKENS[\s\S]{0,120}--live/.test(helperCode));
{
  // raw "--arm"/"--live" 리터럴이 args 배열에 직접 들어가는 분기는 없어야 한다(--arm은 ARM_ARG_TOKEN 경유, actualUpload 전용).
  const armInArgs = /args\s*:\s*\[[^\]]*"--arm"/.test(helperCode) || /push\(\s*["']--arm["']/.test(helperCode) || /args\s*:\s*\[[^\]]*"--live"/.test(helperCode);
  check("helper never puts raw --arm/--live literals into command args", !armInArgs);
  check("helper --arm gate: runOperatorScript requires allowArm option", /arg\s*===\s*ARM_ARG_TOKEN\s*&&\s*opts\?\.allowArm\s*!==\s*true/.test(helperCode));
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

// ── 위저드가 소비하는 필수 fixture 존재(레거시 대본 소스) ─────────────────────
for (const f of [
  "scripts/fixtures/topic_candidate_report.v1.json",
  "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
]) {
  check(`wizard fixture exists: ${f}`, existsSync(path.join(ROOT, ...f.split("/"))));
}

// ── 새 주제 추천 계약: 로컬 topic bank + 클릭마다 새 묶음 ────────────────────
check("helper declares 8-category TOPIC_BANK", /const\s+TOPIC_BANK\s*:/.test(helperSrc) && ["finance:", "ai:", "meme:", "news:", "tmi:", "game:", "animal:", "celeb:"].every((k) => helperSrc.includes(k)));
{
  // bank 씨앗 수가 배치 크기보다 충분히 커야 반복 클릭에서 다른 묶음이 나온다.
  const seedCount = (helperSrc.match(/slug:\s*"/g) ?? []).length;
  check("topic bank has at least 60 seeds across categories", seedCount >= 60, `found ${seedCount}`);
  check("topic batch size is between 8 and 12", /WIZARD_TOPIC_BATCH_SIZE\s*=\s*(8|9|1[0-2])\b/.test(helperSrc));
}
check("helper shuffles bank per click (Fisher–Yates)", /Math\.random\(\)/.test(helperCode) && /generateWizardTopicBatch/.test(helperSrc));
check("generated topics are all scriptReady", /scriptReady:\s*true/.test(helperCode));
check("generated topic catalog persists outside repo (C:\\tmp)", /WIZARD_TOPIC_CATALOG_PATH\s*=\s*"C:\\\\tmp\\\\money-shorts-os\\\\/.test(helperSrc));
check("script builder exists for generated topics", /buildScriptFromGeneratedTopic/.test(helperSrc) && /readWizardGeneratedTopic/.test(helperSrc));
check(
  "topic bank avoids published/demo ids (t1/t2/base-rate)",
  !/t1_lifestyle_inflation/.test(JSON.stringify(helperSrc.match(/slug:\s*"[^"]+"/g) ?? [])) &&
    !/t2_salary_3days/.test(JSON.stringify(helperSrc.match(/slug:\s*"[^"]+"/g) ?? [])) &&
    !/slug:\s*"base-rate/.test(helperSrc),
);
check("wizard sends category on topicRecommend", /postAction\(\s*["']topicRecommend["']\s*,\s*\{\s*category/.test(wizardCode));
check("route validates category against WIZARD_CATEGORY_IDS enum", /WIZARD_CATEGORY_IDS[\s\S]{0,120}\.includes\(categoryRaw\)/.test(routeCode));
check("wizard resets downstream steps when topic changes", /resetDownstream/.test(wizardCode));
check("wizard offers refresh (다른 주제 보기)", wizardSrc.includes("다른 주제 보기"));

// ── 업로드 route 계약: 확인 게이트 + allowArm 단일 지점 + fail-closed ─────────
check("route requires server-side upload confirmation gate", /UPLOAD_CONFIRMATION_REQUIRED/.test(routeSrc) && /confirmText\s*!==\s*UPLOAD_CONFIRM_TEXT/.test(routeCode));
check('route confirm text constant is "업로드"', /UPLOAD_CONFIRM_TEXT\s*=\s*"업로드"/.test(routeSrc));
{
  const allowArmCount = (routeCode.match(/allowArm:\s*true/g) ?? []).length;
  const inActualUpload = /action\s*===\s*"actualUpload"[\s\S]{0,4000}allowArm:\s*true/.test(routeCode);
  check("route grants allowArm exactly once, inside actualUpload handler", allowArmCount === 1 && inActualUpload);
}
check("route gates wizardPreflight/actualUpload as local-only actions", /LOCAL_SCRIPT_ACTIONS[\s\S]{0,600}"wizardPreflight"/.test(routeSrc) && /LOCAL_SCRIPT_ACTIONS[\s\S]{0,600}"actualUpload"/.test(routeSrc));
check("route blocks duplicate publish in Korean", routeSrc.includes("이미 게시된 콘텐츠입니다"));
check("route explains missing upload keys in Korean", routeSrc.includes("업로드 키가 준비되지 않았습니다"));
check("route shows only public ids/urls on success (no secret identifiers)", /instagramMediaId/.test(routeSrc) && /youtubeUrl/.test(routeSrc) && !/accessToken|refresh_token|client_secret/i.test(routeCode));
check("upload uses extended timeout (>=300s)", /UPLOAD_TIMEOUT_MS\s*=\s*300_000/.test(routeSrc));
check("helper preflight evidence must match same content unit path", /contentUnitManifestPath\s*!==\s*resolve\(/.test(helperCode));

// ── noLive 의미 계약: arm runner 실행 후 응답은 live로 표시 (finding fix) ─────
// OperatorResponse.noLive 는 boolean 이어야 한다(항상 true 하드코딩 금지).
check("OperatorResponse.noLive is boolean (not literal true)", /noLive:\s*boolean/.test(routeSrc));
// arm runner 실행 이후 경로는 liveRunnerInvoked:true 로 표시해야 한다.
check("route marks live runner invocation with liveRunnerInvoked", /liveRunnerInvoked\?:\s*boolean/.test(routeSrc) && /liveRunnerInvoked:\s*true/.test(routeCode));
{
  // actualUpload 핸들러에서 arm 실행 이후 응답들은 noLive:false 여야 한다.
  const caseStart = routeCode.indexOf('action === "actualUpload"');
  const armPoint = caseStart === -1 ? -1 : routeCode.indexOf("allowArm: true", caseStart);
  const afterArm = armPoint === -1 ? "" : routeCode.slice(armPoint);
  // arm 이후 구간(성공/timeout/실패)에 noLive:false 가 최소 3회 나와야 한다.
  const noLiveFalseAfterArm = (afterArm.match(/noLive:\s*false/g) ?? []).length;
  check("route sets noLive:false on post-arm responses (success/timeout/failure)", noLiveFalseAfterArm >= 3);
}

// ── stale 잠금/승인 문구 부재 (finding fix) ──────────────────────────────────
// status raw 의 옛 "잠금 시절" 필드/문구가 없어야 한다.
check("route status raw has no stale actualUploadEnabled:false", !/actualUploadEnabled:\s*false/.test(routeCode));
check("route has no stale '별도 승인 후 활성화' active copy in status", !/actualUploadNote:[^\n]*별도 승인 후 활성화/.test(routeCode));

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
