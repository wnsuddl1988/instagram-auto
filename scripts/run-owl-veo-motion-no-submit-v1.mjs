#!/usr/bin/env node

/**
 * 부엉이 애널리스트(owl3dv5) Scene 1(hook)을 Gemini/Veo(Flow) image-to-video로
 * 넘기기 위한 no-submit 리허설.
 *
 * 하는 일: Chrome CDP 접속 → Veo 도구 진입 → 9:16 세로 설정 → 참조 이미지 첨부
 * (owl_s1_hook.png) → 프롬프트 입력 + DOM 검증 → 전송 버튼 활성 여부 확인.
 * 전송(click)은 하지 않는다 — Owner가 결과를 육안 확인한 뒤 별도 승인으로
 * --execute 실행기를 따로 만든다.
 *
 * run-minjae-veo-motion-once-v1.mjs와 달리 SHA-256 고정·1회 제출 예산 원장·
 * 승인 패킷 계약 같은 무거운 게이트는 없다 — 리허설 단계이므로 가볍게 유지한다.
 * 실행 자체는 fail-closed(ALLOW_GEMINI_VEO=1)로 막혀 있고, submit은 코드 경로
 * 자체가 없다.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  activateVideoTool,
  attachRef,
  checkSendEnabled,
  detectQuotaOrRefusal,
  ensureChrome,
  typeAndVerify,
  setVerticalMode,
} from "./_gemini-veo-core.mjs";
import { canAdvanceToNextGeminiProfile } from "./_gemini-veo-profile-chain.mjs";

// 공용 GEMINI_VEO_PROFILE_CHAIN(2/3/4)은 다른 스크립트(Minjae 등)가 참조하므로
// 건드리지 않는다. 현재 실사용 중인 계정은 AI-Gemini-1(포트 9223)뿐이므로, 이
// 리허설 전용으로 1번 프로필을 로컬에 정의해 사용한다.
const OWL_PROFILE_CHAIN = Object.freeze([
  Object.freeze({
    profileId: 1,
    desktopShortcutName: "Gemini 1",
    cdpPort: 9223,
    userDataDir: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
  }),
]);

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const REF_IMAGE = getArg("--ref-image") || "C:/tmp/owl-8scene-final/owl_s1_hook.png";
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-veo-motion/s1-hook-no-submit";

if (!fs.existsSync(REF_IMAGE)) {
  console.error(`ABORT: reference image not found: ${REF_IMAGE}`);
  process.exit(1);
}

// candidate-02 Scene 1의 서사 의도(스마트폰을 보다 의아함→날카로운 관찰)를
// 그대로 모션 지시로 옮긴다. 캐릭터 외형 변경 금지, 텍스트/숫자 렌더링 금지
// (HC-10과 동일 원칙)를 명시해 8장 전체에 재사용할 프롬프트 패턴의 기준으로 삼는다.
const OWL_S1_MOTION_PROMPT = `Animate this 3D character illustration. Keep the owl analyst character's appearance exactly as in the reference image — same charcoal waistcoat, burgundy tie and pocket square, black sunglasses resting on the forehead, small gold ring on one talon, sharp focused eyes. Do NOT change the character design, outfit, or colors.

Continuous medium shot, camera stays mostly stable with only a very subtle handheld breathing motion. Silent, 9:16 vertical format.

ACTION SEQUENCE:
1. The owl is already holding the phone up, looking at its blank screen with a sharp, focused expression (mouth closed, no smiling).
2. The owl slowly narrows its eyes slightly further, as if noticing something important on the screen — a small, restrained head tilt of a few degrees toward the phone.
3. The free wing/hand resting near the waist stays mostly still, with only a small natural settling motion.
4. Feathers show subtle, natural micro-movement (breathing, light settling) — no exaggerated bouncing.

ABSOLUTE RULES:
- No new text, numbers, subtitles, logos, or UI ever appear on the phone screen or anywhere in frame — the phone screen stays blank throughout.
- No new person, hand, or object enters the frame.
- No camera cut, zoom, or pan — one continuous shot.
- The character's face, outfit, and proportions must not distort or morph.
- Expression stays serious and sharp — no smiling, no smirking.`;

const REQUIRED_KEYWORDS = [
  { key: "owl analyst character's appearance exactly", label: "캐릭터 외형 고정" },
  { key: "phone screen stays blank", label: "텍스트/숫자 금지(HC-10)" },
  { key: "No camera cut, zoom, or pan", label: "단일 컷 고정" },
  { key: "no smiling, no smirking", label: "느끼함 재발 방지" },
];

function log(profile, message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][Gemini ${profile.profileId}] ${message}`);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function inspectProfile(profile) {
  const evidence = { profileId: profile.profileId, cdpPort: profile.cdpPort };
  let page = null;
  try {
    await ensureChrome(profile.cdpPort, profile.userDataDir, (m) => log(profile, m));
    const browser = await chromium.connectOverCDP(`http://localhost:${profile.cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error("browser_context_missing");
    page = await context.newPage();

    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);

    const url = new URL(page.url());
    const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
    if (/accounts\.google\.com|signin/i.test(url.href) || signIn) {
      return { profileId: profile.profileId, state: "login_required", evidence };
    }

    const opened = await activateVideoTool(page, (m) => log(profile, m), (m) => console.warn(`[WARN] ${m}`));
    if (!opened) return { profileId: profile.profileId, state: "ambiguous_failure", evidence: { ...evidence, reason: "video_tool_not_opened" } };

    const quotaAfterOpen = await detectQuotaOrRefusal(page);
    if (quotaAfterOpen?.type === "quota") return { profileId: profile.profileId, state: "quota_exhausted", evidence: { ...evidence, detail: quotaAfterOpen } };
    if (quotaAfterOpen?.type === "refusal") return { profileId: profile.profileId, state: "refusal", evidence: { ...evidence, detail: quotaAfterOpen } };
    if (quotaAfterOpen?.type === "transient") return { profileId: profile.profileId, state: "transient_error", evidence: { ...evidence, detail: quotaAfterOpen } };

    const verticalOk = await setVerticalMode(page, (m) => log(profile, m), (m) => console.warn(`[WARN] ${m}`));
    evidence.verticalOk = verticalOk;

    const attach = await attachRef(page, REF_IMAGE, (m) => log(profile, m), (m) => console.warn(`[WARN] ${m}`));
    evidence.attach = attach;

    const typed = await typeAndVerify(page, OWL_S1_MOTION_PROMPT, REQUIRED_KEYWORDS, (m) => log(profile, m));
    evidence.typed = typed;

    const quotaAfterType = await detectQuotaOrRefusal(page);
    if (quotaAfterType?.type === "quota") return { profileId: profile.profileId, state: "quota_exhausted", evidence: { ...evidence, detail: quotaAfterType } };
    if (quotaAfterType?.type === "refusal") return { profileId: profile.profileId, state: "refusal", evidence: { ...evidence, detail: quotaAfterType } };
    if (quotaAfterType?.type === "transient") return { profileId: profile.profileId, state: "transient_error", evidence: { ...evidence, detail: quotaAfterType } };

    const sendEnabled = await checkSendEnabled(page);
    evidence.sendEnabled = sendEnabled;

    log(profile, `READY (no submit). sendEnabled=${sendEnabled}`);
    return { profileId: profile.profileId, state: "ready", evidence };
  } catch (error) {
    return { profileId: profile.profileId, state: "unavailable", evidence: { ...evidence, reason: String(error?.message ?? error).slice(0, 200) } };
  } finally {
    // no-submit 리허설이므로 탭을 열어둔 채로 두어 Owner가 육안으로 최종 상태를
    // 확인할 수 있게 한다(자동 전송 없음). 닫지 않는다.
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const results = [];
for (const profile of OWL_PROFILE_CHAIN) {
  log(profile, "checking Veo no-submit readiness for owl Scene 1");
  const result = await inspectProfile(profile);
  results.push(result);
  log(profile, `state=${result.state}`);
  if (result.state === "ready" || !canAdvanceToNextGeminiProfile(result.state)) break;
}

const summary = {
  schemaVersion: "owl_veo_motion_no_submit_v1",
  refImage: REF_IMAGE,
  promptLength: OWL_S1_MOTION_PROMPT.length,
  results,
  submitted: false,
};
const summaryPath = path.join(OUT_DIR, "summary.json");
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
process.exit(results.some((r) => r.state === "ready") ? 0 : 1);
