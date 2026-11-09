#!/usr/bin/env node

/**
 * 부엉이 애널리스트(owl3dv5) 8장 중 하나를 labs.google/flow(Google Flow)에
 * 실제 제출해 영상을 1회 생성한다. Gemini 내장 Veo 한도 소진 시 폴백 경로.
 *
 * UI 구조(2026-09-16 read-only 탐색으로 확인):
 *   1. "동영상" 탭 클릭 (기본은 "이미지" 탭)
 *   2. "소재" 탭 클릭 (기본은 "프레임" — 우리는 참조 이미지 기반 생성이므로 소재)
 *   3. "9:16" 클릭, "x1" 클릭 (기본 16:9 / x2)
 *   4. 소재 추가 버튼(aria-label="프롬프트 상자에 소재 추가") → 업로드 아이콘 →
 *      filechooser로 이미지 첨부 → 애셋 목록에서 첫 옵션 클릭(프로젝트 캔버스에 배치)
 *   5. 프롬프트 입력창([contenteditable="true"])에 타이핑
 *   6. 전송 버튼(aria-label="생성 시작") 클릭
 *
 * 사용: node run-owl-flow-motion-execute-once-v1.mjs --scene s6_impact --owner-approved-once
 *
 * 안전장치:
 *   - ALLOW_GEMINI_VEO=1 fail-closed 재사용(Flow도 같은 Google AI 계정 자원이므로 동일 게이트)
 *   - --owner-approved-once 없으면 거부
 *   - 출력 파일이 이미 있으면 거부(덮어쓰기 금지)
 *   - 실패 시 탭을 닫지 않는다(Gemini 경로에서 얻은 교훈 — 늦게 완료될 수 있음)
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { ensureChrome, isCDPOpen } from "./_gemini-veo-core.mjs";
import { OWL_VEO_SCENES as OWL_VEO_SCENES_EP1 } from "./_owl-veo-scene-prompts.mjs";
import { failFast } from "./_owl-browser-diagnostics.mjs";
import { pathToFileURL } from "node:url";

if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: Gemini/Flow 경로 차단 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1");
  process.exit(2);
}
if (!process.argv.includes("--owner-approved-once")) {
  console.error("ABORT: --owner-approved-once flag is required for a live submission.");
  process.exit(2);
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// --scene-prompts "경로:export명" 으로 편(episode)별 프롬프트 모듈을 고른다.
// 기본은 1편(하위 호환). 오케스트레이터가 이 인자를 그대로 전달한다.
const scenePromptsArg = getArg("--scene-prompts");
const OWL_VEO_SCENES = scenePromptsArg
  ? await (async () => {
      const [modulePath, exportName] = scenePromptsArg.split(":");
      if (!modulePath || !exportName) {
        console.error('ABORT: --scene-prompts 는 "경로:export명" 형식이어야 합니다.');
        process.exit(2);
      }
      const resolved = path.resolve(modulePath);
      if (!fs.existsSync(resolved)) {
        console.error(`ABORT: 프롬프트 모듈을 찾을 수 없습니다: ${resolved}`);
        process.exit(2);
      }
      const mod = await import(pathToFileURL(resolved).href);
      if (!mod[exportName]) {
        console.error(`ABORT: ${resolved} 에 export "${exportName}" 이 없습니다.`);
        process.exit(2);
      }
      return mod[exportName];
    })()
  : OWL_VEO_SCENES_EP1;

const SCENE_KEY = getArg("--scene");
const SCENE = SCENE_KEY ? OWL_VEO_SCENES[SCENE_KEY] : null;
if (!SCENE) {
  console.error(`ABORT: unknown --scene "${SCENE_KEY}". Available: ${Object.keys(OWL_VEO_SCENES).join(", ")}`);
  process.exit(2);
}

const FLOW_MODEL_ALIASES = {
  lite: "Veo 3.1 - Lite",
  fast: "Veo 3.1 - Fast",
  quality: "Veo 3.1 - Quality",
};
const FLOW_MODEL = FLOW_MODEL_ALIASES[getArg("--model") || "fast"];
if (!FLOW_MODEL) {
  console.error(`ABORT: unknown --model "${getArg("--model")}". Available: ${Object.keys(FLOW_MODEL_ALIASES).join(", ")}`);
  process.exit(2);
}

const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-flow-motion";
const OUTPUT_VIDEO = path.join(OUT_DIR, SCENE.outputName);
const PARTIAL_VIDEO = `${OUTPUT_VIDEO}.part`;

const PROFILE = { profileId: 1, cdpPort: 9223, userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1" };
const FLOW_URL = "https://labs.google/fx/ko/tools/flow";

if (!fs.existsSync(SCENE.refImage)) {
  console.error(`ABORT: reference image not found: ${SCENE.refImage}`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });
if (fs.existsSync(OUTPUT_VIDEO) || fs.existsSync(PARTIAL_VIDEO)) {
  console.error(`ABORT: output already exists, refuse to overwrite: ${OUTPUT_VIDEO}`);
  process.exit(2);
}

function log(message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][owl-flow-execute:${SCENE_KEY}] ${message}`);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

// --manual-assist 를 주면, UI 요소를 못 찾았을 때 사람이 직접 처리하고
// 이어갈 수 있게 대기한다. 외부 UI가 바뀌어도 완전히 막히지 않는다.
const MANUAL_ASSIST = process.argv.includes("--manual-assist");

/**
 * UI 요소를 못 찾았을 때의 표준 처리.
 * 스크린샷·버튼 목록을 남기고, 수동 개입이 켜져 있으면 사람을 기다린다.
 * 사람이 처리했다고 하면 true 를 돌려주므로 호출부가 다시 시도할 수 있다.
 */
