#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

import { captureGenerationConfirmationBaseline, collectGenerationConfirmationCandidates } from "./_flow-motion-confirmation-dom.mjs";
import { capturePostMakeFailureEvidence, waitForPostMakeOutcome } from "./_flow-motion-post-make-outcome.mjs";

const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const projectUrl = "https://labs.google/fx/ko/tools/flow/project/2b12c31a-4493-405b-aedf-2268abb10422";
const prompt = "Animate the exact scene. FLOW_ATTEMPT_ID_11111111-1111-4111-8111-111111111111. Automation metadata only.";
const job = {
  prompt,
  providerTarget: { expectedCreditsPerGeneration: 20, outputCount: 1 },
};
const evidenceDirectory = path.resolve(`C:/tmp/flow-motion-post-make-evidence-test-${process.pid}`);
fs.mkdirSync(evidenceDirectory, { recursive: false });

const browser = await chromium.launch({ headless: true, executablePath: CHROME_EXE });
const context = await browser.newContext({ viewport: { width: 900, height: 900 } });
const page = await context.newPage();
let passed = 0;

async function check(name, run) {
  await run();
  passed += 1;
  console.log(`  PASS ${name}`);
}

async function baseline() {
  return captureGenerationConfirmationBaseline(await collectGenerationConfirmationCandidates(page, job));
}

async function wait(options = {}) {
  return waitForPostMakeOutcome(page, job, {
    confirmationBaseline: await baseline(),
    initialResultHrefs: [],
    projectUrl,
    timeoutMs: 250,
    pollIntervalMs: 10,
    resultStablePolls: 2,
    confirmationStablePolls: 2,
    ...options,
  });
}

try {
  await check("direct Make submission binds only the exact attempt-marker result", async () => {
    await page.setContent("<main id='results'></main>");
    await page.evaluate(({ exactPrompt, resultUrl }) => {
      setTimeout(() => {
        const section = document.createElement("section");
        const promptNode = document.createElement("div");
        promptNode.textContent = exactPrompt;
        const link = document.createElement("a");
        link.href = resultUrl;
        link.innerHTML = '<video src="data:video/mp4;base64,AA=="></video>';
        section.append(promptNode, link);
        document.querySelector("#results").append(section);
      }, 20);
    }, {
      exactPrompt: prompt,
      resultUrl: `${projectUrl}/edit/22222222-2222-4222-8222-222222222222`,
    });
    const outcome = await wait();
    assert.equal(outcome.state, "direct_result");
    assert.equal(outcome.binding.providerResultId, "22222222-2222-4222-8222-222222222222");
    assert.equal(outcome.binding.observedBy, "exact_attempt_result_after_make_no_confirmation");
    assert.deepEqual(outcome.observation.newResultIds, ["22222222-2222-4222-8222-222222222222"]);
  });

  await check("virtualized gallery probes only new edit links and binds the exact full attempt prompt", async () => {
    const exactResultUrl = `${projectUrl}/edit/66666666-6666-4666-8666-666666666666`;
    const unrelatedResultUrl = `${projectUrl}/edit/77777777-7777-4777-8777-777777777777`;
    await page.context().route(`${projectUrl}/edit/**`, async (route) => {
      const exact = route.request().url() === exactResultUrl;
      await route.fulfill({
        contentType: "text/html",
        body: exact
          ? `<main><div>${prompt}</div><div>9:16</div><video src="data:video/mp4;base64,AA=="></video></main>`
          : "<main><img alt='unrelated image' /></main>",
      });
    });
    await page.setContent(`<main><a href="${exactResultUrl}">new video</a><a href="${unrelatedResultUrl}">new image</a></main>`);
    const outcome = await wait({ timeoutMs: 2_000, resultStablePolls: 1 });
    assert.equal(outcome.state, "direct_result");
    assert.equal(outcome.binding.providerResultId, "66666666-6666-4666-8666-666666666666");
    await page.context().unroute(`${projectUrl}/edit/**`);
  });

  await check("no confirmation and no result times out without inventing submission", async () => {
    await page.setContent("<main>waiting</main>");
    const outcome = await wait({ timeoutMs: 80 });
    assert.equal(outcome.state, "timeout");
    assert.ok(outcome.observation.pollCount > 0);
    assert.deepEqual(outcome.observation.newResultIds, []);
  });

  await check("a lazy old result with a different marker cannot bind", async () => {
    await page.setContent(`<section><div>Animate the exact scene. FLOW_ATTEMPT_ID_99999999-9999-4999-8999-999999999999.</div><a href="${projectUrl}/edit/33333333-3333-4333-8333-333333333333"><video src="data:video/mp4;base64,AA=="></video></a></section>`);
    const outcome = await wait({ timeoutMs: 80 });
    assert.equal(outcome.state, "timeout");
    assert.deepEqual(outcome.observation.newResultIds, []);
  });

  await check("a truncated prompt cannot bind", async () => {
    await page.setContent(`<section><div>Animate the exact scene...</div><a href="${projectUrl}/edit/44444444-4444-4444-8444-444444444444"><video src="data:video/mp4;base64,AA=="></video></a></section>`);
    const outcome = await wait({ timeoutMs: 80 });
    assert.equal(outcome.state, "timeout");
    assert.deepEqual(outcome.observation.newResultIds, []);
  });

  await check("UNKNOWN evidence persists JSON and screenshot before close", async () => {
    const attemptId = "55555555-5555-4555-8555-555555555555";
    await page.setContent(`<section><div><div contenteditable="true">${prompt}</div><img alt="reference-hash.png" src="data:image/png;base64,iVBORw0KGgo=" /></div><a href="${projectUrl}/edit/55555555-5555-4555-8555-555555555556">old</a></section>`);
    const captured = await capturePostMakeFailureEvidence(page, {
      job: { jobId: "fixture-job" },
      initialResultHrefs: [],
      observation: { pollCount: 3 },
      evidenceDirectory,
      attemptId,
    });
    assert.ok(fs.existsSync(captured.evidencePath));
    assert.ok(fs.existsSync(captured.screenshotPath));
    const evidence = JSON.parse(fs.readFileSync(captured.evidencePath, "utf8"));
    assert.equal(evidence.attemptId, attemptId);
    assert.equal(evidence.observation.pollCount, 3);
    assert.equal(evidence.newResultHrefs.length, 1);
    assert.equal(evidence.composer.attachments.length, 1);
    assert.equal(typeof evidence.screenshotSha256, "string");
  });
} finally {
  await browser.close();
  fs.rmSync(evidenceDirectory, { recursive: true, force: true });
}

console.log(`Flow motion post-Make outcome: ${passed}/${passed} PASS`);
