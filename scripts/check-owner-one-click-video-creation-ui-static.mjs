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

// ── 9단계 흐름 라벨 (task: real-pipeline — 실제 목소리/장면 이미지/최종 영상 단계 추가) ──
for (const label of [
  "카테고리 선택",
  "주제 추천",
  "대본 만들기",
  "실제 목소리 만들기",
  "장면 이미지 만들기",
  "최종 영상 만들기",
  "미리보기",
  "게시 전 점검",
  "실제 업로드",
]) {
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
  "wizard upload gate requires media gate + preflight + two checkboxes",
  /mediaGateOk\s*&&[\s\S]{0,40}preflightDone[\s\S]{0,200}confirmReviewed[\s\S]{0,80}confirmPublish/.test(wizardCode) &&
    /mediaGateOk\s*&&\s*preflightState\s*===\s*"success"/.test(wizardCode),
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

// ── 프리미엄 재테크(돈·심리) 주제 엔진 — 품질/차단/anti-repeat 계약 ──────────
// task: owner-web-premium-money-psychology-topic-engine-fix-v2
const finStart = helperSrc.indexOf("finance: [");
const finEnd = helperSrc.indexOf("ai: [", finStart);
const financeSrc = finStart !== -1 && finEnd > finStart ? helperSrc.slice(finStart, finEnd) : "";
check("finance bank section found in helper", financeSrc.length > 0);

const finSeedCount = (financeSrc.match(/slug:\s*"/g) ?? []).length;
check("finance premium bank has at least 45 seeds", finSeedCount >= 45, `found ${finSeedCount}`);

// 약한 기준선 5개 title — active 추천으로 등장 금지(helper 전체에서 금지)
for (const weak of [
  "월급이 사라지는 진짜 이유",
  "돈이 모이지 않는 사람의 공통 습관",
  "성공하는 사람은 지출을 이렇게 본다",
  "가난해지는 소비 패턴",
  "돈 불안이 사람을 망치는 방식",
]) {
  check(`weak-baseline title banned: ${weak}`, !helperSrc.includes(weak));
}
// 저품질 절약팁 키워드 — finance 시드 구간에서 금지
for (const cheap of ["커피값", "티끌", "무지출", "통장 쪼개기", "카드 명세서", "고정비 다이어트", "짠테크", "지름신"]) {
  check(`cheap saving-tip keyword banned in finance seeds: ${cheap}`, !financeSrc.includes(cheap));
}

// 4축 anchor(돈/심리/성공·습관/시각 메타포) + 공감/구조 설명 — 전 시드 보유
for (const field of ["moneyAnchor:", "psychologyAnchor:", "successAnchor:", "visualMetaphor:", "empathy:", "angleNote:"]) {
  const n = (financeSrc.match(new RegExp(field, "g")) ?? []).length;
  check(`every finance seed carries ${field.replace(":", "")}`, n === finSeedCount, `${n}/${finSeedCount}`);
}

// finance 시드 라인 파싱(시드 1개 = 1줄 규약)
const finSeedLines = financeSrc.split("\n").filter((l) => /slug:\s*"/.test(l));
{
  const titles = finSeedLines.map((l) => /title:\s*"([^"]+)"/.exec(l)?.[1] ?? "");
  check("finance titles all unique", new Set(titles).size === titles.length && titles.every(Boolean));
  const badLen = titles.filter((t) => t.length < 12 || t.length > 36);
  check("finance titles are 12~36 chars (권장 18~34)", badLen.length === 0, badLen.join(" | "));

  // ── 자기인식 후킹 계약: 존댓말/설명체 종결 금지 (task: concrete-self-recognition-hook) ──
  // 제목은 마침표 없이 구체 행동으로 끝나야 한다. 존댓말 종결어미로 끝나면 설명문처럼 읽힌다.
  const politeEnd = titles.filter((t) => /(합니다|됩니다|습니다|입니다)$/.test(t));
  check("finance titles do not end with 존댓말 종결(합니다/됩니다/습니다/입니다)", politeEnd.length === 0, politeEnd.join(" | "));
  const hasPeriod = titles.filter((t) => /[.。]$/.test(t));
  check("finance titles have no trailing 마침표", hasPeriod.length === 0, hasPeriod.join(" | "));

  // 제목 안에 실제 생활 장면/행동 키워드가 있어야 "내 얘기" 느낌이 산다.
  const SCENE_KW = [
    "월급", "배달", "구독", "카드값", "장바구니", "세일", "퇴근길", "결제", "친구", "이번 달만", "이번 한 번만",
    "할부", "택배", "잔고", "통장", "고지서", "가계부", "알림", "모임", "선물", "피드", "폰", "저축", "이체",
    "소비", "지출", "돈", "빚", "살림", "연봉", "수입", "고정비", "비상금", "씀씀이", "지른", "산 걸", "사니까",
    "벌어도", "구입", "사고", "쓴",
  ];
  const noScene = titles.filter((t) => !SCENE_KW.some((k) => t.includes(k)));
  check("every finance title has a 생활 장면/행동 키워드", noScene.length === 0, noScene.join(" | "));

  // 추상어 단독 사용 금지 — 반드시 구체 행동/상황 키워드와 함께 써야 한다.
  const ABSTRACT_ONLY = ["선택권", "기준선", "불안", "체면", "비교", "보상심리", "자기합리화", "미래의 나"];
  const CONCRETE_KW = [
    "월급", "배달", "구독", "카드값", "장바구니", "세일", "퇴근길", "결제", "친구", "이번 달만", "이번 한 번만",
    "할부", "택배", "잔고", "통장", "고지서", "가계부", "알림", "모임", "선물", "피드", "폰", "저축", "이체", "지출",
  ];
  const abstractOnly = titles.filter(
    (t) => ABSTRACT_ONLY.some((a) => t.includes(a)) && !CONCRETE_KW.some((c) => t.includes(c)),
  );
  check("finance titles never use 추상어 단독 (구체 행동 동반 필수)", abstractOnly.length === 0, abstractOnly.join(" | "));

  // 약한 설명형 패턴 금지 — suffix뿐 아니라 제목 "어디에 있든" 차단 (Codex finding: "…이유가 있다" 놓침).
  const WEAK_ANYWHERE = /(이유|방법|공통점|체크리스트|리뷰법|절약법|돈 모으는 법|부자 되는 법)/;
  const weakAnywhere = titles.filter((t) => WEAK_ANYWHERE.test(t));
  check("finance titles have no 약한 설명형 패턴 anywhere (이유/방법/공통점/체크리스트…)", weakAnywhere.length === 0, weakAnywhere.join(" | "));
}
{
  // 자막 계약: hook/empathy/points/save는 trimCaption(22자) 안에 들어가야 잘리지 않는다.
  const overs = [];
  for (const line of finSeedLines) {
    const slug = /slug:\s*"([^"]+)"/.exec(line)?.[1] ?? "?";
    const fields = [
      ["hook", /hook:\s*"([^"]+)"/.exec(line)?.[1] ?? ""],
      ["empathy", /empathy:\s*"([^"]+)"/.exec(line)?.[1] ?? ""],
      ["save", /save:\s*"([^"]+)"/.exec(line)?.[1] ?? ""],
    ];
    const pointsRaw = /points:\s*\[([^\]]+)\]/.exec(line)?.[1] ?? "";
    [...pointsRaw.matchAll(/"([^"]+)"/g)].forEach((m, i) => fields.push([`p${i + 1}`, m[1]]));
    for (const [f, v] of fields) if (v.length > 22) overs.push(`${slug}.${f}(${v.length})`);
  }
  check("finance caption slots (hook/empathy/points/save) ≤22 chars", overs.length === 0, overs.slice(0, 10).join(", "));
}
{
  // 저장 CTA에 행동 시점(다음 월급날/결제 전/오늘 밤 등) 포함
  const noTiming = finSeedLines.filter((l) => {
    const save = /save:\s*"([^"]+)"/.exec(l)?.[1] ?? "";
    return !/(월급|결제|오늘|이번 주|주말|밤|아침|다음)/.test(save);
  });
  check("finance save CTA includes 행동 시점", noTiming.length === 0, `${noTiming.length} seeds`);
}
{
  // ── 문체 계약 (task: hook-language-review-fix + judge-rewrite) ──
  // hook/points는 자막·대본 핵심 문장이라 하십시오체 종결(…니다)이 0이어야 한다.
  // "니다"는 하십시오체 공통 종결(합니다/습니다/입힙니다/빠릅니다/옵니다 등) → 문장 끝 "니다" 전반을 금지.
  const POLITE = /니다[.!?]?$/;
  const hookViol = [];
  const pointViol = [];
  const empViol = [];
  const saveViol = [];
  for (const line of finSeedLines) {
    const slug = /slug:\s*"([^"]+)"/.exec(line)?.[1] ?? "?";
    const hook = /hook:\s*"([^"]+)"/.exec(line)?.[1] ?? "";
    const emp = /empathy:\s*"([^"]+)"/.exec(line)?.[1] ?? "";
    const save = /save:\s*"([^"]+)"/.exec(line)?.[1] ?? "";
    if (POLITE.test(hook)) hookViol.push(`${slug}: ${hook}`);
    if (POLITE.test(emp)) empViol.push(`${slug}: ${emp}`);
    // save는 CTA라 "~하세요/여세요/보세요"는 허용, 설명체 종결만 금지.
    if (POLITE.test(save)) saveViol.push(`${slug}: ${save}`);
    const pointsRaw = /points:\s*\[([^\]]+)\]/.exec(line)?.[1] ?? "";
    [...pointsRaw.matchAll(/"([^"]+)"/g)].forEach((m, i) => {
      if (POLITE.test(m[1])) pointViol.push(`${slug}.p${i + 1}: ${m[1]}`);
    });
  }
  check("finance hook has no 설명체 종결(합니다/됩니다/습니다/입니다/셉니다)", hookViol.length === 0, hookViol.slice(0, 8).join(" | "));
  check("finance points have no 설명체 종결 (자막·대본 직접 노출)", pointViol.length === 0, pointViol.slice(0, 8).join(" | "));
  check("finance empathy has no 설명체 종결 (대본 2번째 문장)", empViol.length === 0, empViol.slice(0, 8).join(" | "));
  check("finance save CTA has no 설명체 종결 (하세요류만 허용)", saveViol.length === 0, saveViol.slice(0, 8).join(" | "));
}

