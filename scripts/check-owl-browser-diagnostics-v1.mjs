#!/usr/bin/env node

/**
 * 브라우저 진단 모듈 검증 — 실제 외부 사이트 없이 동작을 확인한다.
 *
 * 진단 장치는 "평소엔 안 쓰다가 사고 났을 때만 쓰는" 코드라, 정작 필요한 순간에
 * 이것마저 깨져 있기 쉽다. 가짜 페이지를 띄워 스크린샷·버튼 목록·보고 출력이
 * 실제로 생성되는지 확인한다.
 *
 * 사용: node scripts/check-owl-browser-diagnostics-v1.mjs
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { captureFailureContext, reportFailure } from "./_owl-browser-diagnostics.mjs";

const checks = [];
function check(name, pass, detail) {
  checks.push({ name, pass: Boolean(pass), detail: detail ?? "" });
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "owl-diag-check-"));

// 실제 Flow 화면을 흉내 낸 최소 페이지. 버튼 목록 추출이 되는지 보려면
// 눈에 보이는 버튼이 몇 개 있어야 한다.
const FIXTURE_HTML = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8">
<title>가짜 생성 도구</title></head><body>
<h1>프로젝트 화면</h1>
<button aria-label="설정 트리거">설정</button>
<button data-testid="send-button">생성 시작</button>
<a href="#none">도움말</a>
<button style="display:none">숨겨진 버튼</button>
<p>여기에 보이는 본문 텍스트가 있습니다.</p>
</body></html>`;

let browser;
try {
  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setContent(FIXTURE_HTML);

  const result = await captureFailureContext(page, { outDir, label: "selftest" });

  check("진단 디렉터리 생성", fs.existsSync(result.dir), result.dir);

  const expected = [
    "screenshot.png",
    "screenshot-full.png",
    "page.html",
    "visible-text.txt",
    "clickable-elements.txt",
  ];
  for (const name of expected) {
    const filePath = path.join(result.dir, name);
    const exists = fs.existsSync(filePath);
    const size = exists ? fs.statSync(filePath).size : 0;
    check(`${name} 생성`, exists && size > 0, exists ? `${size} bytes` : "없음");
  }

  // 버튼 목록이 실제로 의미 있는 내용을 담았는지 — 이게 비어 있으면
  // 셀렉터가 깨졌을 때 아무 단서도 못 준다.
  const clickable = fs.readFileSync(path.join(result.dir, "clickable-elements.txt"), "utf8");
  check("버튼 목록에 aria-label 포함", clickable.includes("설정 트리거"), "");
  check("버튼 목록에 data-testid 포함", clickable.includes("send-button"), "");
  check("숨겨진 버튼은 제외", !clickable.includes("숨겨진 버튼"), "보이는 요소만 수집");

  const visibleText = fs.readFileSync(path.join(result.dir, "visible-text.txt"), "utf8");
  check("보이는 텍스트 수집", visibleText.includes("여기에 보이는 본문"), "");

  // 보고 출력이 예외 없이 도는지 확인(내용은 stderr 로 나간다).
  let reportOk = true;
  try {
    reportFailure({
      what: "자가 검증용 가짜 실패",
      selectors: ['button[aria-label="설정 트리거"]'],
      diagnostics: result,
      url: page.url(),
      hint: "이 메시지는 검증 중 출력된 것입니다.",
    });
  } catch (error) {
    reportOk = false;
    check("보고 출력", false, String(error?.message));
  }
  if (reportOk) check("보고 출력", true, "예외 없이 완료");

} catch (error) {
  check("전체 실행", false, String(error?.message ?? error));
} finally {
  if (browser) await browser.close();
}

const failed = checks.filter((c) => !c.pass);
console.log("");
console.log(`${checks.length} checks — ${checks.length - failed.length} PASS, ${failed.length} FAIL`);
console.log(`진단 산출물: ${outDir}`);
process.exit(failed.length > 0 ? 1 : 0);
