#!/usr/bin/env node

/**
 * 부엉이 애널리스트(owl3dv5) 8장 중 하나를 Gemini 내장 Veo에 실제 제출해
 * 영상을 1회 생성한다. --scene으로 _owl-veo-scene-prompts.mjs의 키를 지정한다.
 *
 * 사용: node run-owl-veo-motion-execute-once-v1.mjs --scene s2_loss_aversion --owner-approved-once
 *
 * 안전장치:
 *   - ALLOW_GEMINI_VEO=1 fail-closed (기존 게이트 재사용)
 *   - --owner-approved-once 없으면 무조건 거부 (Owner 명시 승인 없이 실행 불가)
 *   - 출력 파일이 이미 있으면 거부 (덮어쓰기 금지, 재실행 시 새 파일명 필요)
 *   - 실패해도 자동 재시도하지 않음 — 결과를 그대로 보고하고 종료
 *   - quota 감지 시 exit code 3으로 구분 반환 (오케스트레이터가 Flow 폴백 판단에 사용)
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  activateVideoTool,
  attachRef,
  captureQuotaBaseline,
  checkSendEnabled,
  classifyVeoBody,
  detectQuotaOrRefusal,
  ensureChrome,
  setModel,
  typeAndVerify,
  setVerticalMode,
} from "./_gemini-veo-core.mjs";
import { OWL_VEO_SCENES as OWL_VEO_SCENES_EP1 } from "./_owl-veo-scene-prompts.mjs";
import { failFast } from "./_owl-browser-diagnostics.mjs";
import { pathToFileURL } from "node:url";

if (!process.argv.includes("--owner-approved-once")) {
  console.error("ABORT: --owner-approved-once flag is required for a live submission.");
  process.exit(2);
}

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// 표준 모델은 Flash-Lite(크레딧 소모 최소, 품질 동일, Owner 확정)지만, 진단
// 목적으로 다른 모델을 일회성 테스트할 수 있게 오버라이드를 허용한다.
const MODEL_OVERRIDE = getArg("--model");

// quota 감지(detectQuotaOrRefusal)는 document.body.innerText 전체를 스캔한다
// (_gemini-veo-core.mjs). 페이지 왼쪽 갤러리에 과거 세션의 실패 카드가 남아있으면
// (예: 이전 편에서 한도에 걸렸던 카드의 상태 라벨) 그 텍스트가 지금 제출과
// 무관하게 "현재 한도 소진"으로 오판된다(2026-09-17, 3편 씬1에서 재현 — 2편
// 작업 중 남은 "Calculator Scene A" 카드의 라벨이 매칭됨). Owner가 실제 사용량에
// 문제없음을 확인한 경우, 이 플래그로 사전 quota 체크만 건너뛴다 — 제출 자체가
// 실제로 거부되면 이후 폴링 단계에서 여전히 감지되어 잡힌다.
const SKIP_QUOTA_CHECK = process.argv.includes("--skip-quota-check");

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

const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-veo-motion";
// 막혔을 때 사람이 직접 처리하고 이어갈 수 있게 한다. 외부 UI가 바뀌거나
// 로그인 세션이 끊겨도 완전히 멈추지 않는다.
const MANUAL_ASSIST = process.argv.includes("--manual-assist");
const OUTPUT_VIDEO = path.join(OUT_DIR, SCENE.outputName);
const PARTIAL_VIDEO = `${OUTPUT_VIDEO}.part`;

// 자동화 전용 격리 프로필(AI-Gemini-1, 재생성 포함)은 Veo 제출 후 "분석
// 중"에서 8분 타임아웃(8회) 및 좁은 뷰포트로 인한 도구 메뉴 진입 실패를
// 반복했다(2026-09-17~18). Owner가 같은 프롬프트·기준 이미지를 본인 Chrome
// 기본(Default) 프로필로 바탕화면 gemini1 바로가기를 통해 직접 제출하자
// 정상 완료 — 기본 프로필로 전환한다(Owner 승인 2026-09-18). 평소 쓰는
// Chrome과 같은 프로필 디렉토리를 동시에 열 수 없으므로, 자동화 실행 전에
// Owner가 기본 프로필 Chrome 창을 전부 닫아둔 상태여야 한다.
const PROFILE = {
  profileId: 1,
  desktopShortcutName: "Gemini 1",
  cdpPort: 9223,
  userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data",
};

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
  console.log(`[${new Date().toISOString().slice(11, 19)}][owl-veo-execute:${SCENE_KEY}] ${message}`);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function readStatusText(page) {
  // [role="menu"] 는 제외한다 — 설정/계정 메뉴가 열려 있으면 "사용량 한도" 같은
  // 메뉴 항목 이름이 실제 quota 경고처럼 오판되는 원인이었다(2026-09-16 발견).
  const regions = page.locator('[role="dialog"], [role="alert"], [role="status"], [aria-live]');
  const text = [];
  const count = await regions.count();
  for (let i = 0; i < count; i += 1) {
    const region = regions.nth(i);
    if (!(await region.isVisible().catch(() => false))) continue;
    const value = await region.innerText().catch(() => "");
    if (value) text.push(value);
  }

  // <main> 안에 좌측 "최근 채팅" 사이드바(nav)가 포함돼 있어, 과거 세션의
  // 실패 대화 제목("Video Generation Limit Reached" 등)이 그대로 딸려와
  // 지금 막 제출한 요청의 결과로 오판되는 원인이었다(2026-09-17, 3편 씬1에서
  // 재현 — DEBUG 로그로 main.innerText에 사이드바 채팅 목록 전체가 포함됨을
  // 확인 후 제거). nav/사이드바 요소를 명시적으로 제거하고 본문만 남긴다.
  const mainLocator = page.locator("main").first();
  if (await mainLocator.count() > 0) {
    const mainText = await mainLocator.evaluate((el) => {
      const clone = el.cloneNode(true);
      clone.querySelectorAll('[role="menu"], nav, [role="navigation"]').forEach((n) => n.remove());
      return clone.innerText || "";
    }).catch(() => "");
    if (mainText) text.push(mainText);
  }

  return text.join("\n");
}

function writeResultAndExit(result, exitCode) {
  fs.writeFileSync(
    path.join(OUT_DIR, `${SCENE.id}-execution-result.json`),
    JSON.stringify(result, null, 2) + "\n",
    "utf8",
  );
  console.log(JSON.stringify(result, null, 2));
  process.exit(exitCode);
}

await ensureChrome(PROFILE.cdpPort, PROFILE.userDataDir, log);
const browser = await chromium.connectOverCDP(`http://localhost:${PROFILE.cdpPort}`);
const context = browser.contexts()[0];
if (!context) {
  console.error("ABORT: browser_context_missing");
  process.exit(1);
}
const page = await context.newPage();

try {
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2_500);

  const url = new URL(page.url());
  const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
  if (/accounts\.google\.com|signin/i.test(url.href) || signIn) {
    // 로그인은 사람이 해야 하는 대표적인 경우다. 수동 개입 모드면 여기서 기다린다.
    const resumed = await failFast(page, {
      outDir: OUT_DIR,
      label: "login-required",
      what: "Gemini 로그인이 필요합니다. 브라우저에서 로그인해 주세요",
      selectors: ["로그인 버튼 또는 accounts.google.com 리다이렉트"],
      hint: "CDP 프로필의 세션이 만료됐습니다. 한 번 로그인해두면 다음부터는 유지됩니다.",
      manualAssist: MANUAL_ASSIST,
    });
    if (!resumed) process.exit(1);
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);
  }

  // 사이드바(최근 채팅 목록)에 과거 세션의 실패 대화 제목이 그대로 남아있으면
  // 이후 quota 스캔이 그걸 "지금 막 생긴 문제"로 오판한다(2026-09-17 재현).
  // 도구를 열기 전, 즉 이번 요청과 무관한 상태에서 페이지 텍스트를 찍어 이후
  // 모든 quota 체크가 새로 나타난 줄만 보도록 한다.
  const quotaBaseline = await captureQuotaBaseline(page);

  let opened;
  try {
    opened = await activateVideoTool(page, log, (m) => console.warn(`[WARN] ${m}`), SKIP_QUOTA_CHECK, quotaBaseline);
  } catch (error) {
    if (/quota_detected/.test(String(error?.message ?? error))) {
      writeResultAndExit({ schemaVersion: "owl_veo_execution_result_v1", scene: SCENE_KEY, status: "PRE_SUBMIT_QUOTA", failureReason: String(error.message).slice(0, 240) }, 3);
    }
    throw error;
  }
  if (!opened) {
    await failFast(page, {
      outDir: OUT_DIR,
      label: "video-tool-not-opened",
      what: "Gemini 의 동영상 생성 도구를 열지 못했습니다",
      selectors: ["도구 메뉴 → 동영상"],
      hint: "Gemini UI 에서 도구 진입 경로가 바뀌었을 수 있습니다. 이 단계는 이후 상태와 얽혀 있어 수동으로 이어받기 어렵습니다.",
      manualAssist: false,
    });
    process.exit(1);
  }

  // 부엉이 쇼츠는 Flash-Lite를 표준으로 쓴다(영상 1개당 한도 소진량이 다른
  // 모델보다 훨씬 적고 품질은 동일, Owner 확정). --model로 진단용 오버라이드
  // 가능(예: Flash-Lite가 응답 지연/장애일 때 Pro/Flash로 격리 테스트).
  // 실패해도 치명적이지 않으므로 경고만 남기고 진행한다.
  const targetModel = MODEL_OVERRIDE || "Flash-Lite";
  const modelSet = await setModel(page, targetModel, log, (m) => console.warn(`[WARN] ${m}`));
  if (!modelSet) log(`WARN: ${targetModel} 모델 전환 확인 실패 — 화면의 현재 모델로 진행`);

  // 네이티브 드롭다운 메뉴(세로모드 선택, 업로드 도구)는 Chrome 이 실제로 앞에
  // 있는 탭에서만 안정적으로 열린다. 병렬 배치(같은 CDP 세션, 여러 백그라운드
  // 탭)로 돌리면 백그라운드 탭에서 메뉴 클릭이 무효화되는 경우가 있었다
  // (2026-09-16 4탭 동시 실행 시 전부 "파일 menu item not found"로 실패).
  // 메뉴를 여는 각 단계 직전에 자신을 앞으로 가져와 짧게 포커스를 확보한다.
  await page.bringToFront();
  await setVerticalMode(page, log, (m) => console.warn(`[WARN] ${m}`));
  await page.bringToFront();
  await attachRef(page, SCENE.refImage, log, (m) => console.warn(`[WARN] ${m}`));
  await typeAndVerify(page, SCENE.prompt, SCENE.requiredKeywords, log);

  const preSubmitState = await detectQuotaOrRefusal(page, quotaBaseline);
  if (preSubmitState?.type === "quota" && SKIP_QUOTA_CHECK) {
    console.warn(`[WARN] quota_detected 무시(--skip-quota-check): "${preSubmitState.text}"`);
  } else if (preSubmitState?.type === "quota") {
    writeResultAndExit({ schemaVersion: "owl_veo_execution_result_v1", scene: SCENE_KEY, status: "PRE_SUBMIT_QUOTA", failureReason: preSubmitState.text }, 3);
  } else if (preSubmitState) {
    console.error(`ABORT: ${preSubmitState.type} detected before submit: ${preSubmitState.text}`);
    process.exit(1);
  }

  const sendEnabled = await checkSendEnabled(page);
  if (!sendEnabled) {
    console.error("ABORT: send button not enabled");
    process.exit(1);
  }

  const sendBtn = page.locator(
    'button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]',
  ).first();

  const RESPONSE_SELECTORS = [
    "main model-response",
    'main [data-test-id^="model-response"]',
    'main [data-testid^="model-response"]',
  ];
  const beforeCounts = {};
  for (const selector of RESPONSE_SELECTORS) beforeCounts[selector] = await page.locator(selector).count();

  log("clicking send — this is the real submission");
  await sendBtn.click();

  const DOWNLOAD_SELECTOR = [
    'button[aria-label*="다운로드"]',
    'button[aria-label*="Download"]',
    'a[download]',
  ].join(", ");

  let status = "TIMEOUT_PENDING_RECOVERY";
  let downloaded = false;
  let failureReason = null;
  const startedAt = Date.now();
  while (Date.now() - startedAt < 8 * 60_000) {
    await page.waitForTimeout(5_000);
    const elapsedSec = Math.round((Date.now() - startedAt) / 1000);
    const state = classifyVeoBody(await readStatusText(page), quotaBaseline);
    if (state?.type === "refusal") { status = "REFUSAL_NO_RETRY"; failureReason = state.text; break; }
    if (state?.type === "quota") { status = "POST_SUBMIT_QUOTA"; failureReason = state.text; break; }
    if (state?.type === "transient") { status = "TRANSIENT_AFTER_SUBMIT"; failureReason = state.text; break; }

    let newResponse = null;
    for (const selector of RESPONSE_SELECTORS) {
      const afterCount = await page.locator(selector).count();
      if (afterCount > (beforeCounts[selector] ?? 0)) {
        newResponse = page.locator(selector).nth(afterCount - 1);
        break;
      }
    }

    if (newResponse) {
      const downloadCandidates = newResponse.locator(DOWNLOAD_SELECTOR);
      const visibleCount = await downloadCandidates.count();
      if (visibleCount === 1) {
        try {
          const [download] = await Promise.all([
            page.waitForEvent("download", { timeout: 60_000 }),
            downloadCandidates.first().click(),
          ]);
          // saveAs()가 내부 임시 파일이 완전히 flush되기 전에 이동을 시도해
          // ENOENT로 실패하는 사례가 관찰됨. download.path()로 Playwright가
          // 이미 디스크에 받아둔 파일을 직접 복사하는 방식이 더 안정적이다.
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
    }
    log(`${elapsedSec}s elapsed; waiting for generated video...`);
  }

  if (!downloaded && status === "TIMEOUT_PENDING_RECOVERY") {
    status = "RESPONSE_TIMEOUT_NO_RETRY";
    failureReason = "new_response_with_single_download_not_observed_in_8min";
  }

  const result = {
    schemaVersion: "owl_veo_execution_result_v1",
    scene: SCENE_KEY,
    status,
    refImage: SCENE.refImage,
    outputVideo: downloaded ? OUTPUT_VIDEO : null,
    outputBytes: downloaded ? fs.statSync(OUTPUT_VIDEO).size : null,
    failureReason,
    finishedAt: new Date().toISOString(),
  };
  // 실패 시 절대 탭을 닫지 않는다. "8분 안에 우리 스크립트가 완료를 확인하지
  // 못함"은 "생성이 실패함"과 다르다 — 실제로 다운로드 저장 실패(Scene 2) 및
  // 타임아웃 후 지연 완료(Scene 3) 둘 다 관찰됐고, 자동으로 탭을 닫았다가
  // 진행 중이던 실제 결과를 확인 불가능하게 만든 사고가 있었다. 성공했을
  // 때만 닫는다. 실패한 탭이 쌓이는 부작용은 별도 정리 스크립트로 해소한다.
  if (downloaded) await page.close().catch(() => {});
  const exitCode = downloaded ? 0 : status === "POST_SUBMIT_QUOTA" ? 3 : 1;
  writeResultAndExit(result, exitCode);
} catch (error) {
  console.error(`ABORT: ${String(error?.message ?? error).slice(0, 300)}`);
  process.exit(1);
}
