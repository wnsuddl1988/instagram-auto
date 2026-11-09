#!/usr/bin/env node

/**
 * labs.google/flow(독립 Flow 웹앱)에 read-only로 접속해 현재 로그인 계정의
 * 크레딧 잔액만 확인한다. 프로젝트 생성/저장/프롬프트 입력/제출은 전부
 * 네트워크 레벨에서 차단한다(POST/PUT/PATCH/DELETE 요청 abort).
 *
 * 목적: 방금 Gemini 내장 Veo에서 owl Scene 1을 1건 실제 생성했다. Gemini 내장
 * Veo와 labs.google/flow가 같은 계정의 공유 할당량을 쓰는지, 아니면 서로 다른
 * quota/크레딧 체계인지 확인한다. 이 스크립트만으로는 "공유 여부"를 완전히
 * 증명할 수 없다(Flow 쪽 실제 소비 없이는 비교 불가) — 여기서는 우선 Flow의
 * 현재 크레딧 잔액과 PRO 상태만 읽어 온다.
 */

import { isCDPOpen } from "./_gemini-veo-core.mjs";

const LIVE_APPROVAL_ARG = "--allow-browser-readonly";
if (!process.argv.includes(LIVE_APPROVAL_ARG)) {
  console.error(`BLOCKED: ${LIVE_APPROVAL_ARG} is required for live read-only Flow inspection.`);
  process.exit(2);
}

const PROFILE = { profileId: 1, cdpPort: 9223 };
const FLOW_URL = "https://labs.google/fx/ko/tools/flow";

function isForbiddenMutationRequest(request) {
  const method = request.method().toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return false;
  const url = request.url();
  if (!/(?:labs\.google|aisandbox-pa\.googleapis\.com)/i.test(url)) return false;
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let i = 0; i < count; i += 1) {
    const candidate = locator.nth(i);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

const profileOpen = await isCDPOpen(PROFILE.cdpPort);
if (!profileOpen) {
  console.error(`ABORT: Gemini ${PROFILE.profileId} CDP not open on port ${PROFILE.cdpPort}. Browser launch is forbidden in this read-only check.`);
  process.exit(2);
}

const { chromium } = await import("playwright");
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PROFILE.cdpPort}`);
const context = browser.contexts()[0];
if (!context) {
  console.error("ABORT: browser_context_missing");
  process.exit(1);
}

const blockedNetworkMutations = [];
const page = await context.newPage();
await page.route("**/*", async (route) => {
  const request = route.request();
  if (isForbiddenMutationRequest(request)) {
    blockedNetworkMutations.push({ method: request.method(), url: request.url() });
    await route.abort("blockedbyclient");
    return;
  }
  await route.continue();
});

try {
  await page.goto(FLOW_URL, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(3_000);

  const currentUrl = new URL(page.url());
  const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
  const authenticated = currentUrl.hostname === "labs.google" && !signIn && !/accounts\.google\.com|signin/i.test(currentUrl.href);

  const bodyText = await page.locator("body").innerText().catch(() => "");
  const proBadge = await firstVisible(page.locator("button").filter({ hasText: /^PRO$/ }));

  // 크레딧 잔액은 화면 어딘가(주로 헤더 근처)에 숫자로 표시됨. 정확한 selector가
  // 없을 수 있으므로 body 텍스트에서 "크레딧"/"credit" 인근 숫자를 함께 긁어
  // 사람이 최종 판단하도록 원문도 같이 남긴다.
  const creditMatch = bodyText.match(/([\d,]+)\s*(?:개의?\s*)?크레딧|credits?\s*[:：]?\s*([\d,]+)/i);
  const creditBalanceRaw = creditMatch ? (creditMatch[1] ?? creditMatch[2]) : null;
  const creditBalance = creditBalanceRaw ? Number(creditBalanceRaw.replace(/,/g, "")) : null;

  const result = {
    schemaVersion: "owl_flow_credit_balance_readonly_v1",
    profileId: PROFILE.profileId,
    currentUrl: page.url(),
    authenticated,
    proBadgeVisible: Boolean(proBadge),
    creditBalance,
    creditBalanceRawMatch: creditMatch ? creditMatch[0] : null,
    blockedNetworkMutations,
    note: "이 값만으로 Gemini 내장 Veo와 공유 할당량인지는 알 수 없음 — Flow에서 실제 1건 생성 전/후 비교가 필요.",
  };
  console.log(JSON.stringify(result, null, 2));
  await page.close().catch(() => {});
  process.exit(authenticated ? 0 : 1);
} catch (error) {
  console.error(`ABORT: ${String(error?.message ?? error).slice(0, 300)}`);
  process.exit(1);
}