async function handleMissing(page, { label, what, selectors, hint, resumable = true }) {
  return failFast(page, {
    outDir: OUT_DIR,
    label,
    what,
    selectors,
    hint,
    // resumable:false 인 단계는 사람이 대신 해도 이후 상태가 어긋난다.
    // 진단만 남기고 대기 없이 중단한다.
    manualAssist: MANUAL_ASSIST && resumable,
  });
}

function writeResultAndExit(result, exitCode) {
  fs.writeFileSync(
    path.join(OUT_DIR, `${SCENE.id}-flow-execution-result.json`),
    JSON.stringify(result, null, 2) + "\n",
    "utf8",
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(exitCode);
}

const profileOpen = await isCDPOpen(PROFILE.cdpPort);
if (!profileOpen) {
  await ensureChrome(PROFILE.cdpPort, PROFILE.userDataDir, log);
}
const browser = await chromium.connectOverCDP(`http://localhost:${PROFILE.cdpPort}`);
const context = browser.contexts()[0];
if (!context) {
  console.error("ABORT: browser_context_missing");
  process.exit(1);
}
const page = await context.newPage();

try {
  await page.goto(FLOW_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const url = new URL(page.url());
  const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
  if (/accounts\.google\.com|signin/i.test(url.href) || signIn) {
    console.error("ABORT: login_required");
    process.exit(1);
  }

  const cookieAgree = await firstVisible(page.getByRole("button", { name: /^동의함$/ }));
  if (cookieAgree) { await cookieAgree.click(); await page.waitForTimeout(800); }

  const newProject = await firstVisible(page.getByText("새 프로젝트", { exact: true }));
  if (!newProject) {
    const resumed = await handleMissing(page, {
      label: "new-project",
      what: "새 프로젝트를 만들어 프로젝트 화면까지 들어가 주세요",
      selectors: ['"새 프로젝트" 버튼'],
      hint: "Flow 홈 화면 구성이 바뀌었을 수 있습니다.",
    });
    if (!resumed) process.exit(1);
    // 사람이 이미 프로젝트를 열었으므로 클릭하지 않는다.
  } else {
    await newProject.click();
    await page.waitForTimeout(2_500);
  }
  log(`new project opened: ${page.url()}`);

  const onboardingClose = await firstVisible(page.locator('button[aria-label="확인, 온보딩 메시지 닫기"]'));
  if (onboardingClose) { await onboardingClose.click(); await page.waitForTimeout(500); }

  // 새 프로젝트를 열면 우측에 "에이전트" 채팅 패널("무엇을 만들고 싶으신가요?")이
  // 기본으로 뜨는 넓은 레이아웃이 관찰됨(2026-09-16부로 Flow의 기본 동작으로
  // 보임). 이 패널이 떠 있으면 구형 "설정 트리거" 버튼이 hidden 처리되므로,
  // 패널의 닫기(X) 버튼을 먼저 눌러 일반 컴포저 상태로 전환한다.
  const agentPanelVisible = await firstVisible(page.getByText("무엇을 만들고 싶으신가요?", { exact: false }));
  if (agentPanelVisible) {
    const agentPanelClose = await firstVisible(page.locator('button[aria-label*="닫기"], button[aria-label*="Close"]'));
    if (agentPanelClose) {
      await agentPanelClose.click();
      await page.waitForTimeout(1_000);
      log("agent panel closed");
    }
  }

  // 설정 진입점이 "설정 트리거"(구, 프로젝트 컴포저 내장)에서 "설정"(신,
  // aria-label="설정", text="tune")으로 바뀌었다 — 열리는 패널은 "에이전트
  // 설정"이라는 이름이지만 실제로는 "동영상 생성 기본값"(비율/개수/모델)을
  // 담고 있고, 저장하면 이 프로젝트의 다음 생성에 실제로 반영되는 것을
  // read-only 재탐색으로 검증했다(저장 후 재오픈 시 값이 유지됨).
  // 두 selector 후보를 모두 시도해 어느 UI가 떴든 대응한다. 프로젝트 진입
  // 직후 DOM이 아직 완전히 그려지지 않은 타이밍에 걸리는 사례가 있었으므로
  // 최대 5회(1초 간격) 재시도한다.
  let settingsEntry = null;
  for (let attempt = 0; attempt < 5 && !settingsEntry; attempt += 1) {
    settingsEntry = await firstVisible(
      page.locator('button[aria-label="설정 트리거"], button[aria-label="설정"]'),
    );
    if (!settingsEntry) await page.waitForTimeout(1_000);
  }
  if (!settingsEntry) {
    // 설정 패널을 사람이 열어준 뒤 이어간다. 패널만 열리면 아래의 비율·모델
    // 검증은 프로그램이 그대로 수행하므로, 모델이 Lite인지 확인하는 안전장치는
    // 유지된다(모델을 잘못 고르면 실사화되므로 이 검증은 건너뛸 수 없다).
    const resumed = await handleMissing(page, {
      label: "settings-entry",
      what: "설정 버튼을 눌러 '동영상 생성 기본값' 패널을 열어주세요",
      selectors: ['button[aria-label="설정 트리거"]', 'button[aria-label="설정"]'],
      hint: "Flow UI 개편 때 이 버튼이 tune 아이콘으로 바뀐 적이 있습니다. clickable-elements.txt 에서 실제 이름을 찾아 셀렉터에 추가하세요.",
    });
    if (!resumed) process.exit(1);
  } else {
    await settingsEntry.click();
  }
  await page.waitForTimeout(800);

  // 신 UI("에이전트 설정" 패널)에는 "이미지 생성 기본값"과 "동영상 생성 기본값"
  // 두 섹션이 있고 9:16/x1 텍스트가 각 섹션에 하나씩(총 2개) 존재한다. 반드시
  // 두 번째(동영상 섹션) 것을 선택해야 한다 — 첫 번째를 잘못 클릭하면 이미지
  // 생성 기본값만 바뀌고 동영상 기본값은 그대로 남는 사고가 났었다.
  // 구 UI(프로젝트 컴포저 내장 설정)에는 "동영상" 탭 클릭이 먼저 필요했으나
  // 이제는 이 패널 자체가 동영상 섹션을 포함하므로 탭 클릭은 생략 가능하면
  // 생략하고, 있으면 클릭해도 무해하다.
  const videoTabMaybe = await firstVisible(page.getByRole("tab", { name: /^동영상$/ }));
  if (videoTabMaybe) { await videoTabMaybe.click(); await page.waitForTimeout(500); }

  const verticalOptions = page.getByText("9:16", { exact: true });
  const verticalCount = await verticalOptions.count();
  const verticalTarget = verticalCount >= 2 ? verticalOptions.nth(1) : verticalOptions.first();
  if (verticalCount > 0) { await verticalTarget.click(); await page.waitForTimeout(400); }

  const x1Options = page.getByText("x1", { exact: true });
  const x1Count = await x1Options.count();
  const x1Target = x1Count >= 2 ? x1Options.nth(1) : x1Options.first();
  if (x1Count > 0) { await x1Target.click(); await page.waitForTimeout(400); }

  let modelDropdown = await firstVisible(page.locator("text=/Omni 1\\.1 Flash|Veo 3\\.1/"));
  if (!modelDropdown) {
    const resumed = await handleMissing(page, {
      label: "model-dropdown",
      what: `모델 드롭다운에서 "${FLOW_MODEL}" 을 선택해 주세요`,
      selectors: ["text=/Omni 1.1 Flash|Veo 3.1/"],
      hint: "모델을 잘못 고르면 3D 캐릭터가 실사로 바뀝니다. 반드시 Lite 계열인지 확인하세요.",
    });
    if (!resumed) process.exit(1);
    modelDropdown = await firstVisible(page.locator("text=/Omni 1\\.1 Flash|Veo 3\\.1/"));
    if (!modelDropdown) {
      console.error("ABORT: model_dropdown_still_missing_after_manual_assist");
      process.exit(1);
    }
  }
  // innerText에는 드롭다운 화살표 아이콘 텍스트("arrow_drop_down")가 섞여
  // 들어오므로 정확 일치가 아니라 지정 모델 문구 포함으로 판정한다.
  const currentModelText = (await modelDropdown.innerText().catch(() => "")).trim();
  if (!currentModelText.includes(FLOW_MODEL)) {
    await modelDropdown.click();
    await page.waitForTimeout(600);
    const modelOption = await firstVisible(page.getByText(FLOW_MODEL, { exact: true }));
    if (!modelOption) { console.error(`ABORT: model_option_missing: ${FLOW_MODEL}`); process.exit(1); }
    await modelOption.click();
    await page.waitForTimeout(600);
  }
  const confirmedModelText = (await modelDropdown.innerText().catch(() => "")).trim();
  if (!confirmedModelText.includes(FLOW_MODEL)) {
    console.error(`ABORT: model_not_confirmed_as_${FLOW_MODEL}: "${confirmedModelText}"`);
    process.exit(1);
  }
  log(`model confirmed: ${confirmedModelText.replace(/\s+/g, " ")}`);

  // 신 UI("에이전트 설정")는 명시적으로 "저장" 버튼을 눌러야 값이 유지된다
  // (구 UI는 즉시 반영되어 저장 버튼이 없었음). 저장 버튼이 없으면 구 UI로
  // 간주하고 건너뛴다.
  const saveSettingsBtn = await firstVisible(page.getByText("저장", { exact: true }));
  if (saveSettingsBtn) {
    await saveSettingsBtn.click();
    await page.waitForTimeout(1_000);
    log("settings saved");
  } else {
    // 구 UI는 패널을 닫아야 컴포저로 돌아간다.
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(500);
  }

  // 신 UI에서는 설정 패널을 닫아도 프로젝트 캔버스로 자동 복귀하지 않을 수
  // 있으므로, 소재 추가 버튼이 보이는지로 컴포저 상태 복귀를 확인한다.
  const addAssetBtn = await firstVisible(page.locator('button[aria-label="프롬프트 상자에 소재 추가"]'));
  if (!addAssetBtn) {
    // 파일 첨부는 사람이 대신 해도 이후 단계와 상태가 어긋나므로 진단만 남기고 멈춘다.
    await handleMissing(page, {
      label: "add-asset-button",
      what: "참조 이미지를 붙이는 '소재 추가' 버튼",
      selectors: ['button[aria-label="프롬프트 상자에 소재 추가"]'],
      hint: "이 단계는 수동 개입으로 이어받기 어렵습니다. 셀렉터를 고친 뒤 다시 실행하세요.",
      resumable: false,
    });
    process.exit(1);
  }
  await addAssetBtn.click();
  await page.waitForTimeout(800);

  // 신 UI의 애셋 모달은 좌측에 카테고리(전체/이미지/동영상/음성/캐릭터/아바타/
  // 업로드) 목록이 있고, "업로드" 아이콘 버튼(text=upload)으로 파일 선택창을
  // 연다. 업로드 후 애셋을 클릭하면 우측 미리보기 패널에 "프롬프트에 추가"
  // 버튼이 나타나는데, 이 버튼을 눌러야 실제로 캔버스/프롬프트에 반영된다
  // (이전 버전의 "리스트박스 옵션 클릭 한 번으로 배치" 가정은 더 이상 맞지 않음).
  const uploadIcon = page.locator("button").filter({ has: page.locator("text=upload") }).first();
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 8_000 }).catch(() => null),
    uploadIcon.click(),
  ]);
  if (!chooser) {
    await handleMissing(page, {
      label: "filechooser",
      what: "이미지 업로드 대화상자가 열리지 않았습니다",
      selectors: ["filechooser 이벤트 (8초 대기)"],
      hint: "업로드 아이콘 위치가 바뀌었을 수 있습니다.",
      resumable: false,
    });
    process.exit(1);
  }
  await chooser.setFiles(SCENE.refImage);
  await page.waitForTimeout(2_500);
  log("reference image uploaded");

  const addToPromptBtn = await firstVisible(page.getByText("프롬프트에 추가", { exact: true }));
  if (!addToPromptBtn) {
    await handleMissing(page, {
      label: "add-to-prompt",
      what: "업로드한 이미지를 프롬프트에 붙이는 버튼",
      selectors: ["애셋 목록의 첫 옵션"],
      hint: "업로드는 됐지만 프롬프트에 연결하지 못했습니다.",
      resumable: false,
    });
    process.exit(1);
  }
  await addToPromptBtn.click();
  await page.waitForTimeout(1_200);
  log("reference image placed on canvas");

  const promptBox = page.locator('[contenteditable="true"], textarea').first();
  if (await promptBox.count() === 0) {
    await handleMissing(page, {
      label: "prompt-box",
      what: "프롬프트 입력창",
      selectors: ['[contenteditable="true"]'],
      hint: "입력창이 iframe 안으로 들어갔거나 다른 요소로 바뀌었을 수 있습니다.",
      resumable: false,
    });
    process.exit(1);
  }
  await promptBox.click();
  // STYLE_LOCK 추가로 프롬프트가 약 2000자로 길어지면서 type()의 기본 30초
  // 액션 타임아웃을 초과하는 사례가 관찰됨(Scene 7에서 실제로 타임아웃 후 남은
  // 몇 글자만 놓친 상태로 이어감) — delay를 낮추고 타임아웃을 명시적으로 늘린다.
  // 2026-09-23 황소특보 CTA 재작업(입 움직임 문구 추가)으로 프롬프트가
  // 4295자까지 길어지면서 60초로도 두 차례 연속 타임아웃 발생 — 프롬프트
  // 길이에 비례해 여유를 두도록 고정값 대신 동적 계산으로 바꾼다.
  const typeTimeoutMs = Math.max(60_000, SCENE.prompt.length * 60);
  await promptBox.type(SCENE.prompt.replace(/\s*\n\s*/g, " ").trim(), { delay: 1, timeout: typeTimeoutMs });
  await page.waitForTimeout(700);

  const typed = (await promptBox.textContent().catch(() => "")) || "";
  const kwFails = SCENE.requiredKeywords.filter((k) => !typed.includes(k.key));
  if (kwFails.length > 0) {
    console.error(`ABORT: keyword_check_failed: ${kwFails.map((k) => k.label).join(", ")}`);
    process.exit(1);
  }
  log(`prompt verified (len=${typed.length}, kw=${SCENE.requiredKeywords.length}/${SCENE.requiredKeywords.length})`);

  const sendBtn = page.locator('button[aria-label="생성 시작"]').first();
  const sendEnabled = await sendBtn.isEnabled().catch(() => false);
  if (!sendEnabled) { console.error("ABORT: send_button_not_enabled"); process.exit(1); }

  log("clicking send — this is the real submission (Flow credits will be spent)");
  await sendBtn.click();

  // 신 UI(에이전트 패널)에서는 전송 후 "N 크레딧을 사용하여 1개 동영상 생성을
  // 시작하시겠습니까?" 승인 대화상자가 한 번 더 뜬다(구 UI에는 없었음). "승인"
  // 버튼을 눌러야 실제 생성이 시작되며, 안 누르면 무한정 대기 상태로 남는다.
  // "항상 승인"(재확인 스킵)은 명시적으로 피한다 — 매 생성마다 Owner가 승인한
  // 크레딧 지출을 육안 확인 가능한 상태로 유지하기 위함.
  //
  // 대화상자는 렌더링이 지연될 수 있어(2026-09-17 실측: 전송 직후 1회만 체크하면
  // 놓치고, 그 뒤로는 폴링 루프가 "생성 중"만 반복하며 승인 대기 상태를 계속
  // 몰라봄 — Scene 5에서 2분 넘게 미승인 상태로 방치된 사고 발생), 최대 15초
  // 동안 짧은 간격으로 재확인한다.
  async function tryApproveCredit() {
    const approveBtn = await firstVisible(page.getByText("승인", { exact: true }));
    if (approveBtn) {
      await approveBtn.click();
      await page.waitForTimeout(1_000);
      log("credit spend approved");
      return true;
    }
    return false;
  }

  let approved = await tryApproveCredit();
  let approvedAt = approved ? Date.now() : null;
  if (!approved) {
    for (let i = 0; i < 5 && !approved; i += 1) {
      await page.waitForTimeout(3_000);
      approved = await tryApproveCredit();
    }
    if (approved) approvedAt = Date.now();
    else log("승인 대화상자를 찾지 못함 — 폴링 루프에서 계속 재확인합니다");
  }

  // Flow는 완료된 클립을 캔버스에 '재생 아이콘이 있는 썸네일 카드'로 표시한다
  // (실제 <video>가 DOM에 없음). 결과 카드 상단 텍스트("Owl character ...")를
  // 찾아 그 바로 위 썸네일 영역을 좌표 기반으로 더블클릭해야 상세 플레이어가
  // 열린다. 그 안에서 더보기(⋮) → "미디어 다운로드" → 해상도("원본 크기")
  // 순으로 다운로드가 트리거된다. read-only 탐색으로 확인한 흐름.
  let status = "TIMEOUT_PENDING_RECOVERY";
  let downloaded = false;
  let failureReason = null;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10 * 60_000) {
    await page.waitForTimeout(5_000);
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);

    // 승인 대화상자가 지연 렌더링돼 위 재시도 창(15초)을 넘겨서 뜬 경우의
    // 마지막 방어선 — 매 폴링 사이클마다 승인 버튼 존재 여부를 다시 확인한다.
    if (!approved) {
      approved = await tryApproveCredit();
      if (approved) { approvedAt = Date.now(); log("승인 대화상자를 폴링 중 발견 — 승인 처리 완료"); }
    }

    // 승인 대화상자가 닫히는 전환 애니메이션 도중 video/다운로드 버튼이 DOM에
    // 잠깐 나타났다 사라지는 잔여 렌더링이 관찰됨(2026-09-17 Scene 7, 8 둘 다
    // 승인 후 5~6초 만에 "이미 상세 화면"으로 오판 — isVisible() 체크로도
    // 못 걸렀음). 실제 생성은 승인 후 최소 1분 이상 걸리므로, 승인 직후 15초는
    // 상세 화면 감지 자체를 건너뛰어 이 오탐을 원천 차단한다.
    const sinceApprovalMs = approvedAt ? Date.now() - approvedAt : Infinity;
    let alreadyInDetailView = false;
    if (sinceApprovalMs >= 15_000) {
      // 상세 플레이어 화면(video 태그 + 다운로드 버튼)으로 이미 전환돼 있는지
      // 확인한다. 완료 시 목록 뷰의 flow-video-tile 카드가 사라지고 곧바로
      // 상세 화면으로 넘어가는 경우가 실제로 관찰됨(2026-09-17 Scene 5, 6 둘 다:
      // 승인 후 1~2분 내 생성 완료 → 목록에 타일이 안 보이는 채로 상세 화면이
      // 이미 열려 있었음). 이 경우를 놓치면 "no video tile yet"만 반복하며
      // 완료를 영원히 인식하지 못한다.
      const videoEl = page.locator("video").first();
      const downloadBtnEl = page.locator('button[aria-label*="다운로드"], button[aria-label*="Download"]').first();
      alreadyInDetailView = await videoEl.isVisible().catch(() => false)
        && await downloadBtnEl.isVisible().catch(() => false);
      if (alreadyInDetailView) {
        log(`${elapsedSec}s elapsed; 상세 플레이어 화면이 이미 열려 있음 — 바로 다운로드 시도`);
      }
    }

    // 캔버스 카드의 실제 태그는 결과 클립이 flow-video-tile, 참조 이미지는
    // 다른 태그(예: flow-image-tile)로 관찰됨. 중요: flow-video-tile은 생성이
    // 진행 중일 때도 "N%" 진행률 자리표시자로 이미 DOM에 존재하므로(예: "30%"),
    // 카드 개수만으로 완료를 판단하면 안 된다. "Animate"는 완료된 카드의 정상
    // 제목에도 나타날 수 있어(예: "Animating owl analyst character") 제외
    // 조건에서 뺀다 — 오직 "%" 진행률 텍스트 유무로만 판정한다.
    //
    // 타일이 막 생성되기 시작한 극초반(승인 직후 5초 근처)에는 아직 "N%"
    // 표시가 붙기 전, 프롬프트 전문이 그대로 타일 텍스트에 잠깐 노출되는
    // 순간이 관찰됐다(2026-09-17 Scene 10 — 5초 시점에 "17%" + 프롬프트
    // 전문이 뒤섞인 텍스트였는데, 그 찰나에 %가 감지 안 되면 완료로 오판해
    // 존재하지 않는 상세 화면을 열려다 실패했다). alreadyInDetailView와
    // 동일한 15초 유예를 여기도 적용해 이 초반 오탐을 막는다.
    const videoTiles = (alreadyInDetailView || sinceApprovalMs < 15_000)
      ? []
      : await page.locator("flow-video-tile").all();
    let completedTileText = null;
    let completedTileLocator = null;
    for (const tile of videoTiles) {
      const tileText = (await tile.innerText().catch(() => "")).replace(/\s+/g, " ").trim();
      if (!/\d+%/.test(tileText)) { completedTileText = tileText; completedTileLocator = tile; break; }
    }
    if (!completedTileText && !alreadyInDetailView) {
      const progressText = videoTiles.length > 0 ? (await videoTiles[0].innerText().catch(() => "")).replace(/\s+/g, " ") : "(no video tile yet)";
      log(`${elapsedSec}s elapsed; still generating (${progressText})...`);
      continue;
    }

    try {
      if (!alreadyInDetailView) {
        // 완료된 카드의 제목 텍스트(아이콘 라벨 제외한 마지막 줄)를 정확히
        // 찾아 그 텍스트 요소를 클릭 앵커로 쓴다 — 카드 전체의 boundingBox
        // 좌표 계산보다 텍스트 매칭이 더 안정적으로 관찰됨(Scene 7에서 좌표
        // 방식은 실패, 텍스트 매칭 방식은 성공).
        const titleLine = completedTileText.split(" ").filter((w) => !/^(play_arrow|play_circle)$/.test(w)).join(" ");
        const titleWords = titleLine.split(" ").filter(Boolean).slice(0, 3).join(" ");
        // 2026-09-23 황소특보 CTA 재작업 중 관찰: 타일에 아이콘만 있고 제목
        // 텍스트가 전혀 없는 완료 카드가 있었다(titleWords가 빈 문자열 →
        // completed_tile_title_unparseable로 계속 실패). 이 경우 텍스트
        // 앵커링이 원천적으로 불가능하므로, flow-video-tile 요소 자체의
        // boundingBox로 좌표 폴백한다(Scene 7 때는 좌표 방식이 실패했다는
        // 기록이 있지만, 그건 "제목이 있는데도" 좌표를 썼던 경우였고 지금은
        // "제목 자체가 없는" 경우라 좌표가 유일한 방법이다).
        let box = null;
        if (titleWords) {
          const titleLocator = page.getByText(titleWords, { exact: false }).first();
          box = await titleLocator.boundingBox().catch(() => null);
        }
        if (!box && completedTileLocator) {
          box = await completedTileLocator.boundingBox().catch(() => null);
          if (box) log("타일 제목 텍스트 없음 — flow-video-tile 좌표로 폴백");
        }
        if (!box) throw new Error("completed_tile_title_locator_not_found");
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(1_200);
      }
      // 더블클릭 직후 상세 화면 렌더링이 아직 끝나지 않아 video 태그가 DOM에
      // 없는 순간을 잡을 수 있다(2026-09-17 Scene 9에서 관찰 — 1.2초 대기 후
      // 에도 result_detail_player_not_opened로 실패했지만, 그 시점의 project
      // 페이지를 직접 열어보면 이미 정상 완료돼 있었다). 즉시 실패 처리하지
      // 않고 짧게 한 번 더 재확인한다.
      let opened = (await page.locator("video").count()) > 0;
      if (!opened) {
        await page.waitForTimeout(2_000);
        opened = (await page.locator("video").count()) > 0;
      }
      if (!opened) throw new Error("result_detail_player_not_opened");

      // 상세 화면 상단의 다운로드 아이콘을 직접 클릭한다 — "더보기(⋮) → 미디어
      // 다운로드" 경로는 이 UI 버전에 존재하지 않았다(2026-09-17 Scene 5/6/7
      // 모두 다운로드 아이콘이 바로 노출됨, "더보기" 클릭은 응답 없이 멈춤).
      const downloadIconBtn = page.locator('button[aria-label*="다운로드"], button[aria-label*="Download"]').first();
      if (await downloadIconBtn.count() === 0) throw new Error("download_icon_missing");
      await downloadIconBtn.click();
      await page.waitForTimeout(600);
      const originalSizeOption = page.getByText("원본 크기", { exact: true }).first();

      let download;
      if (await originalSizeOption.count() > 0) {
        [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 30_000 }),
          originalSizeOption.click(),
        ]);
      } else {
        download = await page.waitForEvent("download", { timeout: 5_000 }).catch(() => null);
        if (!download) throw new Error("original_size_option_missing_and_no_direct_download");
      }
      try {
        await download.saveAs(PARTIAL_VIDEO);
      } catch (saveAsError) {
        const artifactPath = await download.path().catch(() => null);
        if (!artifactPath || !fs.existsSync(artifactPath)) throw saveAsError;
        fs.copyFileSync(artifactPath, PARTIAL_VIDEO);
      }
      const bytes = fs.readFileSync(PARTIAL_VIDEO);
      const hasMp4Header = bytes.subarray(0, 64).includes(Buffer.from("ftyp"));
      if (bytes.length < 100_000 || !hasMp4Header) throw new Error(`download_integrity_failed:size=${bytes.length},mp4=${hasMp4Header}`);
      fs.renameSync(PARTIAL_VIDEO, OUTPUT_VIDEO);
      downloaded = true;
      status = "SAVED_PENDING_MANUAL_QA";
    } catch (error) {
      status = "DOWNLOAD_FAILED_NO_RETRY";
      failureReason = String(error?.message ?? error).slice(0, 240);
    }
    break;
  }

  if (!downloaded && status === "TIMEOUT_PENDING_RECOVERY") {
    status = "RESPONSE_TIMEOUT_NO_RETRY";
    failureReason = "video_or_download_control_not_observed_in_10min";
  }

  const result = {
    schemaVersion: "owl_flow_execution_result_v1",
    scene: SCENE_KEY,
    status,
    refImage: SCENE.refImage,
    projectUrl: page.url(),
    outputVideo: downloaded ? OUTPUT_VIDEO : null,
    outputBytes: downloaded ? fs.statSync(OUTPUT_VIDEO).size : null,
    failureReason,
    finishedAt: new Date().toISOString(),
  };
  if (downloaded) await page.close().catch(() => {});
  writeResultAndExit(result, downloaded ? 0 : 1);
} catch (error) {
  console.error(`ABORT: ${String(error?.message ?? error).slice(0, 300)}`);
  process.exit(1);
}
