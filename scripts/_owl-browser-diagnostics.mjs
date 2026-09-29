/**
 * 브라우저 자동화 실패 진단 — 막혔을 때 사람이 이어받을 수 있게 한다.
 *
 * 왜 필요한가:
 *   이 파이프라인은 Flow·ChatGPT·Gemini 같은 외부 웹 UI에 의존한다. 그쪽이
 *   화면을 바꾸면 셀렉터가 깨지고, 지금까지는 "ABORT: settings_entry_missing"
 *   한 줄만 남고 죽었다. 화면이 어떻게 바뀌었는지, 뭘 찾으려 했는지 알 수 없어
 *   매번 사람이 코드를 열어 추적해야 했다(2026-09-16 Flow UI 개편 때 4~5회 반복).
 *
 *   이 모듈은 그 상황을 "막혔다"에서 "5분 더 걸린다"로 바꾼다:
 *     1. 실패 순간의 스크린샷과 페이지 구조를 저장한다
 *     2. 무엇을 어떤 셀렉터로 찾으려 했는지 기록한다
 *     3. (선택) 사람이 직접 클릭하고 이어가도록 대기한다
 *
 * 브라우저는 절대 자동으로 닫지 않는다 — 실패 시 탭을 닫았다가 진행 중이던
 * 결과를 확인 못 하게 만든 사고가 있었다(2026-09-15).
 */

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

/**
 * 실패 현장을 저장한다. 스크린샷·HTML·보이는 텍스트를 함께 남겨야
 * "왜 못 찾았는지"를 사후에 재구성할 수 있다.
 *
 * @returns {Promise<{dir: string, files: string[]}>} 저장 위치
 */
export async function captureFailureContext(page, { outDir, label }) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const dir = path.join(outDir, "failure-diagnostics", `${stamp}-${label}`);
  fs.mkdirSync(dir, { recursive: true });
  const files = [];

  const save = async (name, fn) => {
    try {
      await fn(path.join(dir, name));
      files.push(name);
    } catch (error) {
      // 진단 수집이 실패해도 원래 오류를 덮지 않는다.
      fs.writeFileSync(
        path.join(dir, `${name}.error.txt`),
        String(error?.message ?? error),
        "utf8",
      );
    }
  };

  await save("screenshot.png", (p) => page.screenshot({ path: p, fullPage: false }));
  await save("screenshot-full.png", (p) => page.screenshot({ path: p, fullPage: true }));
  await save("page.html", async (p) => {
    fs.writeFileSync(p, await page.content(), "utf8");
  });
  await save("visible-text.txt", async (p) => {
    const text = await page.evaluate(() => document.body?.innerText ?? "");
    fs.writeFileSync(p, text, "utf8");
  });
  // 클릭 가능한 요소 목록 — 셀렉터가 깨졌을 때 "그럼 뭐가 있나"를 바로 본다.
  await save("clickable-elements.txt", async (p) => {
    const items = await page.evaluate(() => {
      const nodes = [...document.querySelectorAll('button, [role="button"], a, [tabindex]')];
      return nodes
        .filter((el) => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        })
        .slice(0, 200)
        .map((el) => {
          const text = (el.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 60);
          const aria = el.getAttribute("aria-label") ?? "";
          const testid = el.getAttribute("data-testid") ?? el.getAttribute("data-test-id") ?? "";
          return [el.tagName.toLowerCase(), text, aria, testid].filter(Boolean).join(" | ");
        });
    });
    fs.writeFileSync(p, items.join("\n"), "utf8");
  });

  return { dir, files };
}

/**
 * 사람이 읽을 수 있는 실패 보고를 출력한다.
 *
 * 코드명만 던지면("settings_entry_missing") 무엇을 어떻게 고쳐야 할지 모른다.
 * 찾으려던 대상, 시도한 셀렉터, 진단 파일 위치, 다음 행동을 함께 준다.
 */
