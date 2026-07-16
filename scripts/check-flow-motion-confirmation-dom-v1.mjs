#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";

import {
  collectGenerationConfirmationCandidates,
  findCurrentComposerMakeButton,
  findRequiredGenerationConfirmation,
} from "./_flow-motion-confirmation-dom.mjs";

const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const prompt = "EXACT SCENE PROMPT HASH-BOUND";
const job = {
  prompt,
  providerTarget: {
    expectedCreditsPerGeneration: 20,
    outputCount: 1,
  },
};

function card({ id, includePrompt = true, question = "크레딧 20개를 사용하여 1개 동영상 생성을 시작할까요?", control = "nested", acknowledged = false } = {}) {
  const approve = control === "aria"
    ? '<button aria-label="승인"></button>'
    : control === "disabled"
      ? '<button disabled>승인</button>'
      : '<div class="approve-outer" style="cursor:pointer"><span>check</span><div style="cursor:pointer">승인</div></div>';
  return `<section id="${id}">
    ${includePrompt ? `<div class="prompt">${prompt}</div>` : ""}
    <div class="confirmation"><p>${question}</p><div>${approve}<div style="cursor:pointer">check승인, 다시 묻지 않음</div><div style="cursor:pointer">close거부</div></div></div>
    ${acknowledged ? "<p>승인</p>" : ""}
  </section>`;
}

const browser = await chromium.launch({ headless: true, executablePath: CHROME_EXE });
const page = await browser.newPage({ viewport: { width: 900, height: 900 } });
let passed = 0;
async function check(name, fn) {
  await fn();
  passed += 1;
  console.log(`  PASS ${name}`);
}

try {
  await check("current Korean card resolves one outer approval control", async () => {
    await page.setContent(card({ id: "current" }));
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.ok(result.confirmation);
    assert.equal(result.confirmation.selected.outermost, true);
    assert.match(await result.confirmation.approveOption.innerText(), /승인/);
  });

  await check("accessible-name-only approval button is supported", async () => {
    await page.setContent(card({ id: "aria", control: "aria" }));
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.ok(result.confirmation);
    assert.equal(await result.confirmation.approveOption.getAttribute("aria-label"), "승인");
  });

  await check("wrong credit cost cannot become a confirmation", async () => {
    await page.setContent(card({ id: "wrong-cost", question: "크레딧 200개를 사용하여 1개 동영상 생성을 시작할까요?" }));
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.equal(result.confirmation, null);
  });

  await check("disabled one-time approval control is rejected", async () => {
    await page.setContent(card({ id: "disabled", control: "disabled" }));
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.equal(result.confirmation, null);
  });

  await check("already acknowledged prompt card cannot be resubmitted", async () => {
    await page.setContent(card({ id: "acknowledged", acknowledged: true }));
    await assert.rejects(
      () => findRequiredGenerationConfirmation(page, job),
      /confirmation_already_acknowledged_no_resubmit/,
    );
  });

  await check("fresh temporal delta may be selected without prompt ancestry", async () => {
    await page.setContent(card({ id: "old", acknowledged: true }));
    const baseline = await collectGenerationConfirmationCandidates(page, job);
    await page.locator("body").evaluate((body, html) => body.insertAdjacentHTML("beforeend", html), card({ id: "fresh", includePrompt: false }));
    const result = await findRequiredGenerationConfirmation(page, job, { freshAfterIndex: baseline.approvalElementCount });
    assert.ok(result.confirmation);
    assert.equal(result.confirmation.selected.promptMatches, false);
  });

  await check("two fresh confirmation cards fail closed", async () => {
    await page.setContent(card({ id: "old", acknowledged: true }));
    const baseline = await collectGenerationConfirmationCandidates(page, job);
    await page.locator("body").evaluate((body, html) => body.insertAdjacentHTML("beforeend", html),
      card({ id: "fresh-a", includePrompt: false }) + card({ id: "fresh-b", includePrompt: false }));
    await assert.rejects(
      () => findRequiredGenerationConfirmation(page, job, { freshAfterIndex: baseline.approvalElementCount }),
      /active_approval_card_ambiguous:2/,
    );
  });

  await check("current composer scopes the Make button", async () => {
    await page.setContent(`
      <button>arrow_forward 만들기</button>
      <div id="composer"><div><div contenteditable="true"></div><button>arrow_forward 만들기</button></div></div>
    `);
    const scoped = await findCurrentComposerMakeButton(page.locator('[contenteditable="true"]'));
    assert.ok(scoped);
    assert.equal(await scoped.evaluate((element) => element.parentElement?.parentElement?.id), "composer");
  });

  await check("do-not-ask approval text is never accepted as one-time approval", async () => {
    await page.setContent(`<section><div>${prompt}</div><div><p>Use 20 credits to create 1 video?</p><button>승인, 다시 묻지 않음</button></div></section>`);
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.equal(result.confirmation, null);
  });
} finally {
  await browser.close();
}

console.log(`Flow motion confirmation DOM: ${passed}/${passed} PASS`);
