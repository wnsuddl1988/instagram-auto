import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT = process.cwd();
const BANK_PATH = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
const HELPER_PATH = path.join(ROOT, "lib", "owner-web-operator.ts");
const REMOVED_324_PATH = path.join(ROOT, "lib", "finance-curiosity-topic-engine.ts");
const REMOVED_60_PATH = path.join(ROOT, "lib", "finance-editorial-calibration-bank.ts");

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function loadBank() {
  const source = readFileSync(BANK_PATH, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, {
    module: sandboxModule,
    exports: sandboxModule.exports,
    console,
  });
  return { source, exports: sandboxModule.exports };
}

function normalize(title) {
  return title.toLowerCase().replace(/[“”"'.!?…,:;()[\]{}<>·~\-_/\\|\s]/g, "");
}

function bigrams(value) {
  const normalized = normalize(value);
  const grams = new Set();
  for (let index = 0; index < Math.max(1, normalized.length - 1); index += 1) {
    grams.add(normalized.slice(index, index + 2));
  }
  return grams;
}

function similarity(a, b) {
  const left = bigrams(a);
  const right = bigrams(b);
  let intersection = 0;
  for (const gram of left) if (right.has(gram)) intersection += 1;
  return intersection / new Set([...left, ...right]).size;
}

check("500-title bank file exists", existsSync(BANK_PATH));
check("old 324-title engine file is deleted", !existsSync(REMOVED_324_PATH));
check("temporary 60-title calibration file is deleted", !existsSync(REMOVED_60_PATH));

const { source, exports: bankModule } = loadBank();
const bank = bankModule.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
const domainIds = bankModule.FINANCE_EDITORIAL_SUBTOPIC_IDS ?? [];
const lanes = bankModule.FINANCE_EDITORIAL_LANES ?? [];
const helper = readFileSync(HELPER_PATH, "utf8");

check("topic bank has exactly 500 entries", bank.length === 500, String(bank.length));
check("all 500 topic ids are unique", new Set(bank.map((topic) => topic.id)).size === 500);
check("all 500 titles are unique", new Set(bank.map((topic) => topic.title)).size === 500);
check("bank has exactly 12 finance subtopics", domainIds.length === 12 && new Set(domainIds).size === 12);
check("bank defines exactly nine editorial lanes", lanes.length === 9 && new Set(lanes).size === 9);

const domainCounts = Object.fromEntries(domainIds.map((domain) => [domain, bank.filter((topic) => topic.financeSubtopic === domain).length]));
check(
  "each subtopic has 41 or 42 titles",
  Object.values(domainCounts).every((count) => count === 41 || count === 42),
  JSON.stringify(domainCounts),
);
check("subtopic distribution totals 500", Object.values(domainCounts).reduce((sum, count) => sum + count, 0) === 500);

const weakLaneCells = [];
for (const domain of domainIds) {
  for (const lane of lanes) {
    const count = bank.filter((topic) => topic.financeSubtopic === domain && topic.lane === lane).length;
    if (count < 4 || count > 5) weakLaneCells.push(`${domain}:${lane}=${count}`);
  }
}
check("every subtopic has 4~5 titles in every lane", weakLaneCells.length === 0, weakLaneCells.join(", "));

const lengthOutliers = bank.filter((topic) => topic.title.length < 12 || topic.title.length > 36);
check("all titles are 12~36 characters", lengthOutliers.length === 0, lengthOutliers.slice(0, 8).map((topic) => topic.title).join(" | "));
const politeTitles = bank.filter((topic) => /(합니다|됩니다|습니다|입니다)[.!?]?$/u.test(topic.title));
check("titles never use explanatory polite endings", politeTitles.length === 0, politeTitles.slice(0, 8).map((topic) => topic.title).join(" | "));
const periodTitles = bank.filter((topic) => /[.。]$/.test(topic.title));
check("titles have no trailing period", periodTitles.length === 0);
const weakExplainers = bank.filter((topic) => /(공통점|체크리스트|절약법|부자 되는 법|돈 모으는 법)/.test(topic.title));
check("titles avoid weak explainer formulas", weakExplainers.length === 0, weakExplainers.slice(0, 8).map((topic) => topic.title).join(" | "));

const missingPackages = bank.filter(
  (topic) => !topic.problemStatement?.trim() || !topic.twist?.trim() || !topic.takeawayAction?.trim(),
);
check("every title carries problem twist and action", missingPackages.length === 0);

const nearDuplicates = [];
for (let left = 0; left < bank.length; left += 1) {
  for (let right = left + 1; right < bank.length; right += 1) {
    if (bank[left].financeSubtopic !== bank[right].financeSubtopic) continue;
    const score = similarity(bank[left].title, bank[right].title);
    if (score >= 0.72) nearDuplicates.push(`${score.toFixed(2)}:${bank[left].title} <> ${bank[right].title}`);
  }
}
check("same-subtopic titles have no near-duplicate pair", nearDuplicates.length === 0, nearDuplicates.slice(0, 8).join(" | "));

check("active helper imports only the new 500-title bank", /from "\.\/finance-editorial-topic-bank"/.test(helper));
check("active helper contains no old finance engine import", !/finance-curiosity-topic-engine|finance-editorial-calibration-bank/.test(helper));
check("finance legacy TOPIC_BANK is empty", /finance:\s*\[\],/.test(helper));
check("recommendation iterates all nine editorial lanes", /for \(const lane of shuffleWizardItems\(FINANCE_EDITORIAL_LANES\)\)/.test(helper));
check("recommendation uses versioned 500-bank recent key", /finance:editorial_bank_v2/.test(helper));
check("shown titles recycle only after the remaining pool is exhausted", /storedRecent\.length >= pool\.length \? \[\] : storedRecent/.test(helper) && /const recentWindowSize = pool\.length/.test(helper));
check("used titles are excluded before recommendation", /usedOnly:\s*true/.test(helper) && /usedTitles\.has\(normalizeTopicTitle\(seed\.title\)\)/.test(helper));
check("rated titles are excluded before recommendation", /ratedIds\.has\(`gen-finance-\$\{seed\.slug\}`\)/.test(helper));
check("new topics require Owner make decision", /source:\s*"editorial_bank"/.test(helper) && /requiresEditorialDecision:\s*true/.test(helper));
check("new bank keeps script package fields", /problemStatement:\s*item\.problemStatement/.test(helper) && /takeawayAction:\s*item\.takeawayAction/.test(helper));
check("source contains no stale 324/60 active-bank copy", !/기존 324개|60개 편집 패키지|FINANCE_EDITORIAL_CALIBRATION_BANK/.test(helper));
check("bank exports a defensive copy builder", /buildFinanceEditorialTopicBank/.test(source));

console.log(`\n${pass + fail} checks — ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
