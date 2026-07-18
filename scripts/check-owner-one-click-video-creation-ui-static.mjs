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
 *  - components/VideoCreationWizard.tsx — 재테크 V1 흐름 + 확인 게이트형 업로드
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
const FINANCE_EDITORIAL_BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const FINANCE_EDITORIAL_SCRIPT_ENGINE_PATH = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
const ROUTE_PATH = path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts");
const ELEVENLABS_TTS_SCRIPT_PATH = path.join(ROOT, "scripts", "build-elevenlabs-korean-director-tts-from-script.mjs");
const ELEVENLABS_READONLY_PREFLIGHT_PATH = path.join(ROOT, "scripts", "audit-elevenlabs-readonly-preflight-v1.mjs");
const DYNAMIC_CAPTION_PATH = path.join(ROOT, "scripts", "_money-shorts-dynamic-captions.mjs");
const CHATGPT_IMAGE_CORE_PATH = path.join(ROOT, "scripts", "_chatgpt-image-core.mjs");
const CHATGPT_IMAGE_LIVE_PREFLIGHT_PATH = path.join(ROOT, "scripts", "check-chatgpt-image-live-preflight-once.mjs");

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
check("finance 500-title editorial bank exists", existsSync(FINANCE_EDITORIAL_BANK_PATH));
check("finance 500-title editorial script engine exists", existsSync(FINANCE_EDITORIAL_SCRIPT_ENGINE_PATH));
check("route file exists", existsSync(ROUTE_PATH));

const pageSrc = read(PAGE_PATH);
const wizardSrc = read(WIZARD_PATH);
const panelSrc = read(PANEL_PATH);
const helperSrc = read(HELPER_PATH);
const financeEditorialBankSrc = read(FINANCE_EDITORIAL_BANK_PATH);
const financeEditorialScriptEngineSrc = read(FINANCE_EDITORIAL_SCRIPT_ENGINE_PATH);
const routeSrc = read(ROUTE_PATH);
const ttsScriptSrc = read(ELEVENLABS_TTS_SCRIPT_PATH);
const elevenLabsReadonlyPreflightSrc = read(ELEVENLABS_READONLY_PREFLIGHT_PATH);
const dynamicCaptionSrc = read(DYNAMIC_CAPTION_PATH);
const chatgptImageCoreSrc = read(CHATGPT_IMAGE_CORE_PATH);
const chatgptImageCoreCode = stripComments(chatgptImageCoreSrc);
const chatgptImageLivePreflightSrc = read(CHATGPT_IMAGE_LIVE_PREFLIGHT_PATH);
const chatgptImageLivePreflightCode = stripComments(chatgptImageLivePreflightSrc);

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

// ── 11단계 흐름 라벨 (실제 미디어 + no-submit Flow 모션 준비 단계) ──────────
for (const label of [
  "카테고리 선택",
  "주제 추천",
  "대본 만들기",
  "실제 목소리 만들기",
  "장면 이미지 만들기",
  "Veo 모션 준비",
  "최종 영상 만들기",
  "미리보기",
  "게시 전 점검",
  "실제 업로드",
]) {
  check(`wizard contains flow label: ${label}`, wizardSrc.includes(label));
}

// ── 재테크 V1 active category — finance 하나만 선택/추천 가능 ───────────────
const activeCategoryBlock = wizardCode.match(/const CATEGORIES\s*=\s*\[([\s\S]*?)\]\s*as const;/);
const activeCategoryIds = activeCategoryBlock
  ? [...activeCategoryBlock[1].matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1])
  : [];
const activeCategoryLabels = activeCategoryBlock
  ? [...activeCategoryBlock[1].matchAll(/label:\s*"([^"]+)"/g)].map((match) => match[1])
  : [];