// anti-repeat: 최근 노출 제외 창 — 순서만 바뀌는 셔플 금지
check("helper persists recent-shown seeds outside repo", /wizard-topic-recent-shown\.json/.test(helperSrc) && /readRecentShownSeedSlugs/.test(helperCode) && /writeRecentShownSeedSlugs/.test(helperCode));
check("batch excludes recently shown seeds", /!recentSet\.has\(s\.slug\)/.test(helperCode));
check("recent window = pool - batch (연속 배치 무겹침 보장)", /pool\.length\s*-\s*WIZARD_TOPIC_BATCH_SIZE/.test(helperCode));
// pool ≥45 + 창(pool-batch) ⇒ 5회×9개 = 45개 전부 서로 다른 title(≥30) + 연속 배치 겹침 0 — 정적으로 보장
check("finance 5-batch ≥30 unique titles statically guaranteed", finSeedCount >= 45 && /pool\.length\s*-\s*WIZARD_TOPIC_BATCH_SIZE/.test(helperCode));

// 프리미엄 대본 흐름: 1문장 구체 행동(hook) → 2문장 심리(empathy) → 3문장 돈 새는 지점(p1)
//   → [반전 앞 다리 1개] → 반전(p2) → 행동(p3) → 저장(save). "왜 그럴까요?" 질문형 브리지 남발 금지.
check("premium script uses empathy for scene-2 slot", /isPremium\s*\?\s*rec\.empathy/.test(helperCode));
{
  // 첫 3문장 = hook, curiosity(empathy), p1 순서로 붙는지 정적 확인.
  // 조립은 assemblePremiumVoiceover의 empathy(기본) 스타일: [e(hook), e(curiosity), e(p1), "진짜 문제는 따로 있다.", ...]
  const first3Ordered =
    /e\(hook\),\s*e\(curiosity\),\s*e\(p1\)/.test(helperCode) &&
    /assemblePremiumVoiceover/.test(helperCode);
  check("premium first 3 sentences are hook→empathy→p1 (구체 행동→심리→돈 새는 지점)", first3Ordered);
  // 질문형 브리지 "왜 그럴까요?"는 제거됐고, 반전 앞 다리 1개만 남는다.
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
  check("premium voiceover keeps exactly 1 단정형 반전 다리 (진짜 문제는 따로 있다.)", declBridge === 1, `found ${declBridge}`);
}
{
  // 정적 검증: 전 finance seed의 fullVoiceover 첫 3문장(hook·empathy·p1)에 하십시오체 종결이 없어야 한다.
  const POLITE = /니다[.!?]?$/;
  const first3Viol = [];
  for (const line of finSeedLines) {
    const slug = /slug:\s*"([^"]+)"/.exec(line)?.[1] ?? "?";
    const hook = /hook:\s*"([^"]+)"/.exec(line)?.[1] ?? "";
    const emp = /empathy:\s*"([^"]+)"/.exec(line)?.[1] ?? "";
    const p1 = [.../points:\s*\[([^\]]+)\]/.exec(line)?.[1].matchAll(/"([^"]+)"/g) ?? []][0]?.[1] ?? "";
    if ([hook, emp, p1].some((s) => POLITE.test(s))) first3Viol.push(slug);
  }
  check("premium fullVoiceover 첫 3문장(hook/empathy/p1) 설명체 종결 0", first3Viol.length === 0, first3Viol.slice(0, 8).join(", "));
}
{
  // 나열형(첫째/둘째/셋째)은 비프리미엄 fallback 문자열 1곳에만 존재해야 한다.
  const listicleCount = (helperCode.match(/첫째, \$\{p1\}/g) ?? []).length;
  check("listicle format confined to non-premium fallback (exactly 1)", listicleCount === 1, `found ${listicleCount}`);
  // 프리미엄 낭독문은 assemblePremiumVoiceover가 문장 배열([e(hook), ...])로 조립한다.
  check("premium voiceover built from sentence array (assemblePremiumVoiceover)", /const e = endSentence/.test(helperCode) && /\[e\(hook\)/.test(helperCode));
}

// ── 골든 샘플급 대본 구조: 장면 플랜 + 확장 필드 (task: golden-sample-script-and-light-ui) ──
check("helper exposes 6-step scene plan (buildScenePlan + scenes field)", /buildScenePlan/.test(helperSrc) && /scenes:\s*WizardScriptScene\[\]/.test(helperSrc));
for (const sceneId of ['"hook"', '"empathy"', '"psychology"', '"twist"', '"action"', '"save"']) {
  check(`scene plan has stage id ${sceneId}`, helperSrc.includes(`id: ${sceneId}`));
}
check("scene plan carries visualCue (장면성/시각 증거)", /visualCue:/.test(helperSrc));
for (const field of ["hookLine", "captionFirstLineHook", "uploadCaptionDraft", "goldenSampleChecks"]) {
  check(`script preview exposes ${field}`, helperSrc.includes(`${field}:`));
}

// ── 대본 결과 UI: 실제 대본/자막/장면계획/설명글 구분 라벨 노출 ────────────────
for (const label of [
  "실제 읽히는 대본",
  "첫 3초 훅",
  "영상에 들어갈 자막 6개",
  "장면 그림 계획",
  "SNS 설명글 초안",
]) {
  check(`wizard script UI shows section: ${label}`, wizardSrc.includes(label));
}
// "실제 읽히는 대본"이 실제 음성/최종 영상에 쓰이고, SNS 설명글은 대본이 아님을 사용자에게 알린다.
check("wizard clarifies 대본 is used by 실제 음성/최종 영상", wizardSrc.includes("실제 목소리 만들기와 최종 영상 만들기는 이 문장을 사용합니다"));
check("wizard clarifies SNS 설명글 is not the 대본", wizardSrc.includes("영상이 읽는 대본과는 다릅니다"));
check("wizard renders caption 6 lines (script.captionLines map)", /script\.captionLines/.test(wizardCode));
check("wizard renders scene plan rows (script.scenes map)", /script\.scenes/.test(wizardCode) && /visualCue/.test(wizardCode));

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
check("wizard renders quality summary from script.quality", /script\.quality/.test(wizardCode) && /qualitySummary/.test(wizardCode));

// ══════════════════════════════════════════════════════════════════════════════
// 실제 제작 파이프라인 (task: owner-web-real-script-voice-visual-generation-pipeline-v1)
// 이 블록은 정적 검사만 한다 — ElevenLabs/ChatGPT/Playwright/Anthropic 실제 호출은
// 여기서 절대 실행되지 않으며(no-run), 스크립트 자체의 fail-closed gate 존재를 검증한다.
// ══════════════════════════════════════════════════════════════════════════════

const imgScriptPath = path.join(ROOT, "scripts", "run-owner-real-scene-images-from-wizard-script-once.mjs");
const vidScriptPath = path.join(ROOT, "scripts", "run-owner-real-video-from-wizard-assets-once.mjs");
const imgScriptSrc = existsSync(imgScriptPath) ? readFileSync(imgScriptPath, "utf8") : "";
const vidScriptSrc = existsSync(vidScriptPath) ? readFileSync(vidScriptPath, "utf8") : "";
const imgScriptCode = stripComments(imgScriptSrc);
const pkgJson = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
const pkgDeps = JSON.stringify({ ...(pkgJson.dependencies ?? {}), ...(pkgJson.devDependencies ?? {}) });

// [A] Claude 대본 보정 — 로컬 최고 후보 이후 1회, SDK 없음, fail-open to local
check("helper defines Claude polish (polishWizardScriptWithClaude)", /export async function polishWizardScriptWithClaude/.test(helperSrc));
check("polish accepts injectable fetchImpl (fake-fetch testable)", /fetchImpl\?:\s*typeof globalThis\.fetch/.test(helperSrc));
check("polish targets fixed ANTHROPIC_API_URL only", /ANTHROPIC_API_URL\s*=\s*"https:\/\/api\.anthropic\.com\/v1\/messages"/.test(helperCode) && /fetchImpl\s*\(\s*ANTHROPIC_API_URL\s*,/.test(helperCode));
// (openai는 이 레포의 기존 의존성 — 이번 task 금지 대상은 Anthropic/ElevenLabs SDK 추가다)
check("no Anthropic/ElevenLabs SDK dependency in package.json", !/@anthropic-ai|"anthropic"|elevenlabs/i.test(pkgDeps));
check("route scriptPreview: local best first, then ensureWizardFinalScript once", /readScriptPreview\(topicId\)[\s\S]{0,900}ensureWizardFinalScript\(topicId,\s*preview/.test(routeCode));
check("polish cache prevents repeat API calls for same local script", /cached\.localFingerprint\s*===\s*fp/.test(helperCode));
check("polish fallback reason codes exist (key/api/parse/validation)", ["NO_API_KEY", "API_ERROR", "PARSE_FAILED", "VALIDATION_FAILED"].every((c) => helperSrc.includes(c)));
check("polish validation enforces caption 22자/6개 + scenes 6 + polite-tone ban", /captionLines_not_6/.test(helperSrc) && /caption_over_22_or_empty/.test(helperSrc) && /scenes_not_6/.test(helperSrc) && /polite_or_lecture_tone/.test(helperSrc));
check("polish rejects local-judge score regression", /polishedJudgment\.overallScore\s*<\s*localJudge\s*-\s*5/.test(helperCode));
check("polish kill-switch exists (env + marker, 검증 중 실호출 차단)", /WIZARD_DISABLE_CLAUDE_POLISH/.test(helperCode) && /DISABLE_LIVE_CLAUDE_POLISH\.marker/.test(helperSrc));
check("ANTHROPIC key never enters child env allowlists", !/MEDIA_ENV_KEY_NAMES[\s\S]{0,300}ANTHROPIC/.test(helperSrc) && !/APPROVED_ENV_KEY_NAMES[\s\S]{0,300}ANTHROPIC/.test(helperSrc));
check("UI shows 대본 생성 방식 + Claude 적용/미적용 배지", wizardSrc.includes("대본 생성 방식: 로컬 후보 선별 → Claude 1회 보정") && wizardSrc.includes("Claude 보정 적용됨") && wizardSrc.includes("Claude 보정 미적용 — 로컬 대본 사용 중"));

// [B] 실제 TTS — 검증된 scene-paced 스크립트 재사용 + no-key fail-closed
check("realTtsCreate reuses proven scene-paced TTS script", /SCRIPT_ELEVENLABS_SCENE_TTS\s*=\s*"scripts\/build-elevenlabs-scene-paced-tts-from-script\.mjs"/.test(helperSrc));
check("real tts-script sizes scene durations from narration length (하드트림 방지)", /Math\.ceil\(n\.length \/ 6\)/.test(helperCode) && /Math\.min\(8,\s*Math\.max\(3,/.test(helperCode));
check("media env allowlist is exactly the 4 ELEVENLABS keys", /MEDIA_ENV_KEY_NAMES\s*=\s*\[\s*"ELEVENLABS_API_KEY",\s*"ELEVENLABS_VOICE_ID",\s*"ELEVENLABS_MODEL_ID",\s*"ELEVENLABS_VOICE_LABEL",\s*\]/.test(helperSrc.replace(/\r?\n\s*/g, " ").replace(/\s+/g, " ")) || ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID", "ELEVENLABS_VOICE_LABEL"].every((k) => new RegExp(`MEDIA_ENV_KEY_NAMES[\\s\\S]{0,220}"${k}"`).test(helperSrc)));
check("tts gate trusts only live elevenlabs summary (mock 불인정)", /provider\s*===\s*"elevenlabs"\s*&&[\s\S]{0,80}liveApiCallPerformed\s*===\s*true/.test(helperCode));
// [A2] ELEVENLABS env는 realTtsCreate child에만 전달 (Codex finding 1 fix)
check("buildSanitizedChildEnv does NOT copy media env by default", /buildSanitizedChildEnv\(opts\?:\s*\{\s*includeMediaEnv\?:\s*boolean\s*\}\)/.test(helperCode) && /opts\?\.includeMediaEnv\s*===\s*true/.test(helperCode));
check("runOperatorScript exposes includeMediaEnv option", /includeMediaEnv\?:\s*boolean/.test(helperCode));
check("runOperatorScript threads includeMediaEnv into child env builder", /buildSanitizedChildEnv\(\s*\{\s*includeMediaEnv:\s*opts\?\.includeMediaEnv\s*===\s*true\s*\}\s*\)/.test(helperCode));
check("route sets includeMediaEnv:true ONLY on realTtsCreate", (routeCode.match(/includeMediaEnv:\s*true/g) ?? []).length === 1 && /realTtsCreate[\s\S]{0,600}includeMediaEnv:\s*true/.test(routeCode));
for (const otherAction of ["realSceneImagesCreate", "finalVideoCreate", "wizardPreflight", "actualUpload"]) {
  // 해당 action 핸들러 블록 내부에 includeMediaEnv:true가 없어야 한다(다음 action 시작 전까지 스캔).
  const idx = routeCode.indexOf(`action === "${otherAction}"`);
  const nextIdx = routeCode.indexOf("includeMediaEnv: true", idx);
  const blockEnd = idx === -1 ? -1 : routeCode.indexOf('action === "', idx + 20);
  const hasInBlock = idx !== -1 && nextIdx !== -1 && (blockEnd === -1 || nextIdx < blockEnd);
  check(`route does NOT set includeMediaEnv:true for ${otherAction}`, !hasInBlock);
}
check("route no-key TTS message is fail-closed", routeSrc.includes("실제 음성 키가 없어 생성하지 못했습니다. 테스트 소리는 업로드할 수 없습니다."));
check("UI real-tts states exist (실제 음성 준비 / 음성 키 필요)", wizardSrc.includes("실제 음성 준비") && wizardSrc.includes("음성 키 필요"));
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
check("images script has submission hard cap (6) and no retry loop", /SUBMISSION_HARD_CAP\s*=\s*6/.test(imgScriptSrc));
check("images script reuses proven _chatgpt-image-core", /_chatgpt-image-core\.mjs/.test(imgScriptSrc));
check("images script never uploads/publishes", !/instagram|youtube|blob\.put|googleapis|@vercel/i.test(imgScriptSrc));
check("images script forbids paid image APIs (openai api key 사용 없음)", !/OPENAI_API_KEY|api\.openai\.com|bfl\.ai|gemini/i.test(imgScriptCode));
check("route passes hardcoded ALLOW_CHATGPT_IMAGE extraEnv only for images action", /realSceneImagesCreate[\s\S]{0,900}extraEnv:\s*\{\s*ALLOW_CHATGPT_IMAGE:\s*"1"\s*\}/.test(routeCode) && (routeCode.match(/extraEnv/g) ?? []).length <= 2);
check("images gate requires 6/6 SAVED_OK portrait files", /savedScenes\.length\s*===\s*6/.test(helperCode) && /s\.width\s*>=\s*900/.test(helperCode));
check("UI image states exist (장면 이미지 준비 / 이미지 생성 필요)", wizardSrc.includes("장면 이미지 준비") && wizardSrc.includes("이미지 생성 필요"));

// [D] 최종 mp4 — 실제 자산 필수 + ffprobe 검증 + C:\tmp
check("final-video once script exists", vidScriptSrc.length > 0);
check("video script rejects non-elevenlabs / non-live audio summary", /provider !== "elevenlabs"/.test(vidScriptSrc) && /liveApiCallPerformed !== true/.test(vidScriptSrc));
check("video script rejects placeholder images (allReady required)", /allReady !== true/.test(vidScriptSrc));
check("video script enforces C:\\tmp out-dir", /MEDIA_ROOT_RE\.test\(abs/.test(vidScriptSrc) && vidScriptSrc.includes("money-shorts-os"));
// [D2] 최종영상 스크립트: 5개 입력/출력 전부 C:\tmp\money-shorts-os\ 하위 강제 (Codex finding 2 fix)
check(
  "video script forces ALL 5 path args under C:\\tmp\\money-shorts-os",
  /MEDIA_ROOT_RE\s*=\s*\/\^C:\[\\\\\/\]\+tmp\[\\\\\/\]\+money-shorts-os\[\\\\\/\]\+\/i/.test(vidScriptSrc) &&
    ["--script", "--tts-script", "--audio-summary", "--images-dir", "--out-dir"].every((f) => vidScriptSrc.includes(f)) &&
    /for\s*\(const \[flag, abs\] of PATH_INPUTS\)/.test(vidScriptSrc) &&
    /MEDIA_ROOT_RE\.test\(abs/.test(vidScriptSrc),
);
check("video script validates 1080x1920 + 15~60s + audio/video streams + size", /width1080/.test(vidScriptSrc) && /height1920/.test(vidScriptSrc) && /duration15to60/.test(vidScriptSrc) && /hasAudioStream/.test(vidScriptSrc) && /fileSizePositive/.test(vidScriptSrc));
check("video script output marked notUploaded", /notUploaded:\s*true/.test(vidScriptSrc));
check("helper final video gate re-checks 1080x1920/15~60s/streams", /videoSummary\.width\s*===\s*1080/.test(helperCode) && /videoSummary\.height\s*===\s*1920/.test(helperCode) && /durationSec\s*>=\s*15/.test(helperCode));
check("UI final video states exist (최종 영상 준비 / 시안 영상 · 업로드 불가)", wizardSrc.includes("최종 영상 준비") && wizardSrc.includes("시안 영상") && wizardSrc.includes("업로드 불가"));
check("UI preview streams final video (?video=final)", /video=final&topicId=/.test(wizardSrc));

// [E] media quality gate / upload gate — mock·시안 업로드 원천 차단
check("content unit requires real tts/images/final mp4 (fail-closed reasons)", ["real_tts_required", "real_scene_images_required", "final_mp4_required", "media_quality_gate_not_ready"].every((r) => helperSrc.includes(r)));
check("actualUpload re-verifies media gate before spawn (게이트 1.5)", /actualUpload[\s\S]{0,2200}readWizardRealMediaState\(topicId\)[\s\S]{0,700}MEDIA_GATE_USER_MESSAGE/.test(routeSrc));
check("media gate blocker codes exist", ["REAL_TTS_REQUIRED", "REAL_SCENE_IMAGES_REQUIRED", "FINAL_MP4_REQUIRED"].every((c) => helperSrc.includes(c)) && routeSrc.includes("MEDIA_QUALITY_GATE_NOT_READY"));
check("upload block user message exact (아직 실제 음성/… 업로드를 막았습니다)", routeSrc.includes("아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다.") && wizardSrc.includes("아직 실제 음성/실제 장면 이미지가 들어간 최종 영상이 아닙니다. 업로드를 막았습니다."));
check(
  "new pipeline actions never build --arm",
  /case "realTtsCreate"[\s\S]*?case "status"/.test(helperCode) &&
    !(/case "realTtsCreate"[\s\S]*?case "status"/.exec(helperCode)?.[0]?.includes("--arm") ?? true),
);
check("--arm single-gate contract intact (actualUpload only + allowArm gate)", (helperSrc.match(/ARM_ARG_TOKEN,?\s*\]/g) ?? []).length === 1 && /allowArm\s*!==\s*true/.test(helperCode));
check("new create actions are local-dev gated in route", ["realTtsCreate", "realSceneImagesCreate", "finalVideoCreate", "realMediaStatus"].every((a) => new RegExp(`LOCAL_SCRIPT_ACTIONS[\\s\\S]{0,700}"${a}"`).test(routeSrc)));
check("GET final video stream is enum only", /videoParam\s*===\s*"muxed"\s*\|\|\s*videoParam\s*===\s*"silent"\s*\|\|\s*videoParam\s*===\s*"final"/.test(routeCode));
check("real audio stream restricted to summary path + C:\\tmp prefix + mp3/m4a", /readWizardRealAudioBytes/.test(routeCode) && /WIZARD_VIDEO_ALLOWED_PREFIX/.test(helperCode) && /\.mp3|\.m4a/.test(helperSrc));

// ── 결과 ─────────────────────────────────────────────────────────────────────
console.log("");
console.log(`${passes + failures} checks — ${passes} PASS, ${failures} FAIL`);
process.exit(failures > 0 ? 1 : 0);