export function reportFailure({ what, selectors, diagnostics, url, hint }) {
  const line = "─".repeat(64);
  console.error("");
  console.error(line);
  console.error(`  자동화가 막혔습니다: ${what}`);
  console.error(line);
  if (url) console.error(`  현재 주소: ${url}`);
  if (Array.isArray(selectors) && selectors.length > 0) {
    console.error("  찾으려던 것:");
    for (const selector of selectors) console.error(`    - ${selector}`);
  }
  if (diagnostics?.dir) {
    console.error("");
    console.error("  진단 자료가 저장됐습니다:");
    console.error(`    ${diagnostics.dir}`);
    console.error("    screenshot.png         실패 순간 화면");
    console.error("    clickable-elements.txt 지금 화면에 있는 버튼 목록");
    console.error("    visible-text.txt       화면에 보이는 글자");
  }
  console.error("");
  console.error("  다음에 할 일:");
  console.error("    1. screenshot.png 을 열어 화면이 예전과 어떻게 다른지 본다");
  console.error("    2. clickable-elements.txt 에서 대신 쓸 버튼 이름을 찾는다");
  console.error("    3. 러너의 셀렉터를 그 이름으로 고친다");
  if (hint) {
    console.error("");
    console.error(`  참고: ${hint}`);
  }
  console.error(line);
  console.error("");
}

/**
 * 사람이 직접 화면을 조작하고 이어가게 한다.
 *
 * UI가 바뀌어 자동 클릭이 안 되더라도, 사람이 한 번 눌러주면 나머지는 프로그램이
 * 이어받을 수 있다. 완전히 막히는 대신 느려지는 것으로 바꾸는 장치다.
 *
 * --manual-assist 플래그가 있을 때만 동작한다. 무인 실행에서 입력을 기다리며
 * 영원히 멈춰 있으면 안 되기 때문이다.
 *
 * @returns {Promise<boolean>} 사람이 이어가겠다고 했으면 true
 */
export async function waitForManualAssist({ what, enabled, timeoutMs = 300_000 }) {
  if (!enabled) return false;
  if (!process.stdin.isTTY) {
    console.error("  (수동 개입 모드가 켜져 있지만 대화형 터미널이 아니라 건너뜁니다)");
    return false;
  }

  console.error("");
  console.error("  ┌─ 수동 개입 대기 ──────────────────────────────────────────");
  console.error(`  │ 브라우저에서 직접 처리해 주세요: ${what}`);
  console.error("  │ 끝나면 Enter 를 누르면 자동화가 이어집니다.");
  console.error("  │ 포기하려면 q 를 입력하고 Enter.");
  console.error(`  │ (${Math.round(timeoutMs / 60_000)}분 안에 응답이 없으면 중단됩니다)`);
  console.error("  └───────────────────────────────────────────────────────────");

  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  try {
    const answer = await new Promise((resolve) => {
      const timer = setTimeout(() => resolve(null), timeoutMs);
      rl.question("  > ", (value) => {
        clearTimeout(timer);
        resolve(value);
      });
    });
    if (answer === null) {
      console.error("  시간이 초과돼 중단합니다.");
      return false;
    }
    if (String(answer).trim().toLowerCase() === "q") {
      console.error("  사용자가 중단을 선택했습니다.");
      return false;
    }
    console.error("  이어서 진행합니다.");
    return true;
  } finally {
    rl.close();
  }
}

/**
 * 위 셋을 묶은 표준 실패 처리.
 *
 * 러너에서 `await failFast(page, {...})` 한 줄로 쓴다. 수동 개입으로 해결되면
 * true 를 돌려주므로 호출부가 재시도할 수 있다.
 */
export async function failFast(page, {
  outDir,
  label,
  what,
  selectors,
  hint,
  manualAssist = false,
}) {
  let diagnostics = null;
  try {
    diagnostics = await captureFailureContext(page, { outDir, label });
  } catch {
    // 진단 수집 실패가 원래 오류를 가리지 않게 한다.
  }
  let currentUrl = null;
  try { currentUrl = page.url(); } catch { /* page may be closed */ }
  reportFailure({
    what,
    selectors,
    diagnostics,
    url: currentUrl,
    hint,
  });
  return waitForManualAssist({ what, enabled: manualAssist });
}
