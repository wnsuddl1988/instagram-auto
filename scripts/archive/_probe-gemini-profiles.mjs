/**
 * Gemini 프로필 1→2→3 로그인·Veo 상태 점검 (읽기 전용, 제출 0회)
 * 사용: node scripts/_probe-gemini-profiles.mjs
 */
import { chromium } from "playwright";
import { spawn }    from "child_process";

const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const PROFILES = [
  { num: 1, port: 9223, dir: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1" },
  { num: 2, port: 9224, dir: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-2" },
  { num: 3, port: 9225, dir: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-3" },
];

function log(n, m) { console.log(`[${new Date().toISOString().slice(11,19)}][G${n}] ${m}`); }

async function isCDP(port) {
  try {
    const r = await fetch(`http://localhost:${port}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function launchChrome(port, dir) {
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${dir}`,
    "--no-first-run", "--no-default-browser-check",
    "https://gemini.google.com/app"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDP(port)) return true;
  }
  return false;
}

const results = [];

for (const prof of PROFILES) {
  const info = { profile: prof.num, port: prof.port };
  log(prof.num, `Checking port ${prof.port}...`);

  if (!(await isCDP(prof.port))) {
    log(prof.num, "CDP closed — launching Chrome...");
    const ok = await launchChrome(prof.port, prof.dir);
    if (!ok) { info.status = "launch_failed"; results.push(info); continue; }
    log(prof.num, "Chrome launched");
  } else {
    log(prof.num, "CDP already open");
  }

  let browser;
  try {
    browser = await chromium.connectOverCDP(`http://localhost:${prof.port}`);
    const ctx = browser.contexts()[0];
    if (!ctx) { info.status = "no_context"; results.push(info); await browser.close(); continue; }

    const page = await ctx.newPage();
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(2500);

    const url = page.url();
    info.url = url.slice(0, 80);
    const bodyText = await page.evaluate(() => document.body?.innerText || "").catch(() => "");

    // 로그인 판정
    const notLoggedIn = /accounts\.google\.com/.test(url) ||
      bodyText.slice(0, 400).includes("로그인") && !bodyText.slice(0, 400).includes("대화");
    info.logged_in = !notLoggedIn;

    if (notLoggedIn) {
      info.status = "not_logged_in";
      log(prof.num, "NOT logged in");
      await page.close(); await browser.close(); results.push(info); continue;
    }
    log(prof.num, "Logged in");

    // "업로드 및 도구" 버튼 탐색
    const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
    const tbCount = await toolBtn.count();
    info.tool_btn_found = tbCount > 0;

    if (tbCount === 0) {
      info.status = "tool_btn_missing";
      await page.close(); await browser.close(); results.push(info); continue;
    }

    await toolBtn.click();
    await page.waitForTimeout(1500);

    // 메뉴 항목 수집 — role 미사용이므로 텍스트 기반 + DOM 전체 텍스트 병행
    const menuItems = await page.evaluate(() => {
      // role 기반 (있으면)
      const roleItems = Array.from(document.querySelectorAll('[role="menuitem"], [role="option"]'))
        .map(el => el.textContent?.trim().slice(0, 60)).filter(Boolean);
      if (roleItems.length > 0) return roleItems;
      // role 없을 경우 — 메뉴 레이어 내 클릭 가능 텍스트
      const layer = document.querySelector('[class*="menu"], [class*="dropdown"], [class*="popup"], [class*="panel"]');
      if (layer) {
        return Array.from(layer.querySelectorAll('div, span, li'))
          .map(el => el.textContent?.trim().slice(0, 60))
          .filter(t => t && t.length > 1 && t.length < 50)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 20);
      }
      return [];
    });
    info.menu_items = menuItems;

    // getByText로 "동영상" 직접 확인 (role 무관하게 동작)
    const videoItemByText = page.getByText("동영상", { exact: false }).first();
    const videoByTextCount = await videoItemByText.count();
    const hasVideo = menuItems.some(t => /동영상|Video/i.test(t)) || videoByTextCount > 0;
    info.has_video_tool = hasVideo;
    info.video_text_visible = videoByTextCount > 0;
    log(prof.num, `Menu: ${menuItems.join(" | ").slice(0, 120)}`);
    log(prof.num, `Video tool: ${hasVideo} (text_visible: ${videoByTextCount > 0})`);

    // quota 사전 감지 (메뉴 상태에서)
    const menuBody = await page.evaluate(() => document.body?.innerText || "");
    const quotaPre = menuBody.match(/(한도가.{0,80}초기화|limit resets.{0,60}|Try again in.{0,40})/i)?.[1] || "";
    info.quota_in_menu = quotaPre.slice(0, 100);

    if (!hasVideo) {
      await page.keyboard.press("Escape").catch(() => {});
      info.status = "no_video_tool";
      await page.close(); await browser.close(); results.push(info); continue;
    }

    // 동영상 클릭 — getByText 우선, role fallback
    const videoItemRole = page.getByRole("menuitem").filter({ hasText: /동영상|Video/i }).first();
    const clickTarget = (await videoItemRole.count() > 0) ? videoItemRole : videoItemByText;
    if (await clickTarget.count() > 0) {
      await clickTarget.click();
      await page.waitForTimeout(2000);
    }

    // "사용해 보기" 다이얼로그 닫기
    const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
    if (await tryBtn.count() > 0) { await tryBtn.click(); await page.waitForTimeout(800); }

    const afterText = await page.evaluate(() => document.body?.innerText?.slice(0, 600) || "");
    const quotaAfter = afterText.match(/(한도가.{0,80}초기화|limit resets.{0,60}|Try again in.{0,40})/i)?.[1] || "";
    info.quota_after_video_click = quotaAfter.slice(0, 100);
    info.video_available = !quotaAfter;

    // 9:16 종횡비 버튼 확인
    const aspectCnt = await page.locator(
      'button[aria-label*="가로 모드"], button[aria-label*="16:9"], button[aria-label*="aspect"]'
    ).count();
    info.has_aspect_btn = aspectCnt > 0;

    // file input 확인
    const fiCnt = await page.locator('input[type="file"]').count();
    info.has_file_input = fiCnt > 0;

    // 현재 진행 중인 생성 작업 확인
    const inProgress = /생성|Generating|Creating|working on/i.test(afterText);
    info.generation_in_progress = inProgress;

    info.status = quotaAfter ? "quota_cooldown" : "READY";
    log(prof.num, `status=${info.status} aspect=${info.has_aspect_btn} file_input=${info.has_file_input} quota="${quotaAfter || "none"}"`);

    await page.keyboard.press("Escape").catch(() => {});
    await page.close();
    await browser.close();
  } catch (e) {
    info.status = "error";
    info.error = e.message.slice(0, 100);
    log(prof.num, `ERROR: ${e.message.slice(0, 80)}`);
    try { await browser?.close(); } catch {}
  }
  results.push(info);

  // 다음 프로필 간 짧은 대기
  await new Promise(r => setTimeout(r, 1000));
}

// ── 최종 판정 ────────────────────────────────────────────────────────────
console.log("\n\n=== GEMINI PROFILE PROBE RESULTS ===");
for (const r of results) {
  console.log(JSON.stringify(r, null, 2));
}

const ready = results.find(r => r.status === "READY");
const cooldowns = results.filter(r => r.status === "quota_cooldown");
const notLogin  = results.filter(r => r.status === "not_logged_in");

console.log("\n=== FINAL VERDICT ===");
if (ready) {
  console.log(`READY — Profile G${ready.profile} (port ${ready.port})`);
  console.log(`  video_tool: ${ready.has_video_tool}`);
  console.log(`  aspect_btn: ${ready.has_aspect_btn}`);
  console.log(`  file_input: ${ready.has_file_input}`);
  console.log(`  quota: none`);
  console.log(`\nNext: node scripts/_upload002-s1-veo-generate.mjs --profile ${ready.profile}`);
} else if (cooldowns.length > 0 && notLogin.length === 0) {
  console.log(`QUOTA_COOLDOWN — all logged-in profiles on cooldown`);
  cooldowns.forEach(r => console.log(`  G${r.profile}: ${r.quota_after_video_click}`));
} else {
  console.log(`AUTH_BLOCKED — no usable profile found`);
  results.forEach(r => console.log(`  G${r.profile}: ${r.status}`));
}
console.log("\nVeo submissions this run: 0");
