#!/usr/bin/env node

import { verifyImageToolActive } from "./_chatgpt-image-core.mjs";

class FakeElement {
  constructor({ text = "", attrs = {}, visible = true } = {}) {
    this.textContent = text;
    this.attrs = attrs;
    this.visible = visible;
  }

  getAttribute(name) {
    return this.attrs[name] ?? null;
  }
}

class FakeLocator {
  constructor(elements = [], descendants = new Map()) {
    this.elements = elements;
    this.descendants = descendants;
  }

  first() {
    return this;
  }

  locator(selector) {
    return this.descendants.get(selector) ?? new FakeLocator();
  }

  async count() {
    return this.elements.length;
  }

  nth(index) {
    return new FakeLocator(this.elements[index] ? [this.elements[index]] : []);
  }

  async isVisible() {
    return this.elements[0]?.visible === true;
  }

  async evaluate(callback) {
    if (!this.elements[0]) throw new Error("missing fake element");
    return callback(this.elements[0]);
  }
}

const EMPTY = new FakeLocator();
const COMPOSER_XPATH = 'xpath=ancestor::*[self::form or @data-type="unified-composer"][1]';

function fakePage({ composerButton = null, directPicturePill = false } = {}) {
  const composerDescendants = new Map();
  if (composerButton) composerDescendants.set("button", new FakeLocator([composerButton]));
  const composer = new FakeLocator([new FakeElement()], composerDescendants);
  const prompt = new FakeLocator([new FakeElement()], new Map([[COMPOSER_XPATH, composer]]));
  const directPill = directPicturePill ? new FakeLocator([new FakeElement()]) : EMPTY;

  return {
    locator(selector) {
      if (selector === "#prompt-textarea") return prompt;
      if (selector === '#prompt-textarea [data-inline-selection-pill][data-id="picture_v2"]') return directPill;
      return EMPTY;
    },
  };
}

let passes = 0;
let failures = 0;

async function check(name, actual, expected) {
  if (actual === expected) {
    passes += 1;
    console.log(`PASS  ${name}`);
    return;
  }
  failures += 1;
  console.error(`FAIL  ${name} - expected=${expected}, actual=${actual}`);
}

await check(
  "Korean image chip rendered as a composer sibling is active",
  await verifyImageToolActive(fakePage({ composerButton: new FakeElement({ text: "이미지 만들기" }) })),
  true,
);
await check(
  "English image chip aria-label rendered as a composer sibling is active",
  await verifyImageToolActive(fakePage({ composerButton: new FakeElement({ attrs: { "aria-label": "Create image" } }) })),
  true,
);
await check(
  "legacy picture_v2 pill inside prompt remains active",
  await verifyImageToolActive(fakePage({ directPicturePill: true })),
  true,
);
await check(
  "composer without an image chip stays inactive",
  await verifyImageToolActive(fakePage()),
  false,
);
await check(
  "similar but non-exact composer label stays inactive",
  await verifyImageToolActive(fakePage({ composerButton: new FakeElement({ text: "이미지 만들기 도움말" }) })),
  false,
);

console.log(`\n${passes + failures} checks - ${passes} PASS, ${failures} FAIL`);
process.exit(failures === 0 ? 0 : 1);
