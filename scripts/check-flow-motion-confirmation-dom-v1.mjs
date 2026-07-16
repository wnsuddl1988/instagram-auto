#!/usr/bin/env node

import assert from "node:assert/strict";
import { chromium } from "playwright";

import {
  clickRequiredGenerationConfirmationAtomic,
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

function card({ id, generation = "v1", includePrompt = true, question = "크레딧 20개를 사용하여 1개 동영상 생성을 시작할까요?", control = "nested", acknowledged = false, persistentAriaTrap = false } = {}) {
  const approve = control === "aria"
    ? `<button data-action="once-${generation}" aria-label="승인"></button>`
    : control === "disabled"
      ? '<button disabled>승인</button>'
      : `<div data-action="once-${generation}" class="approve-outer" style="cursor:pointer"><span>check</span><div style="cursor:pointer">승인</div></div>`;
  const persistent = persistentAriaTrap
    ? '<button data-action="always" aria-label="승인, 다시 묻지 않음"><span>승인</span></button>'
    : '<div data-action="always" style="cursor:pointer">check승인, 다시 묻지 않음</div>';
  return `<section id="${id}">
    ${includePrompt ? `<div class="prompt">${prompt}</div>` : ""}
    <div class="confirmation"><p>${question}</p><div>${approve}${persistent}<div style="cursor:pointer">close거부</div></div></div>
    ${acknowledged ? "<p>승인</p>" : ""}
  </section>`;
}

async function installClickLedger() {
  await page.evaluate(() => {
    window.clickLedger = [];
    document.addEventListener("click", (event) => {
      const action = event.target.closest("[data-action]")?.dataset.action;
      if (action) window.clickLedger.push(action);
    });
  });
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
    assert.match(result.confirmation.selected.controlText, /승인/);
  });

  await check("accessible-name-only approval button is supported", async () => {
    await page.setContent(card({ id: "aria", control: "aria" }));
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.ok(result.confirmation);
    assert.equal(result.confirmation.selected.controlAriaLabel, "승인");
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

  await check("unbound approval card is rejected even when appended after a baseline", async () => {
    await page.setContent(card({ id: "old", acknowledged: true }));
    await page.locator("body").evaluate((body, html) => body.insertAdjacentHTML("beforeend", html), card({ id: "fresh", includePrompt: false }));
    await assert.rejects(
      () => findRequiredGenerationConfirmation(page, job),
      /confirmation_already_acknowledged_no_resubmit/,
    );
  });

  await check("two prompt-bound confirmation cards fail closed", async () => {
    await page.setContent(card({ id: "fresh-a" }) + card({ id: "fresh-b" }));
    await assert.rejects(
      () => findRequiredGenerationConfirmation(page, job),
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

  await check("aria-label do-not-ask trap is excluded while one-time approval remains", async () => {
    await page.setContent(card({ id: "aria-trap", persistentAriaTrap: true }));
    const snapshot = await collectGenerationConfirmationCandidates(page, job);
    assert.equal(snapshot.candidates.filter((candidate) => candidate.creditPromptMatches).length, 2);
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.ok(result.confirmation);
    assert.notEqual(result.confirmation.selected.controlAriaLabel, "승인, 다시 묻지 않음");
  });

  await check("nested approval-looking text inside a persistent label is rejected", async () => {
    await page.setContent(`<section><div>${prompt}</div><div class="confirmation">
      <p>크레딧 20개를 사용하여 1개 동영상 생성을 시작할까요?</p>
      <label data-action="always" style="cursor:pointer"><input role="radio"><span><span><div style="cursor:pointer">승인</div></span></span><small>다시 묻지 않음</small></label>
    </div></section>`);
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.equal(result.confirmation, null);
  });

  await check("aria-labelledby persistent approval is rejected", async () => {
    await page.setContent(`<section><div>${prompt}</div><div class="confirmation">
      <p>Use 20 credits to create 1 video?</p>
      <span id="persistent-name">Approve always</span><button aria-labelledby="persistent-name"><span>Approve</span></button>
    </div></section>`);
    const result = await findRequiredGenerationConfirmation(page, job);
    assert.equal(result.confirmation, null);
  });

  await check("atomic click re-queries after full card re-render and clicks only the new one-time control", async () => {
    await page.setContent(card({ id: "atomic", generation: "v1" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    await page.locator("body").evaluate((body, html) => { body.innerHTML = html; }, card({ id: "atomic", generation: "v2" }));
    let armed = 0;
    let dispatched = 0;
    const evidence = await clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
      onClickArmed: () => { armed += 1; },
      onClickDispatched: () => { assert.equal(armed, 1); dispatched += 1; },
    });
    assert.equal(evidence.clickDispatched, true);
    assert.equal(armed, 1);
    assert.equal(dispatched, 1);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), ["once-v2"]);
  });

  await check("atomic click fails closed if the pinned control detaches before dispatch", async () => {
    await page.setContent(card({ id: "detach", generation: "v1" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    await page.evaluate((replacement) => {
      const observer = new MutationObserver((records) => {
        if (!records.some((record) => record.attributeName === "data-flow-motion-approval-target")) return;
        observer.disconnect();
        document.querySelector("#detach").outerHTML = replacement;
      });
      observer.observe(document.body, { attributes: true, subtree: true });
    }, card({ id: "detach", generation: "v2" }));
    let armed = 0;
    let dispatched = 0;
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
        onClickArmed: () => { armed += 1; },
        onClickDispatched: () => { dispatched += 1; },
      }),
      /atomic_approval_target_detached_before_pin/,
    );
    assert.equal(armed, 0);
    assert.equal(dispatched, 0);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("failed click-intent persistence prevents the paid click", async () => {
    await page.setContent(card({ id: "intent-fail" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    let dispatched = 0;
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
        onClickArmed: () => { throw new Error("intent_write_failed"); },
        onClickDispatched: () => { dispatched += 1; },
      }),
      /intent_write_failed/,
    );
    assert.equal(dispatched, 0);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("dispatch persistence failure clicks once and returns recovery-only error", async () => {
    await page.setContent(card({ id: "dispatch-write-fail" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    let dispatched = 0;
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
        onClickArmed: () => {},
        onClickDispatched: () => { dispatched += 1; throw new Error("dispatch_write_failed"); },
      }),
      /approval_dispatch_persistence_failed_no_retry/,
    );
    assert.equal(dispatched, 1);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), ["once-v1"]);
  });

  await check("atomic click refuses two identical fresh targets without dispatch", async () => {
    await page.setContent(card({ id: "single" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    await page.locator("body").evaluate((body, html) => { body.innerHTML = html; }, card({ id: "a" }) + card({ id: "b" }));
    let dispatched = 0;
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
        onClickDispatched: () => { dispatched += 1; },
      }),
      /atomic_approval_target_ambiguous:2/,
    );
    assert.equal(dispatched, 0);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("atomic click refuses two differently worded valid cards", async () => {
    await page.setContent(card({ id: "single-different" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    const english = `<section id="english"><div>${prompt}</div><div class="confirmation"><p>Use 20 credits to create 1 video?</p><button data-action="once-en">Approve</button></div></section>`;
    await page.locator("body").evaluate((body, html) => { body.innerHTML = html; }, card({ id: "korean" }) + english);
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected),
      /atomic_approval_target_ambiguous:2/,
    );
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("atomic click refuses two differently named one-time controls in one card", async () => {
    await page.setContent(card({ id: "single-control" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    const twoControls = `<section><div>${prompt}</div><div class="confirmation"><p>Use 20 credits to create 1 video?</p><button data-action="once-ko">승인</button><button data-action="once-en">Approve</button></div></section>`;
    await page.locator("body").evaluate((body, html) => { body.innerHTML = html; }, twoControls);
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected),
      /atomic_approval_target_ambiguous:2/,
    );
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("pointerdown detach after arming becomes unknown without a second click", async () => {
    const detachOnPointerDown = card({ id: "pointerdown-detach" }).replace(
      'data-action="once-v1"',
      'data-action="once-v1" onpointerdown="this.closest(\'section\').remove()"',
    );
    await page.setContent(detachOnPointerDown);
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    let armed = 0;
    let dispatched = 0;
    await assert.rejects(
      () => clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
        onClickArmed: () => { armed += 1; },
        onClickDispatched: () => { dispatched += 1; },
      }),
      /approval_click_outcome_unknown_no_retry/,
    );
    assert.equal(armed, 1);
    assert.equal(dispatched, 0);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), []);
  });

  await check("a pre-arm click is blocked and the later armed click passes once", async () => {
    await page.setContent(card({ id: "pre-arm-race" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    await page.evaluate(() => {
      const observer = new MutationObserver((records) => {
        const target = records.find((record) => record.attributeName === "data-flow-motion-approval-target")?.target;
        if (!target) return;
        observer.disconnect();
        target.click();
      });
      observer.observe(document.body, { attributes: true, subtree: true });
    });
    let dispatched = 0;
    await clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
      onClickArmed: () => {},
      onClickDispatched: () => { dispatched += 1; },
    });
    assert.equal(dispatched, 1);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), ["once-v1"]);
  });

  await check("a click between DOM arm and automated click cannot cause a second paid action", async () => {
    await page.setContent(card({ id: "armed-race" }));
    await installClickLedger();
    const found = await findRequiredGenerationConfirmation(page, job);
    await page.evaluate(() => {
      const observer = new MutationObserver((records) => {
        const target = records.find((record) => record.attributeName === "data-flow-motion-approval-armed")?.target;
        if (!target) return;
        observer.disconnect();
        target.click();
      });
      observer.observe(document.body, { attributes: true, subtree: true });
    });
    let armed = 0;
    let dispatched = 0;
    await clickRequiredGenerationConfirmationAtomic(page, job, found.confirmation.selected, {
      onClickArmed: () => { armed += 1; },
      onClickDispatched: () => { dispatched += 1; },
    });
    assert.equal(armed, 1);
    assert.equal(dispatched, 1);
    assert.deepEqual(await page.evaluate(() => window.clickLedger), ["once-v1"]);
  });
} finally {
  await browser.close();
}

console.log(`Flow motion confirmation DOM: ${passed}/${passed} PASS`);