check(
  "wizard exposes finance as the only active category",
  JSON.stringify(activeCategoryIds) === JSON.stringify(["finance"]) &&
    JSON.stringify(activeCategoryLabels) === JSON.stringify(["재테크팁"]),
  JSON.stringify({ activeCategoryIds, activeCategoryLabels }),
);
check("wizard keeps no category preparation state", !wizardSrc.includes("준비 중"));

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
  "wizard upload gate requires media gate + preflight + three checkboxes",
  /mediaGateOk\s*&&[\s\S]{0,40}preflightDone[\s\S]{0,200}confirmReviewed[\s\S]{0,80}confirmDiscoveryReady[\s\S]{0,80}confirmPublish/.test(wizardCode) &&
    /mediaGateOk\s*&&\s*preflightState\s*===\s*"success"/.test(wizardCode),
);
check("wizard upload button disabled unless uploadEnabled", /disabled=\{!uploadEnabled\}/.test(wizardSrc));
check("wizard sends confirm fields to actualUpload", /postAction\(\s*["']actualUpload["'][\s\S]{0,280}confirmReviewed[\s\S]{0,120}confirmDiscoveryReady[\s\S]{0,120}confirmPublish[\s\S]{0,120}confirmText/.test(wizardCode));
check("panel upload section defers to wizard confirm gate", panelSrc.includes("이 점검 화면에서는 업로드가 실행되지 않습니다"));

// ── 배포/로컬 안내 ───────────────────────────────────────────────────────────
check("wizard shows production notice (로컬 실행 화면 안내)", wizardSrc.includes("실제 생성은 Owner PC에서 로컬 실행 화면으로 진행합니다."));

// ── helper: 위저드 action 안전 계약 ──────────────────────────────────────────
check("helper declares wizard actions in OPERATOR_ACTIONS", ["topicRecommend", "scriptPreview", "voiceSample", "videoCreate", "previewStatus", "flowMotionPrepare", "wizardPreflight", "actualUpload"].every((a) => helperSrc.includes(`"${a}"`)));
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
check("final preview recovers only a verified topic-local final MP4 after server restart", /readWizardFinalPreviewMp4Path/.test(helperCode) && /summary\.topicId\s*===\s*topicId/.test(helperCode) && /videoDir/.test(helperCode) && /entry\.name\.startsWith\("final-"\)/.test(helperCode));
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
check(
  "route stream sanitizes topicId/part and hash-binds final bytes via helper (no raw client path)",
  /readWizardVideoBytes\(\s*videoParam\s*,\s*streamTopicId\s*,\s*url\.searchParams\.get\("part"\)\s*,\s*videoParam === "final"[\s\S]{0,120}url\.searchParams\.get\("sha256"\)/.test(routeCode),
);

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

// ── 재테크 V1 주제 추천 계약 ────────────────────────────────────────────────
check(
  "helper exposes finance as the only active wizard category",
  /export const WIZARD_CATEGORY_IDS\s*=\s*\["finance"\]\s*as const/.test(helperCode),
);
{
  check("topic batch size is between 8 and 12", /WIZARD_TOPIC_BATCH_SIZE\s*=\s*(8|9|1[0-2])\b/.test(helperSrc));
}
check("helper shuffles bank per click (Fisher–Yates)", /Math\.random\(\)/.test(helperCode) && /generateWizardTopicBatch/.test(helperSrc));
check("helper defines Claude topic generation path", /generateClaudeTopicSeeds/.test(helperSrc) && /CLAUDE_TOPIC_SYSTEM_PROMPT/.test(helperSrc));
check("helper imports the new 500-title editorial bank", /finance-editorial-topic-bank/.test(helperCode) && /FINANCE_EDITORIAL_TOPIC_BANK/.test(helperCode));
check("old 324 and temporary 60 engines are absent", !/finance-curiosity-topic-engine|finance-editorial-calibration-bank/.test(helperCode));
check("smart topic batch uses the 500-title bank before Claude expansion", /generateFinanceEditorialBankBatch/.test(helperCode) && /if \(editorialBatch && editorialBatch\.topics\.length > 0\) return editorialBatch/.test(helperCode));
check("one recommendation batch draws from all nine editorial lanes", /for \(const lane of shuffleWizardItems\(FINANCE_EDITORIAL_LANES\)\)/.test(helperCode) && /editorialLane === lane/.test(helperCode));
check("500-bank recent history is versioned", /finance:editorial_bank_v2/.test(helperCode));
check("used and rated finance titles are excluded", /usedOnly:\s*true/.test(helperCode) && /usedTitles\.has/.test(helperCode) && /ratedIds\.has/.test(helperCode));
check("editorial decisions persist outside repo", /wizard-topic-editorial-preferences\.json/.test(helperSrc) && /saveWizardTopicEditorialDecision/.test(helperCode));
check("Claude expansion receives Owner approved and rejected examples", /ownerApprovedPackages:\s*preferredEditorialPackages/.test(helperCode) && /ownerRejectedTitles:\s*rejectedEditorialTitles/.test(helperCode));
check("script creation requires Owner make decision", /canWizardTopicEnterScript/.test(helperCode) && /TOPIC_EDITORIAL_APPROVAL_REQUIRED/.test(routeCode));check("AI-tone filter does not mistake 아니다 for a polite 니다 ending", /\(\?<!아\)니다/.test(helperCode));
check("editorial bank prioritizes one fresh title per lane", /const lanePool/.test(helperCode) && /shuffleWizardItems\(lanePool\)/.test(helperCode) && /editorialLane === lane/.test(helperCode));
check("finance exhaustion never recycles the local bank after Claude failure", /if \(category === "finance"\) return null/.test(helperCode) && /const localBatch = generateWizardTopicBatch/.test(helperCode));
check("local topic judge recognizes all money-economy domains", ["경제", "뉴스", "금리", "물가", "환율", "집값", "주거비", "불황", "생존비", "노후", "복리"].every((word) => helperSrc.includes(`"${word}"`)));
check("Claude expansion requests 24 candidates before strict local filtering", /CLAUDE_TOPIC_CANDIDATE_COUNT\s*=\s*24/.test(helperCode) && /makeCount:\s*CLAUDE_TOPIC_CANDIDATE_COUNT/.test(helperCode));
check("Claude expansion has a bounded 18-second request", /CLAUDE_TOPIC_TIMEOUT_MS\s*=\s*18_000/.test(helperCode) && /CLAUDE_TOPIC_MAX_TOKENS\s*=\s*5000/.test(helperCode));
check("Claude topic generation sends a bounded known-title list", /CLAUDE_TOPIC_KNOWN_TITLE_LIMIT\s*=\s*90/.test(helperCode) && /slice\(-CLAUDE_TOPIC_KNOWN_TITLE_LIMIT\)/.test(helperCode));
check("Claude expansion avoids previously shown and generated titles", /allKnownTopicTitlesForCategory\(category,\s*\{[\s\S]{0,180}usedOnly:\s*false[\s\S]{0,180}includeCatalog:\s*true[\s\S]{0,180}includeBank:\s*false[\s\S]{0,180}includeShownHistory:\s*true/.test(helperCode));
check("Claude expansion requires nine 90-point topics", /CLAUDE_TOPIC_MIN_DISPLAY_COUNT\s*=\s*9/.test(helperCode) && /CLAUDE_TOPIC_MIN_RECOMMEND_COUNT\s*=\s*9/.test(helperCode) && /picked\.length < CLAUDE_TOPIC_MIN_DISPLAY_COUNT/.test(helperCode) && /recommendedCount < CLAUDE_TOPIC_MIN_RECOMMEND_COUNT/.test(helperCode));
check("Claude expansion uses one bounded attempt", /CLAUDE_TOPIC_MAX_ATTEMPTS\s*=\s*1/.test(helperCode) && /for \(let attempt = 1; attempt <= CLAUDE_TOPIC_MAX_ATTEMPTS/.test(helperCode));
check("Claude topic generation uses same fixed Anthropic URL", /fetchImpl\s*\(\s*ANTHROPIC_API_URL\s*,/.test(helperCode));
check("topic generation has local fallback with reason", /generateWizardTopicBatchSmart/.test(helperSrc) && /const localBatch = generateWizardTopicBatch\(category,\s*fallbackReason,\s*financeSubtopic\)/.test(helperCode));
check("topic history persists seen/selected/video-created titles outside repo", /wizard-topic-history\.json/.test(helperSrc) && /markWizardTopicHistory/.test(helperCode));
check("topic novelty filter checks exact and similar titles", /findDuplicateTopicReason/.test(helperCode) && /titleSimilarity/.test(helperCode) && /similar_title/.test(helperSrc));
check("format topics block used exact titles and Claude expansion blocks similar shown titles", /source === "claude_generated"[\s\S]{0,220}allowSimilar:\s*true[\s\S]{0,220}includeShownHistory:\s*true/.test(helperCode) && /allowSimilar:\s*false,\s*usedOnly:\s*true/.test(helperCode));
check("finance Claude expansion cannot use the weak soft-rescue path", /source === "claude_generated" && !strict && judgment\.overallScore >= 58/.test(helperCode) && /const displayFloor = strict \? CLAUDE_TOPIC_RECOMMEND_SCORE : 70/.test(helperCode));
check("route awaits smart topic batch", /await\s+generateWizardTopicBatchSmart\(category/.test(routeCode));
check(
  "route enables bounded Claude expansion after the 500-title bank",
  /generateWizardTopicBatchSmart\(category,\s*\{\s*allowClaude:\s*true,\s*financeSubtopic\s*\}\)/.test(routeCode),
);
check("route exposes topic batch source/generation note", /source:\s*batch\.source/.test(routeCode) && /generationNote:\s*batch\.generationNote/.test(routeCode));
check("route exposes rejected topic reasons only inside raw diagnostics", /rejectedTopics:\s*batch\.rejected/.test(routeCode));
check("route validates and passes financeSubtopic into topic recommendation", /WIZARD_FINANCE_SUBTOPIC_IDS/.test(routeSrc) && /financeSubtopicRaw/.test(routeCode) && /generateWizardTopicBatchSmart\(category,\s*\{[\s\S]{0,120}financeSubtopic/.test(routeCode));
check("route explains 500-bank topic batches in plain Korean", routeSrc.includes("새 500개 주제은행"));
check("route exposes Claude topic fallback reason", /fallbackReason:\s*batch\.fallbackReason/.test(routeCode) && /fallbackReasonText:\s*batch\.fallbackReason\s*\?\s*describeTopicFallbackReason/.test(routeCode));
check("route explains missing Anthropic key restart path", routeSrc.includes("ANTHROPIC_API_KEY") && routeSrc.includes("pnpm dev를 다시 시작"));
check("helper preserves Claude topic fallback reason", /let fallbackReason/.test(helperCode) && /fallbackReason\s*=\s*generated\.reason/.test(helperCode) && /claude_topics_below_recommendation_floor/.test(helperSrc));
check("route explains too-weak Claude topic batches instead of showing one weak paid topic", /claude_topics_below_recommendation_floor/.test(helperCode) && routeSrc.includes("추천급 주제가 충분하지 않아"));
check("helper distinguishes Claude topic JSON parse failure from network failure", /anthropic_topic_json_parse_failed/.test(helperSrc) && /anthropic_api_json_parse_failed/.test(helperSrc));
check("helper accepts array-only Claude topic JSON by wrapping as topics", /Array\.isArray\(parsed\)\s*\?\s*\{\s*topics:\s*parsed\s*\}/.test(helperCode));
check(
  "helper extracts balanced JSON object or array from fenced/prose Claude responses",
  /function extractBalancedJsonCandidate\(body:\s*string\)/.test(helperCode)
    && /const stack:\s*string\[\]\s*=\s*\[first === "\{" \? "\}" : "\]"\]/.test(helperCode)
    && /let inString = false/.test(helperCode)
    && /let escaped = false/.test(helperCode)
    && /t\.matchAll\(/.test(helperCode)
    && /extractBalancedJsonCandidate\(body\)/.test(helperCode)
);
check(
  "helper accepts alternate/nested Claude topic arrays and single topic objects",
  /function coerceClaudeTopicArray\(parsed:\s*unknown,\s*depth = 0\)/.test(helperCode)
    && /CLAUDE_TOPIC_ARRAY_KEYS/.test(helperCode)
    && /"recommendations"/.test(helperCode)
    && /"topicCandidates"/.test(helperCode)
    && /"주제목록"/.test(helperCode)
    && /hasClaudeTopicTitle\(o\)\)\s*return \[o\]/.test(helperCode)
    && /coerceClaudeTopicArray\(value,\s*depth \+ 1\)/.test(helperCode)
);
check("helper normalizes alternate Claude topic title/hook field names", /pickStringField\(o,\s*\["title", "topic", "headline", "subject", "name", "idea", "제목", "주제"\]\)/.test(helperCode) && /"core_hook", "hookLine", "opening", "firstLine"/.test(helperCode));
check("helper derives missing Claude topic internals instead of dropping usable titles", /function buildFallbackTopicParts/.test(helperCode) && /fallback\.points\[i\]/.test(helperCode) && /fallback\.empathy/.test(helperCode));
check("route distinguishes invalid Claude topic shape reasons", routeSrc.includes("주제 목록 배열을 찾지 못해") && routeSrc.includes("제목으로 쓸 수 있는 주제가 없어"));
check("route explains Claude topic parse failure separately", routeSrc.includes("객체/배열 JSON 본문을 더 유연하게") && /anthropic_topic_json_parse_failed/.test(routeCode));
check("route includes safe external error code for call failures", /anthropic_call_failed_/.test(helperCode) && /Claude 연결이 실패했습니다/.test(routeSrc));
check("wizard displays editorial decisions and AI/backup source badges", ["만든다", "애매", "버린다", "AI 신규", "백업"].every((label) => wizardSrc.includes(label)));
check("editorial candidates are not scriptReady before approval", /scriptReady:\s*false[\s\S]{0,500}requiresEditorialDecision:\s*true/.test(helperCode));
check("generated topic catalog persists outside repo (C:\\tmp)", /WIZARD_TOPIC_CATALOG_PATH\s*=\s*"C:\\\\tmp\\\\money-shorts-os\\\\/.test(helperSrc));
check("topic catalog has in-memory fallback when C:\\tmp json is temporarily locked", /WIZARD_TOPIC_MEMORY_CATALOG/.test(helperCode) && /Object\.assign\(WIZARD_TOPIC_MEMORY_CATALOG,\s*topics\)/.test(helperCode) && /return\s+true;\s*\}\s*\}\s*\}/.test(helperCode));
check("script builder exists for generated topics", /buildScriptFromGeneratedTopic/.test(helperSrc) && /readWizardGeneratedTopic/.test(helperSrc));
check(
  "topic bank avoids published/demo ids (t1/t2/base-rate)",
  !/t1_lifestyle_inflation/.test(JSON.stringify(helperSrc.match(/slug:\s*"[^"]+"/g) ?? [])) &&
    !/t2_salary_3days/.test(JSON.stringify(helperSrc.match(/slug:\s*"[^"]+"/g) ?? [])) &&
    !/slug:\s*"base-rate/.test(helperSrc),
);
check("wizard sends category on topicRecommend", /postAction\(\s*["']topicRecommend["']\s*,\s*\{\s*category/.test(wizardCode));
check(
  "wizard aborts a stuck topic recommendation and releases running state",
  /action\s*===\s*["']topicRecommend["']\s*\?\s*new AbortController\(\)/.test(wizardCode) &&
    /controller\.abort\(\),\s*25_000/.test(wizardCode) &&
    /error\.name\s*===\s*["']AbortError["']/.test(wizardCode),
);
check("wizard renders finance subtopic toggles", /FINANCE_SUBTOPICS/.test(wizardSrc) && wizardSrc.includes("경제뉴스·돈공부") && wizardSrc.includes("물가·생활비") && wizardSrc.includes("금리·빚") && wizardSrc.includes("시간·노후"));
check("wizard explains editorial package approval flow", wizardSrc.includes("제목·문제·반전·행동") && wizardSrc.includes("'만든다'로 고른 후보만 대본으로 넘어갑니다"));
check("wizard renders make maybe reject controls", ["만든다", "애매", "버린다"].every((label) => wizardSrc.includes(label)) && /runTopicPreference/.test(wizardCode));
check("wizard sends financeSubtopic on topicRecommend", /financeSubtopic:\s*category\s*===\s*"finance"\s*&&\s*financeSubtopic\s*!==\s*"all"\s*\?\s*financeSubtopic/.test(wizardCode));
check(
  "route rejects every non-finance category input",
  /categoryRaw\s*!==\s*undefined\s*&&\s*categoryRaw\s*!==\s*"finance"/.test(routeCode) &&
    /FINANCE_CATEGORY_ONLY/.test(routeSrc),
);
check("wizard resets downstream steps when topic changes", /resetDownstream/.test(wizardCode));
check("wizard offers refresh (다른 주제 보기)", wizardSrc.includes("다른 주제 보기"));

// ── 재테크 500개 편집 은행은 전용 정적 가드에서 수량·중복·분포·유사도를 검증한다. ──
check("finance bank exposes 12 subtopics", /FINANCE_EDITORIAL_SUBTOPIC_IDS/.test(financeEditorialBankSrc));
check("finance bank exposes nine editorial lanes", /FINANCE_EDITORIAL_LANES/.test(financeEditorialBankSrc));
check("finance bank carries title problem twist and action", ["title", "problemStatement", "twist", "takeawayAction"].every((field) => financeEditorialBankSrc.includes(field)));
check("finance legacy TOPIC_BANK is empty", /finance:\s*\[\],/.test(helperCode));
check("premium script builds plain 7-step parts", /function buildPlainScriptParts/.test(helperCode) && /situation/.test(helperCode) && /consequence/.test(helperCode) && /recommendation/.test(helperCode));
check("premium mindset line maps anchors to concrete actions (no raw successAnchor sentence)", /밤에는 결제하지 마/.test(helperCode) && /친구를 맞추기 전에/.test(helperCode) && /내 한도부터 정해/.test(helperCode) && !/먼저 \$\{rec\.successAnchor/.test(helperCode));
{
  const plainStart = helperCode.indexOf("function buildPlainScriptParts");
  const plainEnd = helperCode.indexOf("function assemblePremiumVoiceover", plainStart);
  const plainScriptSrc = plainStart !== -1 && plainEnd > plainStart ? helperCode.slice(plainStart, plainEnd) : "";
  const subscriptionTemplateIndex = plainScriptSrc.indexOf("/구독|정기 결제|자동결제/");
  const salaryTemplateIndex = plainScriptSrc.indexOf("/월급|자동이체|이체|입금|저축/");
  const rewardTemplateIndex = plainScriptSrc.indexOf("/보상소비|퇴근|힘든|위로|고생/");
  const nightTemplateIndex = plainScriptSrc.indexOf("/새벽|밤|폰|택배|장바구니/");
  check(
    "reward-spending template is evaluated before night-shopping template (보상소비 장바구니 오분류 방지)",
    rewardTemplateIndex !== -1 && nightTemplateIndex !== -1 && rewardTemplateIndex < nightTemplateIndex,
    `reward=${rewardTemplateIndex}, night=${nightTemplateIndex}`,
  );
  check(
    "small-payment template has concrete habit and consequence",
    /작은 결제라 넘긴 적 많지/.test(plainScriptSrc) &&
      /월말 잔고가 먼저 줄어/.test(plainScriptSrc) &&
      /만 원 이하 결제만 따로 세어 봐/.test(plainScriptSrc),
  );
  check(
    "subscription-specific template is evaluated before salary template (월급 먹는 구독 제목 방지)",
    subscriptionTemplateIndex !== -1 && salaryTemplateIndex !== -1 && subscriptionTemplateIndex < salaryTemplateIndex,
    `subscription=${subscriptionTemplateIndex}, salary=${salaryTemplateIndex}`,
  );
  const saleTemplateIndex = plainScriptSrc.indexOf("/세일|할인|쿠폰/");
  const billTemplateIndex = plainScriptSrc.indexOf("/고지서|카드값|잔고|빚|알림|비상금/");
  check(
    "specific spending templates are evaluated before salary template (월급 먹는 할인/잔고 제목 방지)",
    saleTemplateIndex !== -1 && billTemplateIndex !== -1 && salaryTemplateIndex !== -1 &&
      saleTemplateIndex < salaryTemplateIndex && billTemplateIndex < salaryTemplateIndex,
    `sale=${saleTemplateIndex}, bill=${billTemplateIndex}, salary=${salaryTemplateIndex}`,
  );
  const socialTemplateIndex = plainScriptSrc.indexOf("/친구|모임|선물|피드|하이라이트|체면|남 눈/");
  check(
    "specific templates are evaluated before broad night template (밤/폰/장바구니 오분류 방지)",
    [subscriptionTemplateIndex, saleTemplateIndex, billTemplateIndex, socialTemplateIndex].every((i) => i !== -1 && i < nightTemplateIndex),
    `subscription=${subscriptionTemplateIndex}, sale=${saleTemplateIndex}, bill=${billTemplateIndex}, social=${socialTemplateIndex}, night=${nightTemplateIndex}`,
  );
}
check("premium consequence fallback avoids broken Korean particle from moneyAnchor", !/\$\{rec\.moneyAnchor[^}]*\}이 새는/.test(helperCode) && /월말 잔고가 줄어드는 건/.test(helperCode));
{
  // 기본 조립은 hook→situation→consequence→psychology→mindset→habit→recommendation 순서다.
  const first3Ordered =
    /e\(hook\),\s*e\(situation\),\s*e\(consequence\),\s*e\(psychology\),\s*e\(mindset\),\s*e\(habit\),\s*e\(recommendation\)/.test(helperCode) &&
    /assemblePremiumVoiceover/.test(helperCode);
  check("premium script follows 7-step plain order", first3Ordered);
  // 질문형 브리지 "왜 그럴까요?"는 제거됐고, 비유 브리지 반복도 금지한다.
  check("premium voiceover has no repeated 질문형 브리지 (왜 그럴까요? 제거)", !helperCode.includes("왜 그럴까요?"));
  // Codex finding: 설명체 고정 브리지 "…있습니다."는 금지, 단정형 "…있다."로 대체돼야 한다.
  check(
    "premium bridge has no 설명체 고정문 (그런데 진짜 문제는 따로 있습니다.)",
    !helperCode.includes("그런데 진짜 문제는 따로 있습니다."),
  );
  const politeBridge =
    (helperCode.match(/그런데 진짜 문제는 따로 있습니다\./g) ?? []).length +
    (helperCode.match(/그래서 오늘 할 일은 하나입니다\./g) ?? []).length;
  check("premium voiceover has zero 설명체 고정 브리지", politeBridge === 0, `found ${politeBridge}`);
  const declBridge = (helperCode.match(/진짜 문제는 따로 있다\./g) ?? []).length;
  check("premium voiceover no longer depends on fixed metaphor bridge", declBridge === 0, `found ${declBridge}`);
}
{
  check(
    "500-title bank avoids polite explanatory endings",
    !/(합니다|됩니다|습니다|입니다)[.!?]?"/.test(financeEditorialBankSrc),
  );
}
{
  // 나열형(첫째/둘째/셋째)은 비프리미엄 fallback 문자열 1곳에만 존재해야 한다.
  const listicleCount = (helperCode.match(/첫째, \$\{p1\}/g) ?? []).length;
  check("listicle format confined to non-premium fallback (exactly 1)", listicleCount === 1, `found ${listicleCount}`);
  // 프리미엄 낭독문은 assemblePremiumVoiceover가 7단계 배열([e(hook), ...])을 줄바꿈 리듬으로 조립한다.
  check("premium voiceover built from short-line array (assemblePremiumVoiceover)", /const e = normalizeNarrationBlock/.test(helperCode) && /\[e\(hook\)/.test(helperCode) && /\.join\("\\n"\)/.test(helperCode));
  check(
    "premium voiceover matches owner short-line tone",
    /rec\.hook/.test(helperCode) &&
      /rec\.title/.test(helperCode) &&
      /p1/.test(helperCode) &&
      /p2/.test(helperCode) &&
      /p3/.test(helperCode) &&
      !/경제 뉴스 어렵다고 넘기는 사람 많지/.test(helperCode),
  );
  check(
    "economy-literacy scripts branch by all nine economic mechanisms instead of one news template",
    [
      "rate-transmission",
      "inflation-vs-wallet",
      "exchange-pass-through",
      "growth-vs-income",
      "inflation-slowdown",
      "policy-to-household",
      "recession-early-signal",
      "jobs-signal",
      "news-translation",
    ].every((mechanism) => helperSrc.includes(`\"${mechanism}\"`)) &&
      /buildEconomyLiteracyScriptParts/.test(helperCode),
  );
  check(
    "all 500 finance titles enter the title-and-mechanism script engine before legacy keyword templates",
    (() => {
      const plainStart = helperCode.indexOf("function buildPlainScriptParts");
      const activeEngine = helperCode.indexOf("const curiositySpecific = buildCuriosityTopicSpecificScriptParts(rec)", plainStart);
      const legacyEconomyTemplate = helperCode.indexOf("if (/경제\\s*뉴스", plainStart);
      return /function buildCuriosityTopicSpecificScriptParts/.test(helperCode) &&
        /rec\.category !== "finance" \|\| !rec\.curiosityMechanismId \|\| !rec\.financeSubtopic/.test(helperCode) &&
        plainStart >= 0 && activeEngine > plainStart && legacyEconomyTemplate > activeEngine;
    })(),
  );
  check(
    "title-and-mechanism script engine has a distinct bridge for every finance subtopic",
    [
      "economy_literacy",
      "inflation_living_cost",
      "interest_debt",
      "consumption_psychology",
      "sns_comparison",
      "labor_income",
      "investing_assets",
      "housing_asset_gap",
      "anxiety_avoidance",
      "success_habits",
      "crisis_risk",
      "time_retirement",
    ].every((subtopic) => new RegExp(`${subtopic}:`).test(helperCode)),
  );
  check(
    "new topic-script engine invalidates old final-script cache and old TTS summary",
    /WIZARD_SCRIPT_ENGINE_VERSION/.test(helperCode) &&
      /wizardScriptFingerprint:\s*part\.record\.localFingerprint/.test(helperCode) &&
      /ttsSummary\.wizardScriptFingerprint\s*===\s*part\.record\.localFingerprint/.test(helperCode) &&
      /wizardScriptFingerprint/.test(ttsScriptSrc),
  );
  check(
    "all bank, legacy and post-500 finance topics use the shared script engine before generic package copy",
    /from "\.\/finance-editorial-script-engine"/.test(helperCode) &&
      /function resolveFinanceEditorialTopic/.test(helperCode) &&
      /const editorialTopic = resolveFinanceEditorialTopic\(rec\)/.test(helperCode) &&
      /buildFinanceEditorialScriptParts\(editorialTopic\)/.test(helperCode) &&
      helperCode.indexOf("const editorialTopic = resolveFinanceEditorialTopic(rec)") < helperCode.indexOf("if (rec.problemStatement && rec.twist && rec.takeawayAction)"),
  );
  check(
    "500-title script engine combines twelve domains, semantic overrides and nine editorial lanes",
    /const BASE_PROFILES/.test(financeEditorialScriptEngineSrc) &&
      /const PROFILE_OVERRIDES/.test(financeEditorialScriptEngineSrc) &&
      /const LANE_GUIDANCE/.test(financeEditorialScriptEngineSrc) &&
      /const DOMAIN_FOLLOW/.test(financeEditorialScriptEngineSrc) &&
      /buildFinanceEditorialScriptParts/.test(financeEditorialScriptEngineSrc),
  );
  check(
    "all finance scripts expose their generated action and upload copy instead of old bank CTA",
    /const usesEditorialScriptEngine = rec\.category === "finance" && Boolean\(rec\.financeSubtopic\)/.test(helperCode) &&
      /const action = usesEditorialScriptEngine \? parts\.recommendation : rec\.save/.test(helperCode) &&
      /uploadCaptionDraft: usesEditorialScriptEngine/.test(helperCode),
  );
  check(
    "temporary per-topic calibration exceptions are removed after global expansion",
    !/WIZARD_SCRIPT_CALIBRATION_TOPIC_ID|buildCalibrationTopicScriptParts|isWizardScriptCalibrationTopic/.test(helperCode),
  );
  check("Veo scene selection bumps final-script cache contract to v14", /money_shorts_editorial_package_script_v14/.test(helperCode));
  check("final-script fingerprint includes the semantic video strategy", /s:\s*preview\.videoStrategy/.test(helperCode));
  check("premium polish rejects soft polite tone", /SHORTFORM_SOFT_POLITE_PATTERNS/.test(helperCode) && /soft_polite_not_owner_tone/.test(helperCode));
}

// ── 골든 샘플급 대본 구조: 장면 플랜 + 확장 필드 (task: golden-sample-script-and-light-ui) ──
check("helper exposes 7-step scene plan (buildScenePlan + scenes field)", /buildScenePlan/.test(helperSrc) && /scenes:\s*WizardScriptScene\[\]/.test(helperSrc));
for (const sceneId of ['"hook"', '"problem"', '"situation"', '"consequence"', '"psychology"', '"mindset"', '"habit"', '"save"']) {
  check(`scene plan has stage id ${sceneId}`, helperSrc.includes(`id: ${sceneId}`));
}
check(
  "scene plan keeps success standard and save CTA in one closing flow even when split into multiple visual beats",
  /const closing = block\(lines\(a\.recommendation\)/.test(helperCode) &&
    /id:\s*"save",\s*label:\s*"성공 기준\/저장",\s*narration:\s*closing/.test(helperCode) &&
    /splitNarrationByVisualFlow\(stage\.narration,\s*stage\.id\)/.test(helperCode),
);
check("scene plan carries visualCue (장면성/시각 증거)", /visualCue:/.test(helperSrc));
check(
  "scene plan uses bright integrated lived-in 3D visual DNA, not dark collage or photo cues",
  /type\s+WizardVisualDna/.test(helperSrc) &&
    /WIZARD_VISUAL_OBJECT_POOLS/.test(helperSrc) &&
    /buildWizardVisualDna/.test(helperSrc) &&
    /buildEditorialVisualCue/.test(helperSrc) &&
    /Bright integrated family-feature-quality cinematic 3D animation/.test(helperSrc) &&
    /one Korean adult naturally using the relevant object/.test(helperSrc) &&
    /captions and titles are added later by the renderer/.test(helperSrc) &&
    !/low-angle 3D object diorama shot|boxed-in tunnel composition|faceless stylized person|Premium human-scale 3D editorial/.test(helperSrc),
);
check(
  "scene visual DNA rotates object palette, composition, camera, and accent",
  /objectSet:\s*pickVisual\(seed,\s*"object-set"/.test(helperCode) &&
    /composition:\s*pickVisual\(seed,\s*"composition"/.test(helperCode) &&
    /camera:\s*pickVisual\(seed,\s*"camera"/.test(helperCode) &&
    /accent:\s*pickVisual\(seed,\s*"accent"/.test(helperCode),
);
for (const field of ["hookLine", "captionFirstLineHook", "uploadCaptionDraft", "goldenSampleChecks"]) {
  check(`script preview exposes ${field}`, helperSrc.includes(`${field}:`));
}

// ── 대본 결과 UI: 실제 대본/자막/장면계획/설명글 구분 라벨 노출 ────────────────
for (const label of [
  "확정 대본",
  "첫 3초 훅",
  "영상에 들어갈 자막",
  "장면 그림 계획",
  "SNS 설명글 초안",
]) {
  check(`wizard script UI shows section: ${label}`, wizardSrc.includes(label));
}
check("wizard shows the paid-TTS cover hook pass/block result before generation", wizardSrc.includes("후킹 검증 통과 · 유료 음성 진행 가능") && wizardSrc.includes("후킹 검증 실패 · 유료 음성 차단"));
// 확정 대본의 내용/순서를 실제 음성/최종 영상이 쓰되, 음성 단계의 낭독 연기만 별도 보정됨을 알린다.
check("wizard clarifies confirmed script content is used with delivery-only voice direction", wizardSrc.includes("문장 내용과 순서는 그대로 사용하고") && wizardSrc.includes("장면에 맞는 억양·강조·호흡을 자동으로 보정합니다"));
check("wizard clarifies SNS 설명글 is not the 대본", wizardSrc.includes("영상이 읽는 대본과는 다릅니다"));
check("wizard renders dynamic caption lines (script.captionLines map)", /script\.captionLines\.length/.test(wizardCode) && /script\.captionLines/.test(wizardCode));
check("wizard renders scene plan rows (script.scenes map)", /script\.scenes/.test(wizardCode) && /visualCue/.test(wizardCode));
check(
  "wizard uses a unique render key when one narrative role spans multiple scenes",
  /script\.scenes\.map\(\(s,\s*sceneIndex\)\s*=>[\s\S]{0,180}key=\{`\$\{sceneIndex\}-\$\{s\.id\}`\}/.test(wizardCode) &&
    !/script\.scenes\.map\(\(s\)\s*=>[\s\S]{0,180}key=\{s\.id\}/.test(wizardCode),
);

// ── light 운영 UI 계약: 흰 배경 + 큰 글자, dark 테마 잔재 금지 ────────────────
check("page uses light background (bg-slate-50)", /bg-slate-50/.test(pageSrc));
check("wizard cards are white (bg-white)", /bg-white/.test(wizardSrc) && /bg-white/.test(panelSrc));
check("main UI has no dark background remnants (bg-slate-900/950)", !/bg-slate-9\d\d/.test(wizardSrc) && !/bg-slate-9\d\d/.test(panelSrc) && !/bg-slate-9\d\d/.test(pageSrc));
check("main UI body text is ≥14px (text-[15px]/text-base 사용, 11px 잔재 없음)", /text-\[15px\]|text-base/.test(wizardSrc) && !/text-\[11px\]|text-\[10px\]/.test(wizardSrc) && !/text-\[11px\]|text-\[10px\]/.test(panelSrc));

// UI 문구: 개발자 용어 비노출 + 재테크팁 톤 노출
check('user copy has no dev term "로컬 주제 은행"', !routeSrc.includes("로컬 주제 은행") && !wizardSrc.includes("로컬 주제 은행"));
check("route topicRecommend copy is easy Korean (새 주제 N개를 만들었습니다)", routeSrc.includes("개를 만들었습니다"));
check("wizard finance tone shows 돈·성공·심리·생활습관", wizardSrc.includes("돈·성공·심리·생활습관"));
check("wizard shows topic structure line (t.reason)", /t\.reason/.test(wizardSrc));

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

// ── 로컬 품질 평가기(judge) + 재작성 pass (task: local-script-quality-judge-rewrite-engine) ──
// judge/rewrite 함수 존재
check("helper defines local quality judge (judgeTopicSeed)", /export function judgeTopicSeed\s*\(/.test(helperSrc));
check("helper defines local rewrite pass (rewriteWeakSeed)", /export function rewriteWeakSeed\s*\(/.test(helperSrc));
// 품질 판정 타입 필수 필드
for (const field of [
  "retentionScore",
  "selfRecognitionScore",
  "clarityScore",
  "visualizabilityScore",
  "antiAiToneScore",
  "specificityScore",
  "overallScore",
  "rejectReasons",
  "rewriteReasons",
  "passed",
]) {
  check(`quality judgment type exposes ${field}`, new RegExp(`${field}\\b`).test(helperSrc));
}
// topic recommendation이 judge를 통과한 후보만 상위로 — overfetch → judge → passed 필터 구조
check("topic batch judges candidates (judgeTopicSeed in batch)", /judgeTopicSeed\(/.test(helperCode) && /generateWizardTopicBatch/.test(helperCode));
check("topic batch overfetches before quality filter", /WIZARD_TOPIC_BATCH_SIZE\s*\*\s*2/.test(helperCode));
check("topic batch filters by passed judgment", /\.filter\(\s*\(?\w+\)?\s*=>\s*\w+\.judgment\.passed\s*\)/.test(helperCode) || /judgment\.passed/.test(helperCode));
check("topic batch keeps reject reasons for details", /rejected/.test(helperCode) && /rejectReasons/.test(helperCode));
check("weak candidates go through rewrite pass", /rewriteWeakSeed\(/.test(helperCode));
check("finance uses strict judging threshold", /category\s*===\s*["']finance["']/.test(helperCode) && /strict/.test(helperCode));
// scriptPreview: 3안 후보 → 최고점 선택
check("script builds 3 style candidates", /hook_heavy/.test(helperCode) && /reversal/.test(helperCode) && /empathy/.test(helperCode));
check("script preview exposes quality + candidateScores + selectedStyle", /quality:\s*judgment/.test(helperCode) && /candidateScores:/.test(helperCode) && /selectedStyle:/.test(helperCode));
check("script preview exposes qualitySummary (good/fixed/watch)", /goodReasons/.test(helperCode) && /fixedParts/.test(helperCode) && /watchOuts/.test(helperCode));
check(
  "finance script quality gate blocks weak drafts before persistence and rejects stale weak finals",
  /WIZARD_FINANCE_SCRIPT_QUALITY_FLOOR\s*=\s*86/.test(helperCode) &&
    /export function getWizardScriptQualityGate/.test(helperCode) &&
    /getWizardScriptQualityGate\(topicId, parsed\.script\)\.passed/.test(helperCode) &&
    /getWizardScriptQualityGate\(topicId, preview\)/.test(routeCode) &&
    /SCRIPT_QUALITY_GATE_FAILED/.test(routeCode) &&
    routeCode.search(/getWizardScriptQualityGate\(topicId, preview\)/) < routeCode.search(/ensureWizardFinalScript\(topicId,\s*preview/),
);
check(
  "finance production gate re-evaluates confirmed script content instead of trusting stored scores",
  /export function judgeFinanceScriptContent/.test(helperCode) &&
    /export function getWizardScriptQualityGate[\s\S]{0,1400}judgeFinanceScriptContent\(\{/.test(helperCode) &&
    /확정 제목이 첫 훅에 그대로 이어지지 않습니다/.test(helperCode) &&
    /상황별 다시 보기·저장·팔로우 마무리가 완전하지 않습니다/.test(helperCode),
);
check(
  "Claude-polished finance scripts use the same confirmed-content quality judge",
  /const polishedJudgment = judgeFinanceScriptContent\(\{[\s\S]{0,500}scenes/.test(helperCode) &&
    /실제 대본 품질 미달/.test(helperCode),
);
check(
  "wizard shows blocked drafts for review without treating them as final scripts",
  /if \(raw\?\.script\) setScript\(raw\.script\)/.test(wizardCode) &&
    /scriptState === "success" && script != null/.test(wizardCode) &&
    wizardSrc.includes("대본 검수본") &&
    wizardSrc.includes("품질 기준 미달"),
);
// helper(lib)에 외부 API/LLM 연결 부재 — import/require/클라이언트 인스턴스화/네트워크 호출만 금지
// (문자열 안내 문구에 "OpenAI" 단어가 들어가는 건 무해하므로 실행 경로만 검사)
check(
  "helper has no OpenAI/LLM SDK import or client",
  !/(import|require)[^;\n]*openai/i.test(helperCode) && !/new\s+OpenAI\s*\(/.test(helperCode),
);
check("helper makes no network call (fetch/axios/googleapis)", !/\bfetch\s*\(/.test(helperCode) && !/\baxios\b/.test(helperCode) && !/googleapis/.test(helperCode));
check("helper never reads .env.local directly", !/\.env\.local/.test(helperCode) && !/process\.env\.OPENAI/.test(helperCode));

// ── UI: 대본 품질 점수/좋은 이유/고친 부분/주의할 점 라벨 노출 ──────────────────
for (const label of ["대본 품질 점수", "좋은 이유", "고친 부분", "주의할 점"]) {
  check(`wizard shows quality label: ${label}`, wizardSrc.includes(label));
}
check("wizard shows topic quality badge (t.qualityScore)", /t\.qualityScore/.test(wizardCode));
check("wizard marks 90+ topics as 추천 and lower ones as 후보", /t\.qualityScore >= 90/.test(wizardCode) && wizardSrc.includes("추천") && wizardSrc.includes("후보"));
check("wizard renders quality summary from script.quality", /script\.quality/.test(wizardCode) && /qualitySummary/.test(wizardCode));

// ══════════════════════════════════════════════════════════════════════════════
// 실제 제작 파이프라인 (task: owner-web-real-script-voice-visual-generation-pipeline-v1)
// 이 블록은 정적 검사만 한다 — ElevenLabs/ChatGPT/Playwright/Anthropic 실제 호출은
// 여기서 절대 실행되지 않으며(no-run), 스크립트 자체의 fail-closed gate 존재를 검증한다.
// ══════════════════════════════════════════════════════════════════════════════

const imgScriptPath = path.join(ROOT, "scripts", "run-owner-real-scene-images-from-wizard-script-once.mjs");
const vidScriptPath = path.join(ROOT, "scripts", "run-owner-real-video-from-wizard-assets-once.mjs");
const motionHelperPath = path.join(ROOT, "scripts", "_money-shorts-layered-motion.mjs");
const flowMotionRenderInputPath = path.join(ROOT, "scripts", "_flow-motion-render-input.mjs");
const imgScriptSrc = existsSync(imgScriptPath) ? readFileSync(imgScriptPath, "utf8") : "";
const vidScriptSrc = existsSync(vidScriptPath) ? readFileSync(vidScriptPath, "utf8") : "";
const motionHelperSrc = existsSync(motionHelperPath) ? readFileSync(motionHelperPath, "utf8") : "";
const flowMotionRenderInputSrc = existsSync(flowMotionRenderInputPath) ? readFileSync(flowMotionRenderInputPath, "utf8") : "";
const imgScriptCode = stripComments(imgScriptSrc);
const pkgJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const pkgDeps = JSON.stringify({ ...(pkgJson.dependencies ?? {}), ...(pkgJson.devDependencies ?? {}) });

// [A] Claude 대본 보정 — 로컬 최고 후보 이후 1회, SDK 없음, fail-open to local
check("helper defines Claude polish (polishWizardScriptWithClaude)", /export async function polishWizardScriptWithClaude/.test(helperSrc));
check("polish accepts injectable fetchImpl (fake-fetch testable)", /fetchImpl\?:\s*typeof globalThis\.fetch/.test(helperSrc));
check("polish targets fixed ANTHROPIC_API_URL only", /ANTHROPIC_API_URL\s*=\s*"https:\/\/api\.anthropic\.com\/v1\/messages"/.test(helperCode) && /fetchImpl\s*\(\s*ANTHROPIC_API_URL\s*,/.test(helperCode));
// (openai는 이 레포의 기존 의존성 — 이번 task 금지 대상은 Anthropic/ElevenLabs SDK 추가다)
check("no Anthropic/ElevenLabs SDK dependency in package.json", !/@anthropic-ai|"anthropic"|elevenlabs/i.test(pkgDeps));
check("route scriptPreview: local best, quality gate, then ensureWizardFinalScript once", /readScriptPreview\(topicId\)[\s\S]{0,1200}getWizardScriptQualityGate\(topicId, preview\)[\s\S]{0,2200}ensureWizardFinalScript\(topicId,\s*preview/.test(routeCode));
check("polish cache prevents repeat API calls for same local script", /cached\.localFingerprint\s*===\s*fp/.test(helperCode));
check("polish fallback reason codes exist (key/api/parse/validation)", ["NO_API_KEY", "API_ERROR", "PARSE_FAILED", "VALIDATION_FAILED"].every((c) => helperSrc.includes(c)));
check("polish validation enforces caption count matches scenes + supported scene count + polite-tone ban", /captionLines_scene_count_mismatch/.test(helperSrc) && /caption_over_limit_or_empty/.test(helperSrc) && /scenes_count_unsupported/.test(helperSrc) && /polite_or_lecture_tone/.test(helperSrc));
check("polish rejects local-judge score regression", /polishedJudgment\.overallScore\s*<\s*localJudge\s*-\s*5/.test(helperCode));
check("polish kill-switch exists (env + marker, 검증 중 실호출 차단)", /WIZARD_DISABLE_CLAUDE_POLISH/.test(helperCode) && /DISABLE_LIVE_CLAUDE_POLISH\.marker/.test(helperSrc));
check("ANTHROPIC key never enters child env allowlists", !/MEDIA_ENV_KEY_NAMES[\s\S]{0,300}ANTHROPIC/.test(helperSrc) && !/APPROVED_ENV_KEY_NAMES[\s\S]{0,300}ANTHROPIC/.test(helperSrc));
check("UI shows 대본 생성 방식 + Claude 적용/미적용 배지", wizardSrc.includes("대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정") && wizardSrc.includes("Claude 보정 적용됨") && wizardSrc.includes("Claude 보정 미적용 — 로컬 대본 사용 중"));

// [B] 실제 TTS — 한국어 연속 발화 디렉터 v2 + no-key fail-closed
check("realTtsCreate uses Korean continuous director v2", /SCRIPT_ELEVENLABS_SCENE_TTS\s*=\s*"scripts\/build-elevenlabs-korean-director-tts-from-script\.mjs"/.test(helperSrc));
check("realTtsPreflight uses a separate no-live approval packet builder", /"realTtsPreflight"/.test(helperSrc) && /SCRIPT_ELEVENLABS_TTS_PREFLIGHT\s*=\s*"scripts\/build-minjae-three-phase-tts-approval-packet-v1\.mjs"/.test(helperSrc) && /action === "realTtsPreflight"/.test(routeCode));
check("realTtsPreflight runs without media env or ElevenLabs API access", /function runRealTtsPreflightAction[\s\S]*?runOperatorScript\(built\.command,\s*\{ timeoutMs:\s*30_000 \}\)/.test(routeCode) && !/function runRealTtsPreflightAction[\s\S]{0,2400}includeMediaEnv:\s*true/.test(routeCode));
check("realTtsReadonlyPreflight is isolated to the fixed GET-only audit script", /SCRIPT_ELEVENLABS_READONLY_PREFLIGHT\s*=\s*"scripts\/audit-elevenlabs-readonly-preflight-v1\.mjs"/.test(helperSrc) && /action === "realTtsReadonlyPreflight"/.test(routeCode) && /method:\s*"GET"/.test(elevenLabsReadonlyPreflightSrc));
check("real tts-script marks narration timing as character-aligned continuous", /timingPolicy:\s*"character_aligned_continuous_v2"/.test(helperCode) && /buildWizardSceneTimeline\(narrations\)/.test(helperCode));
check("real tts-script adds Korean cadence direction without replacing display narration", /function buildWizardSpeechDirection/.test(helperCode) && /prosodyPolicy:\s*"korean_native_cadence_v2"/.test(helperCode) && /narration:\s*narrations\[index\]/.test(helperCode) && /speechDirection,/.test(helperCode));
check("speech direction covers every finance-script scene role", ["hook", "problem", "situation", "consequence", "psychology", "mindset", "habit", "recommendation", "save"].every((role) => new RegExp(`${role}:\\s*\\{[\\s\\S]{0,420}delivery:`).test(helperCode)));
check("speech direction v2 preserves words and models Korean cadence explicitly", /performanceText:\s*segments\.map/.test(helperCode) && /continue_rise/.test(helperSrc) && /contrast_pivot/.test(helperSrc) && /list_build/.test(helperSrc) && /command_land/.test(helperSrc) && /contextPolicy:\s*"continuous_full_script"/.test(helperCode));
check("topic voice router covers five reusable delivery profiles", ["economic_authority", "discipline_coach", "wealth_conviction", "reassuring_control", "social_insight"].every((profile) => helperSrc.includes(profile)) && /buildWizardTopicSpeechProfile/.test(helperCode));
check("Korean continuation/list endings never receive forced full stops", /WIZARD_SPEECH_CONNECTIVE_END_PATTERN/.test(helperCode) && /WIZARD_SPEECH_LIST_END_PATTERN/.test(helperCode) && /cadence === "continue_rise" \|\| cadence === "list_build" \? ","/.test(helperCode) && /\(!isLast \|\| continuesAfterScene\)/.test(helperCode));
check("save scene closes with confidence instead of weakened calm settings", /save:\s*\{[\s\S]{0,360}v3AudioTag:\s*"confident"/.test(helperCode) && /intensity:\s*0\.72/.test(helperCode));
check("TTS runner supports flow-derived 4~18 scenes with legacy one-call and Minjae two-call budgets", /scenes\.length < 4/.test(ttsScriptSrc) && /scenes\.length > 18/.test(ttsScriptSrc) && /LEGACY_API_CALL_BUDGET_MAX\s*=\s*1/.test(ttsScriptSrc) && /PHASED_API_CALL_BUDGET_MAX\s*=\s*2/.test(ttsScriptSrc));
check("TTS sends continuous text or two aligned phases with character timestamps", /with-timestamps\?output_format=mp3_44100_128/.test(ttsScriptSrc) && /continuousText/.test(ttsScriptSrc) && /voicePhasePlan/.test(ttsScriptSrc) && /audio_base64/.test(ttsScriptSrc) && /character_start_times_seconds/.test(ttsScriptSrc));
check("continuous TTS uses approved v3 voice routing and Korean direction tags without SSML break spam", /modelId:\s*financeVoiceRoute\?\.route\s*\?\s*FINANCE_CHARACTER_VOICE_MODEL_ID\s*:\s*"eleven_v3"/.test(helperCode) && /language_code:\s*"ko"/.test(ttsScriptSrc) && /sceneDirectorTag/.test(ttsScriptSrc) && !/<break time=/.test(ttsScriptSrc));
check("continuous TTS keeps style zero and uses bounded speed for native cadence", /style:\s*0/.test(ttsScriptSrc) && /speed:/.test(ttsScriptSrc) && /0\.95,\s*1\.05/.test(ttsScriptSrc));
check("continuous raw TTS cache is keyed by engine/model/profile/text/settings", /inputFingerprint/.test(ttsScriptSrc) && ["engineVersion", "modelId", "voiceSettings", "topicProfileId", "continuousText"].every((field) => ttsScriptSrc.includes(field)));
check("generated per-part TTS input contract is content-addressed to avoid Windows file locks", /buildWizardRealTtsContractSnapshot/.test(helperCode) && /tts-script\.real-\$\{realTtsContract\.fingerprint\}\.json/.test(helperCode) && /if\s*\(!existsSync\(part\.realTtsScriptPath\)\)/.test(helperCode));
check("real TTS input generation repairs only semantic over-60 scripts and fails closed afterward", /resolveWizardDurationSafeProductionRecord/.test(helperCode) && /singleTargetDurationSec > 60/.test(financeEditorialScriptEngineSrc) && /tts_duration_contract_violation/.test(helperCode));
check("real TTS readiness requires current full input hash and exact Minjae opening/body parity audit", /ttsInputContractCurrent/.test(helperCode) && /ttsInputContractSha256/.test(helperCode) && /phaseAuditReady/.test(helperCode) && /openingMatchesBodyLead/.test(helperCode) && /providerBoundaryTagRepeated/.test(helperCode));
check("stale final script refresh preserves body content while repairing current cover-hook and media contracts", /function refreshWizardFinalScriptMediaContract/.test(helperCode) && /financeEditorialVideoStrategyCoverHooksPass/.test(helperCode) && /buildFinanceEditorialVideoStrategy/.test(helperCode) && /applyWizardSceneMediaStrategies\(raw\.script\.scenes\)/.test(helperCode) && /localFingerprint:\s*wizardScriptFingerprint\(script\)/.test(helperCode) && /if\s*\(!record && refreshWizardFinalScriptMediaContract\(topicId\)\)/.test(helperCode));
check("TTS reuses matching continuous or phase audio/alignment without a paid retry", /existsSync\(rawPath\) && existsSync\(alignmentCachePath\)/.test(ttsScriptSrc) && /reused_continuous_aligned/.test(ttsScriptSrc) && /reused_two_phase_aligned/.test(ttsScriptSrc));
check("continuous TTS maps aligned character ranges back to every video scene", /alignedText\.indexOf\(segment\.text, searchCursor\)/.test(ttsScriptSrc) && /normalizedDurationSec/.test(ttsScriptSrc) && /spokenStartSec/.test(ttsScriptSrc));
check("sample voice calibration remains isolated to the approved listening topic", /WIZARD_AV_SAMPLE_REVIEW_TOPIC_ID/.test(helperSrc) && /rolloutScope:\s*"single_topic_only"/.test(helperSrc));
check("sample voice uses slow breathing tags and fails short duration", /baseSpeed:\s*0\.91/.test(helperSrc) && /\[pause\]/.test(ttsScriptSrc) && /SAMPLE_REVIEW_VOICE_AUDIT_FAILED/.test(vidScriptSrc));
check("all staged-cover finance captions require the complete dynamic-semantic aligned transcript", /rolloutScope:\s*hasStagedCover\s*\?\s*"all_finance_topics_with_staged_cover"/.test(helperSrc) && /mode:\s*"full_script_dynamic_semantic_aligned"/.test(helperSrc) && /safePositions:\s*6/.test(helperSrc) && /fullScriptCoveragePass/.test(dynamicCaptionSrc) && /sentenceSemanticSegmentationPass/.test(dynamicCaptionSrc) && /exactTranscriptMatchPass/.test(dynamicCaptionSrc));
check("semantic-series videos use publish revision v5 while preserving prior ledger history", /WIZARD_FULL_SCRIPT_PUBLISH_VERSION\s*=\s*"v5"/.test(helperCode) && /version:\s*WIZARD_FULL_SCRIPT_PUBLISH_VERSION/.test(helperCode));
check(
  "publish preflight/result one-shot evidence is isolated by revision and production part",
    /const publishOutDir = join\(\s*WIZARD_VIDEO_OUT_ROOT,\s*safeSlug,\s*"publish",\s*WIZARD_FULL_SCRIPT_PUBLISH_VERSION,\s*selectedPart\.id,\s*\)/.test(helperCode) &&
    /function wizardPublishResultDir/.test(helperCode) &&
    /\.\.\.\(resolvedPartId \? \[resolvedPartId\] : \[\]\)/.test(helperCode) &&
    /join\(resultDir,\s*"final-e2e-publish-preflight\.json"\)/.test(helperCode) &&
    /join\(resultDir,\s*"final-e2e-publish-result\.json"\)/.test(helperCode),
);
check("continuous TTS writes versioned files and a short final tail only", /elevenlabs-korean-director-\$\{inputFingerprint\}/.test(ttsScriptSrc) && /FINAL_TAIL_SEC\s*=\s*0\.28/.test(ttsScriptSrc));
check("final video consumes normalized durations from the TTS summary", /audioTimelineScenes\.map\(\(s\) => Number\(s\.normalizedDurationSec\)\)/.test(vidScriptSrc));
check("media env allowlist is exactly the 4 ELEVENLABS keys", /MEDIA_ENV_KEY_NAMES\s*=\s*\[\s*"ELEVENLABS_API_KEY",\s*"ELEVENLABS_VOICE_ID",\s*"ELEVENLABS_MODEL_ID",\s*"ELEVENLABS_VOICE_LABEL",\s*\]/.test(helperSrc.replace(/\r?\n\s*/g, " ").replace(/\s+/g, " ")) || ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID", "ELEVENLABS_VOICE_LABEL"].every((k) => new RegExp(`MEDIA_ENV_KEY_NAMES[\\s\\S]{0,220}"${k}"`).test(helperSrc)));
check("tts gate trusts only Korean director v2 live summary (mock/old voice 불인정)", /provider\s*===\s*"elevenlabs"\s*&&[\s\S]{0,160}ttsEngineVersion\s*===\s*WIZARD_TTS_ENGINE_VERSION[\s\S]{0,120}liveApiCallPerformed\s*===\s*true/.test(helperCode));
// [A2] ELEVENLABS env는 realTtsCreate + 별도 승인된 GET-only 진단 child에만 전달
check("buildSanitizedChildEnv does NOT copy media env by default", /function buildSanitizedChildEnv\(opts\?:/.test(helperCode) && /includeMediaEnv\?:\s*boolean/.test(helperCode) && /opts\?\.includeMediaEnv\s*===\s*true/.test(helperCode));
check("runOperatorScript exposes includeMediaEnv option", /includeMediaEnv\?:\s*boolean/.test(helperCode));
check("runOperatorScript threads includeMediaEnv into child env builder", /buildSanitizedChildEnv\(\s*\{[\s\S]{0,180}includeMediaEnv:\s*opts\?\.includeMediaEnv\s*===\s*true[\s\S]{0,180}voiceOverride:\s*opts\?\.voiceOverride[\s\S]{0,80}\}\s*\)/.test(helperCode));
check("non-TTS commands are not rejected when no finance voice override exists", /if\s*\(opts\?\.voiceOverride\s*&&\s*opts\.voiceOverride\.voiceStatus\s*!==\s*"approved"\)/.test(helperCode));
check(
  "route sets includeMediaEnv:true ONLY on realTtsCreate and GET-only audit",
  (routeCode.match(/includeMediaEnv:\s*true/g) ?? []).length === 2 &&
    /action === "realTtsCreate"[\s\S]*?runOperatorScript\(builtTts\.command,\s*\{[^}]*includeMediaEnv:\s*true/.test(routeCode) &&
    /action === "realTtsReadonlyPreflight"[\s\S]*?runOperatorScript\(built\.command,\s*\{[^}]*includeMediaEnv:\s*true/.test(routeCode),
);
check("realTtsCreate stops at the first nonzero child exit and returns sanitized evidence",
  /if \(runTts\.exitCode !== 0\)/.test(routeCode) &&
  /REAL_TTS_CHILD_FAILED/.test(routeCode) &&
  /runTts\.stderr\.slice/.test(routeCode) &&
  /다음 편을 실행하지 않았습니다/.test(routeCode));
check("real media status uses the same duration-safe two-part production record",
  /const record = baseRecord \? resolveWizardDurationSafeProductionRecord\(topicId, baseRecord\) : null/.test(helperCode));
for (const otherAction of ["realSceneImagesCreate", "finalVideoCreate", "wizardPreflight", "actualUpload"]) {
  // 해당 action 핸들러 블록 내부에 includeMediaEnv:true가 없어야 한다(다음 action 시작 전까지 스캔).
  const idx = routeCode.indexOf(`action === "${otherAction}"`);
  const nextIdx = routeCode.indexOf("includeMediaEnv: true", idx);
  const blockEnd = idx === -1 ? -1 : routeCode.indexOf('action === "', idx + 20);
  const hasInBlock = idx !== -1 && nextIdx !== -1 && (blockEnd === -1 || nextIdx < blockEnd);
  check(`route does NOT set includeMediaEnv:true for ${otherAction}`, !hasInBlock);
}
check("route no-key TTS message is fail-closed", routeSrc.includes("실제 음성 키가 없어 생성하지 못했습니다. 테스트 소리는 업로드할 수 없습니다."));
check("UI separates TTS generation from Owner listening approval", wizardSrc.includes("생성 완료 · 청취 승인 필요") && wizardSrc.includes("Owner 청취 승인 완료"));
check("UI explains that all parts require listening approval", wizardSrc.includes("모든 편을 직접 듣고 승인해야 다음 제작 단계로 넘어갑니다") && wizardSrc.includes("현재 음성 청취 승인"));
check("UI real audio player streams ?audio=real", /audio=real&topicId=/.test(wizardSrc));

// [C] 장면 이미지 — ChatGPT+Playwright once 스크립트 (gate/hard-cap/repo-밖/no-upload)
check("scene-images once script exists", imgScriptSrc.length > 0);
check("images script requires ALLOW_CHATGPT_IMAGE=1 before any browser import", imgScriptSrc.indexOf('process.env.ALLOW_CHATGPT_IMAGE !== "1"') !== -1 && imgScriptSrc.indexOf('process.env.ALLOW_CHATGPT_IMAGE !== "1"') < imgScriptSrc.indexOf('await import("playwright")'));
check("images script enforces out-dir outside repo", /OUT_DIR\.startsWith\(REPO_ROOT/.test(imgScriptSrc));
// [C2] 이미지 산출물 경로는 C:\tmp\money-shorts-os\ 하위만 (Codex finding 2 fix) — import 전 검사
check(
  "images script forces C:\\tmp\\money-shorts-os out-dir + json script (before playwright import)",
  /MEDIA_ROOT_RE\s*=\s*\/\^C:\[\\\\\/\]\+tmp\[\\\\\/\]\+money-shorts-os\[\\\\\/\]\+\/i/.test(imgScriptCode) &&
    /MEDIA_ROOT_RE\.test\(OUT_DIR/.test(imgScriptCode) &&
    /MEDIA_ROOT_RE\.test\(scriptAbs\)/.test(imgScriptCode) &&
    imgScriptCode.indexOf("MEDIA_ROOT_RE") < imgScriptCode.indexOf('await import("playwright")'),
);
check(
  "images script caps recovery at one per scene or disables it for an approved one-shot run",
  /ROUTING_RECOVERY_LIMIT_PER_SCENE\s*=\s*retryDisabled\s*\?\s*0\s*:\s*1/.test(imgScriptCode) &&
    /VISUAL_DIFFERENCE_RECOVERY_LIMIT_PER_SCENE\s*=\s*retryDisabled\s*\?\s*0\s*:\s*1/.test(imgScriptCode) &&
    /sceneCount\s*\*\s*\(1\s*\+\s*ROUTING_RECOVERY_LIMIT_PER_SCENE\s*\+\s*VISUAL_DIFFERENCE_RECOVERY_LIMIT_PER_SCENE\)/.test(imgScriptCode) &&
    /MAX_SCENES\s*=\s*18/.test(imgScriptCode),
);
check(
  "shared ChatGPT image controller accepts an exact picture id or exact composer chip label",
  /composer-plus-btn/.test(chatgptImageCoreSrc) &&
    /export async function verifyImageToolActive/.test(chatgptImageCoreCode) &&
    /data-inline-selection-pill/.test(chatgptImageCoreCode) &&
    /data-id=\"picture_v2\"/.test(chatgptImageCoreCode) &&
    /firstVisibleExactLabelLocator/.test(chatgptImageCoreCode) &&
    /ancestor::\*\[self::form or @data-type="unified-composer"\]\[1\]/.test(chatgptImageCoreCode) &&
    /composer\.locator\('\[data-inline-selection-pill\]'\)/.test(chatgptImageCoreCode) &&
    /composer\.locator\('button'\)/.test(chatgptImageCoreCode) &&
    /contenteditable=\"false\"/.test(chatgptImageCoreCode) &&
    chatgptImageCoreSrc.includes("이미지 만들기") &&
    chatgptImageCoreSrc.includes("Create image") &&
    /IMAGE_TOOL_NOT_ACTIVE/.test(chatgptImageCoreSrc),
);
check(
  "scene runner preserves and rechecks picture_v2 before submitting with the send button",
  /activateImageTool,/.test(imgScriptCode) &&
    /verifyImageToolActive,/.test(imgScriptCode) &&
    /sendPrompt,/.test(imgScriptCode) &&
    imgScriptCode.indexOf("await activateImageTool(page") < imgScriptCode.indexOf("await typePrompt(page") &&
    /post-type verification failed/.test(imgScriptCode) &&
    /final submit verification failed/.test(imgScriptCode) &&
    /await sendPrompt\(page\)/.test(imgScriptCode) &&
    !/function activateImageToolCurrentUI/.test(imgScriptCode),
);
check(
  "scene runner uses a regular image chat, clears only automation drafts and preserves Owner drafts",
  /openFreshImageChat,/.test(imgScriptCode) &&
    imgScriptCode.indexOf("await openFreshImageChat(page") < imgScriptCode.indexOf("await activateImageTool(page") &&
    /CHATGPT_IMAGE_FRESH_CHAT_URL\s*=\s*"https:\/\/chatgpt\.com\/"/.test(chatgptImageCoreCode) &&
    !chatgptImageCoreSrc.includes("?temporary-chat=true") &&
    /CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX/.test(chatgptImageCoreCode) &&
    /IMAGE_TOOL_OWNER_DRAFT_PRESENT/.test(chatgptImageCoreCode) &&
    /Cleared stale automation-owned image draft/.test(chatgptImageCoreCode) &&
    /Owner draft preserved/.test(chatgptImageCoreCode),
);
check(
  "image menu matching is menuitem-only and browser failures stop after the first scene",
  /getByRole\("menuitemradio"/.test(chatgptImageCoreCode) &&
    /getByRole\("menuitem"/.test(chatgptImageCoreCode) &&
    !/getByRole\("button", \{ name: \/\^이미지 만들기/.test(chatgptImageCoreCode) &&
    /IMAGE_TOOL_ENTRY_UNUSABLE/.test(chatgptImageCoreCode) &&
    /IMAGE_TOOL_CHAT_OPEN_FAILED/.test(imgScriptCode) &&
    /if \(\/IMAGE_TOOL_\/\.test\(msg\)\)/.test(imgScriptCode),
);
check(
  "current ChatGPT home direct image button is awaited before and after the plus-menu fallback",
  /async function waitForDirectImageEntry/.test(chatgptImageCoreCode) &&
    /const directTarget = await waitForDirectImageEntry\(page\)/.test(chatgptImageCoreCode) &&
    /page\.locator\("button"\)\.filter\(\{ hasText: \/\^이미지 만들기\$\//.test(chatgptImageCoreCode) &&
    /page\.locator\("button"\)\.filter\(\{ hasText: \/\^Create image\$\/i/.test(chatgptImageCoreCode) &&
    /export async function waitForImageToolActive/.test(chatgptImageCoreCode) &&
    /await page\.waitForTimeout\(Math\.min\(250, remaining\)\)/.test(chatgptImageCoreCode) &&
    /waitForImageToolActive\(page, 8000\)/.test(chatgptImageCoreCode) &&
    /direct create-image button click failed/.test(chatgptImageCoreCode) &&
    /direct create-image button did not create a picture_v2 chip/.test(chatgptImageCoreCode) &&
    chatgptImageCoreCode.indexOf("const directTarget =") < chatgptImageCoreCode.indexOf("const plus =") &&
    /const delayedDirectTarget = await waitForDirectImageEntry\(page, 7000\)/.test(chatgptImageCoreCode) &&
    /delayed direct home button/.test(chatgptImageCoreCode),
);
check(
  "live ChatGPT image preflight stops with a typed draft before send",
  existsSync(CHATGPT_IMAGE_LIVE_PREFLIGHT_PATH) &&
    /--allow-no-send/.test(chatgptImageLivePreflightCode) &&
    /submitted:\s*false/.test(chatgptImageLivePreflightCode) &&
    /READY_BEFORE_SEND/.test(chatgptImageLivePreflightCode) &&
    /checkSendEnabled/.test(chatgptImageLivePreflightCode) &&
    /await page\.close\(\)/.test(chatgptImageLivePreflightCode) &&
    !/sendPrompt/.test(chatgptImageLivePreflightCode) &&
    !/composer-submit-button/.test(chatgptImageLivePreflightCode),
);
check(
  "image-mode prompt typing never uses fill or select-all that would delete the inline pill",
  (() => {
    const branchStart = chatgptImageCoreCode.indexOf("if (imageToolActive)");
    const fallbackStart = chatgptImageCoreCode.indexOf("await ta.fill(oneLine)", branchStart);
    const imageModeBranch = chatgptImageCoreCode.slice(branchStart, fallbackStart);
    return branchStart >= 0 && fallbackStart > branchStart &&
      /page\.keyboard\.type\(oneLine/.test(imageModeBranch) &&
      /picture_v2 pill disappeared while typing/.test(imageModeBranch) &&
      !/\.fill\(/.test(imageModeBranch) &&
      !/selectAll\(/.test(imageModeBranch);
  })(),
);
check(
  "text-only edit-routing failure receives one new-chat recovery then stops fail-closed",
  /IMAGE_TOOL_TEXT_FAILURE_PATTERN/.test(imgScriptCode) &&
    /detectImageToolTextFailure/.test(imgScriptCode) &&
    /new-chat-routing-recovery/.test(imgScriptCode) &&
    /routingRecoveriesUsed/.test(imgScriptCode) &&
    /BLOCKED_IMAGE_TOOL/.test(imgScriptCode) &&
    routeSrc.includes("신규 이미지로 한 번 다시 요청했지만 편집 요청으로 잘못 처리"),
);
check(
  "image tool blocker detail reaches the API and activation failures are not mislabeled as edit routing",
  /blockerDetail:\s*string \| null/.test(helperCode) &&
    /sceneRows\.find\(\(scene\) => typeof scene\.method === "string"/.test(helperCode) &&
    /describeImageToolBlocker\(mediaAfterImg\.realImages\.blockerDetail\)/.test(routeCode) &&
    routeSrc.includes("이미지 만들기 칩은 선택됐지만 활성 상태 확인 신호를 읽지 못해"),
);
check(
  "image prompt explicitly requests a new image and removes duplicated storyboard boilerplate",
  /GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET/.test(imgScriptSrc) &&
    /Start from a blank canvas/.test(imgScriptSrc) &&
    !/not an edit, variation or transformation/.test(imgScriptSrc) &&
    /PROMPT_MAX_CHARS\s*=\s*4800/.test(imgScriptCode) &&
    /function compactSceneArtDirection/.test(imgScriptCode) &&
    !/Full role map:/.test(imgScriptCode),
);
check(
  "only files produced by the verified image controller can be resumed",
  /previousSummary\?\.imageControllerVersion\s*===\s*IMAGE_CONTROLLER_VERSION/.test(imgScriptCode) &&
    /reusableSceneIndexes\.has\(i \+ 1\)/.test(imgScriptCode) &&
    /existing_file_skip/.test(imgScriptCode),
);
check(
  "script planner derives scene count from narration flow instead of fixing 8 or 10",
  /function splitNarrationByVisualFlow/.test(helperCode) &&
    /stages\.flatMap/.test(helperCode) &&
    /WIZARD_SCRIPT_MIN_SCENE_COUNT\s*=\s*4/.test(helperCode) &&
    /WIZARD_SCRIPT_MAX_SCENE_COUNT\s*=\s*18/.test(helperCode) &&
    helperSrc.includes("scenes 개수를 먼저 정하지 마라") &&
    !helperSrc.includes("scenes는 8~10개"),
);
check(
  "images script enforces one bright integrated family-quality 3D style and forbids photography",
  /Money Shorts original bright family-feature-quality cinematic 3D animation/.test(imgScriptSrc) &&
    /same stylized render language as the character scenes/.test(imgScriptSrc) &&
    /no photography, no live action, no documentary realism/.test(imgScriptSrc) &&
    /no miniature, dollhouse, diorama/.test(imgScriptSrc) &&
    !/lived-reality editorial photography/.test(imgScriptSrc),
);
check(
  "images script attaches and audits the selected character identity reference",
  /money_shorts_selected_character_reference_v1/.test(imgScriptSrc) &&
    /attachRef/.test(imgScriptCode) &&
    /referenceAttachmentPassed/.test(imgScriptCode) &&
    /CHARACTER QUALITY REGENERATION REQUIRED/.test(imgScriptSrc),
);
check(
  "images script can regenerate exact failed scenes while preserving accepted images",
  /--regenerate-scenes 4,5/.test(imgScriptSrc) &&
    /targetedRegenerationSceneIndexes/.test(imgScriptCode) &&
    /targetedRegenerationPassed/.test(imgScriptCode),
);
check(
  "images runner processes the confirmed dynamic scene count instead of stopping at 6",
  /for\s*\(let i = 0; i < sceneCount; i\+\+\)/.test(imgScriptCode) &&
    /expectedCount:\s*sceneCount/.test(imgScriptCode) &&
    !/for\s*\(let i = 0; i < 6; i\+\+\)/.test(imgScriptCode),
);
check(
  "motion-ready visual storyboard assigns distinct roles, eye-level cameras and bright light progression",
  /STORYBOARD_ROLES/.test(imgScriptCode) &&
    ["EVERYDAY REALITY", "PSYCHOLOGY", "TURNING POINT", "PRACTICAL HABIT", "SAVE AND RECALL"].every((role) => imgScriptSrc.includes(role)) &&
    /the recurring Korean adult making, avoiding or delaying one small decision/.test(imgScriptSrc) &&
    /candid eye-level medium-wide or intimate over-shoulder view/.test(imgScriptSrc) &&
    /clear hopeful daylight or soft golden light/.test(imgScriptSrc) &&
    /retiredDirectionPatterns/.test(imgScriptCode) &&
    !/event:\s*"one faceless stylized person|event:\s*"hands or a small faceless figure/.test(imgScriptCode),
);
check(
  "visual storyboard blocks adjacent reuse and black voids",
  /ADJACENT DIFFERENCE/.test(imgScriptSrc) &&
    /Do not repeat its human presence, spatial form, camera distance, setting silhouette or hero/.test(imgScriptSrc) &&
    /MODALITY DIFFERENCE: previous mode/.test(imgScriptSrc) &&
    /blank black floor or void/.test(imgScriptSrc),
);
check(
  "helper chooses bright/warning/neutral/warm topic tone arcs",
  ["bright_progress", "warning_to_clarity", "neutral_analysis", "warm_everyday"].every((tone) => helperSrc.includes(tone)) &&
    /brighter transitional light entering the frame/.test(helperSrc) &&
    /natural daylight or warm practical indoor light/.test(helperSrc),
);
check(
  "bright integrated motion-ready sequence v11 uses a versioned image/video set so old repetitive assets cannot pass",
  /WIZARD_VISUAL_ENGINE_VERSION\s*=\s*"money_shorts_finance_3d_editorial_sequence_v11"/.test(helperCode) &&
    /WIZARD_IMAGE_CONTROLLER_VERSION\s*=\s*"chatgpt_picture_v2_character_reference_v8"/.test(helperCode) &&
    /images-3d-editorial-sequence-v11/.test(helperSrc) &&
    /video-3d-editorial-sequence-v11/.test(helperSrc) &&
    /imagesSummary\.visualEngineVersion\s*===\s*visualProfile\.engineVersion/.test(helperCode) &&
    /imagesSummary\.imageControllerVersion\s*===\s*WIZARD_IMAGE_CONTROLLER_VERSION/.test(helperCode),
);
check(
  "no topic can bypass the shared 3D visual profile through a photoreal sample exception",
  !/WIZARD_SAMPLE_LIVED_REALITY_VISUAL_ENGINE_VERSION/.test(helperSrc) &&
    !/images-lived-reality-sample-v6/.test(helperSrc) &&
    !/LIVED_REALITY_SAMPLE_SCENES/.test(imgScriptSrc) &&
    /void topicId/.test(helperSrc),
);
check(
  "generated images must pass perceptual difference audit before video readiness",
  /ffmpeg_dhash64_v1/.test(imgScriptSrc) &&
    /REJECTED_NEAR_DUPLICATE_IMAGE/.test(imgScriptSrc) &&
    /visual-difference-recovery/.test(imgScriptSrc) &&
    /visualDifferenceAudit\?\.passed\s*===\s*true/.test(helperCode) &&
    /visualDifferenceAudit\?\.passed\s*!==\s*true/.test(vidScriptSrc),
);
check(
  "route and UI report dynamic image counts instead of fixed 6",
  /realImages\.expectedCount/.test(routeCode) &&
    /realMedia\?\.realImages\.expectedCount/.test(wizardCode) &&
    !/generatedCount\}\/6/.test(routeCode),
);
check(
  "scene count stays unknown until the confirmed script defines it (never falls back to 8)",
  !/WIZARD_SCRIPT_DEFAULT_SCENE_COUNT/.test(helperCode) &&
    /expectedCount:\s*number\s*\|\s*null/.test(helperSrc) &&
    /expectedSceneCount\s*!==\s*null/.test(helperCode) &&
    /plannedSceneCount/.test(wizardCode) &&
    !/expectedCount\s*\?\?\s*8/.test(wizardCode),
);
check(
  "images script forbids generated text and logos while preserving natural selected-character adult faces",
  /No readable text, letters, numbers, UI, logo, brand or watermark/.test(imgScriptSrc) &&
    /believable Korean adult facial proportions/.test(imgScriptSrc) &&
    /eyes only subtly larger than real life/.test(imgScriptSrc) &&
    /preserve the exact selected character identity/.test(imgScriptSrc),
);
check("images script reuses proven _chatgpt-image-core", /_chatgpt-image-core\.mjs/.test(imgScriptSrc));
check("images script never uploads/publishes", !/instagram|youtube|blob\.put|googleapis|@vercel/i.test(imgScriptSrc));
check("images script forbids paid image APIs (openai api key 사용 없음)", !/OPENAI_API_KEY|api\.openai\.com|bfl\.ai|gemini/i.test(imgScriptCode));
check(
  "route passes hardcoded ALLOW_CHATGPT_IMAGE only for character, full-scene, or exact selected-scene generation",
  /characterCastCreate[\s\S]{0,1800}extraEnv:\s*\{\s*ALLOW_CHATGPT_IMAGE:\s*"1"\s*\}/.test(routeCode) &&
  /realSceneImagesRegenerateSelected[\s\S]{0,5200}extraEnv:\s*\{\s*ALLOW_CHATGPT_IMAGE:\s*"1"\s*\}/.test(routeCode) &&
  /realSceneImagesCreate[\s\S]{0,3000}extraEnv:\s*\{\s*ALLOW_CHATGPT_IMAGE:\s*"1"\s*\}/.test(routeCode) &&
  (routeCode.match(/ALLOW_CHATGPT_IMAGE/g) ?? []).length === 3,
);
check("route passes the Flow live marker only inside the exact approved generation action", /flowMotionGenerate[\s\S]{0,3200}extraEnv:\s*\{\s*ALLOW_FLOW_MOTION_GENERATION:\s*"1"\s*\}/.test(routeCode) && (routeCode.match(/ALLOW_FLOW_MOTION_GENERATION/g) ?? []).length === 1);
check("images gate requires expectedCount SAVED_OK portrait files", /expectedSceneCount/.test(helperCode) && /savedScenes\.length\s*===\s*expectedSceneCount/.test(helperCode) && /s\.width\s*>=\s*900/.test(helperCode));
check(
  "UI separates image generation, Owner review, and hash-bound acceptance states",
  wizardSrc.includes("이미지 생성 미완료") &&
  wizardSrc.includes("전체 이미지 생성 완료 · Owner 검수 필요") &&
  wizardSrc.includes("전체 이미지 Owner 승인 완료"),
);

// [D] 최종 mp4 — 실제 자산 필수 + ffprobe 검증 + C:\tmp
check("final-video once script exists", vidScriptSrc.length > 0);
check("layered motion renderer helper exists", motionHelperSrc.length > 0);
check("Golden Sample dynamic-caption module exists", dynamicCaptionSrc.length > 0);
check("video script rejects non-elevenlabs / non-live audio summary", /provider !== "elevenlabs"/.test(vidScriptSrc) && /liveApiCallPerformed !== true/.test(vidScriptSrc));
check("video script rejects unverified or placeholder images", /imageControllerVersion !== IMAGE_CONTROLLER_VERSION/.test(vidScriptSrc) && /allReady !== true/.test(vidScriptSrc));
check("video script rejects images without the hairstyle continuity audit", /CHARACTER_CONTINUITY_VERSION/.test(vidScriptSrc) && /characterContinuityAudit\?\.passed !== true/.test(vidScriptSrc));
check("video script enforces C:\\tmp out-dir", /MEDIA_ROOT_RE\.test\(abs/.test(vidScriptSrc) && vidScriptSrc.includes("money-shorts-os"));
// [D2] 최종영상 스크립트: 6개 입력/출력 전부 C:\tmp\money-shorts-os\ 하위 강제
check(
  "video script forces ALL 6 path args under C:\\tmp\\money-shorts-os",
  /MEDIA_ROOT_RE\s*=\s*\/\^C:\[\\\\\/\]\+tmp\[\\\\\/\]\+money-shorts-os\[\\\\\/\]\+\/i/.test(vidScriptSrc) &&
    ["--script", "--tts-script", "--audio-summary", "--images-dir", "--flow-motion-state", "--out-dir"].every((f) => vidScriptSrc.includes(f)) &&
    /for\s*\(const \[flag, abs\] of PATH_INPUTS\)/.test(vidScriptSrc) &&
    /MEDIA_ROOT_RE\.test\(abs/.test(vidScriptSrc),
);
check("video script validates 1080x1920 + 15~60s + audio/video streams + size", /width1080/.test(vidScriptSrc) && /height1920/.test(vidScriptSrc) && /duration15to60/.test(vidScriptSrc) && /hasAudioStream/.test(vidScriptSrc) && /fileSizePositive/.test(vidScriptSrc));
check(
  "video renderer uses layered motion for stills and verified Veo MP4 for selected scenes",
  /buildSceneMotionRecipe/.test(vidScriptSrc) &&
    /buildLayeredMotionFilter/.test(vidScriptSrc) &&
    /buildLayeredMotionAudit/.test(vidScriptSrc) &&
    /resolveFlowMotionRenderInputs/.test(vidScriptSrc) &&
    /source === "veo_motion"/.test(vidScriptSrc) &&
    /FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION/.test(flowMotionRenderInputSrc) &&
    /foregroundalpha/.test(motionHelperSrc) &&
    /characteralpha/.test(motionHelperSrc) &&
    /handsalpha/.test(motionHelperSrc) &&
    /distinctCameraModesPass/.test(motionHelperSrc) &&
    !/min\(1\.0\+0\.0008\*on,1\.12\)/.test(vidScriptSrc),
);
check("video script output marked notUploaded", /notUploaded:\s*true/.test(vidScriptSrc));
check("repeat renders use unique work and final paths instead of overwriting a playing MP4", /const renderId\s*=/.test(vidScriptSrc) && /\.render-\$\{renderId\}/.test(vidScriptSrc) && /final-\$\{safeSlug\}-\$\{renderId\}\.mp4/.test(vidScriptSrc));
check(
  "video script enforces complete sentence-semantic captions without a bottom bar",
  /buildDynamicCaptionTimeline/.test(vidScriptSrc) &&
    /full_script_dynamic_semantic_aligned_v6/.test(vidScriptSrc) &&
    /fullScriptCaptionGate/.test(vidScriptSrc) &&
    /MAX_WORDS_PER_DISPLAY_UNIT\s*=\s*16/.test(dynamicCaptionSrc) &&
    /MAX_VISIBLE_CHARS_PER_BLOCK\s*=\s*34/.test(dynamicCaptionSrc) &&
    /sourceSegmentsForScene/.test(dynamicCaptionSrc) &&
    /sentenceBoundaryPreservedPass/.test(dynamicCaptionSrc) &&
    /sourceSegmentBoundaryPreservedPass/.test(dynamicCaptionSrc) &&
    /arbitraryMidPhraseSplitAbsent/.test(dynamicCaptionSrc) &&
    /fullScriptCoveragePass/.test(dynamicCaptionSrc) &&
    /captionCoverageRatio === 1/.test(dynamicCaptionSrc) &&
    /bottomFixedSubtitleBar:\s*false/.test(dynamicCaptionSrc) &&
    /displayTerminalPunctuationAbsent/.test(dynamicCaptionSrc) &&
    /multiPositionNarrativeFlowPass/.test(dynamicCaptionSrc) &&
    /semanticColorPalettePass/.test(dynamicCaptionSrc) &&
    /motionDiversityPass/.test(dynamicCaptionSrc) &&
    /Black Han Sans/.test(dynamicCaptionSrc) &&
    !/Malgun Gothic/.test(dynamicCaptionSrc),
);
check("helper final video gate re-checks 1080x1920/15~60s/streams", /videoSummary\.width\s*===\s*1080/.test(helperCode) && /videoSummary\.height\s*===\s*1920/.test(helperCode) && /durationSec\s*>=\s*15/.test(helperCode) && /durationSec\s*<=\s*60/.test(helperCode));
check(
  "helper rejects final videos without the hybrid still/Veo motion audit",
  /WIZARD_MOTION_RENDERER_VERSION\s*=\s*"money_shorts_hybrid_motion_renderer_v1"/.test(helperCode) &&
    /WIZARD_LAYERED_MOTION_RENDERER_VERSION\s*=\s*"money_shorts_layered_motion_renderer_v3"/.test(helperCode) &&
    /wizardHybridMotionSummaryIsReady/.test(helperCode) &&
    /motionAudit\.layeredParallaxCoveragePass\s*===\s*true/.test(helperCode) &&
    /motionAudit\.characterMicroMotionCoveragePass\s*===\s*true/.test(helperCode) &&
    /motionAudit\.localizedMotionCoveragePass\s*===\s*true/.test(helperCode) &&
    /flowMotionAudit\.videoHashCoveragePass\s*===\s*true/.test(helperCode) &&
    /flowMotionAudit\.ownerQaCoveragePass\s*===\s*true/.test(helperCode) &&
    /flowMotionAudit\.passed\s*===\s*true/.test(helperCode),
);
check("helper rejects legacy sparse, punctuation-heavy and monotone caption videos", /WIZARD_FULL_SCRIPT_CAPTION_CONTRACT_VERSION/.test(helperCode) && /full_script_dynamic_semantic_aligned_v6/.test(helperCode) && /fullScriptCoveragePass/.test(helperCode) && /sentenceSemanticSegmentationPass/.test(helperCode) && /arbitraryMidPhraseSplitAbsent/.test(helperCode) && /displayTerminalPunctuationAbsent/.test(helperCode) && /multiPositionNarrativeFlowPass/.test(helperCode) && /semanticColorPalettePass/.test(helperCode) && /motionDiversityPass/.test(helperCode) && /captionCoverageRatio\s*===\s*1/.test(helperCode));
check("UI final video states exist (최종 영상 준비 / 시안 영상 · 업로드 불가)", wizardSrc.includes("최종 영상 준비") && wizardSrc.includes("시안 영상") && wizardSrc.includes("업로드 불가"));
check("UI preview streams final video (?video=final)", /video=final&topicId=/.test(wizardSrc));

// [E] media quality gate / upload gate — mock·시안 업로드 원천 차단
check("content unit requires real tts/images/final mp4 (fail-closed reasons)", ["real_tts_required", "real_scene_images_required", "final_mp4_required", "media_quality_gate_not_ready"].every((r) => helperSrc.includes(r)));
check("actualUpload re-verifies media gate before spawn (게이트 1.5)", /actualUpload[\s\S]{0,5200}readWizardRealMediaState\(topicId\)[\s\S]{0,700}MEDIA_GATE_USER_MESSAGE/.test(routeSrc));
check("media gate blocker codes exist", ["REAL_TTS_REQUIRED", "REAL_SCENE_IMAGES_REQUIRED", "FINAL_MP4_REQUIRED"].every((c) => helperSrc.includes(c)) && routeSrc.includes("MEDIA_QUALITY_GATE_NOT_READY"));
check("upload block user message exact (아직 실제 음성/… 업로드를 막았습니다)", routeSrc.includes("아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.") && wizardSrc.includes("아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다."));
check(
  "new pipeline actions never build --arm",
  /case "realTtsCreate"[\s\S]*?case "status"/.test(helperCode) &&
    !(/case "realTtsCreate"[\s\S]*?case "status"/.exec(helperCode)?.[0]?.includes("--arm") ?? true),
);
check("--arm single-gate contract intact (actualUpload only + allowArm gate)", (helperSrc.match(/ARM_ARG_TOKEN,?\s*\]/g) ?? []).length === 1 && /allowArm\s*!==\s*true/.test(helperCode));
check("new create and read-only audit actions are local-dev gated in route", ["realTtsReadonlyPreflight", "realTtsCreate", "realSceneImagesCreate", "finalVideoCreate", "realMediaStatus"].every((a) => new RegExp(`LOCAL_SCRIPT_ACTIONS[\\s\\S]{0,800}"${a}"`).test(routeSrc)));
check("GET final video stream is enum only", /videoParam\s*===\s*"muxed"\s*\|\|\s*videoParam\s*===\s*"silent"\s*\|\|\s*videoParam\s*===\s*"final"/.test(routeCode));
check("real audio stream restricted to summary path + C:\\tmp prefix + mp3/m4a", /readWizardRealAudioBytes/.test(routeCode) && /WIZARD_VIDEO_ALLOWED_PREFIX/.test(helperCode) && /\.mp3|\.m4a/.test(helperSrc));

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log(`${passes + failures} checks — ${passes} PASS, ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
