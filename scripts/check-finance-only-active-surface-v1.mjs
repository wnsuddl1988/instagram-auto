#!/usr/bin/env node
/**
 * Finance V1 active-surface guard.
 * Reads source only; it does not access env, network, accounts, or local media.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIZARD = path.join(ROOT, "components", "VideoCreationWizard.tsx");
const HELPER = path.join(ROOT, "lib", "owner-web-operator.ts");
const ROUTE = path.join(ROOT, "app", "api", "money-shorts", "operator", "route.ts");

let failures = 0;
function check(name, ok, detail = "") {
  if (ok) {
    console.log(`PASS  ${name}`);
  } else {
    failures += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

const wizardCode = stripComments(readFileSync(WIZARD, "utf8"));
const helperCode = stripComments(readFileSync(HELPER, "utf8"));
const routeCode = stripComments(readFileSync(ROUTE, "utf8"));

const categoryBlock = wizardCode.match(/const CATEGORIES\s*=\s*\[([\s\S]*?)\]\s*as const;/);
const categoryIds = categoryBlock
  ? [...categoryBlock[1].matchAll(/id:\s*"([^"]+)"/g)].map((match) => match[1])
  : [];

check(
  "wizard active category list is exactly finance",
  JSON.stringify(categoryIds) === JSON.stringify(["finance"]),
  JSON.stringify(categoryIds),
);
check(
  "wizard category state accepts finance only",
  /useState<"finance"\s*\|\s*null>\(null\)/.test(wizardCode) &&
    /\(id:\s*"finance"\)/.test(wizardCode),
);
check(
  "helper active enum is exactly finance",
  /export const WIZARD_CATEGORY_IDS\s*=\s*\["finance"\]\s*as const/.test(helperCode),
);
check(
  "topic recommendation blocks non-finance category input",
  /categoryRaw\s*!==\s*undefined\s*&&\s*categoryRaw\s*!==\s*"finance"/.test(routeCode) &&
    /FINANCE_CATEGORY_ONLY/.test(routeCode) &&
    /const category:\s*WizardCategoryId\s*=\s*"finance"/.test(routeCode),
);
check(
  "upload-ready list excludes non-finance artifacts",
  /generatedTopic\?\.category\s*!==\s*"finance"\s*&&\s*!topicId\.startsWith\("gen-finance-"\)/.test(helperCode) &&
    /category:\s*"finance"/.test(helperCode),
);

console.log(failures === 0 ? "\nRESULT: ALL PASS" : `\nRESULT: ${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
