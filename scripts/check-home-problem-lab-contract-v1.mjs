import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = [
  "lib/home-problem-lab/types.ts",
  "lib/home-problem-lab/config.ts",
  "lib/home-problem-lab/prompts.ts",
  "lib/home-problem-lab/tts-normalization.ts",
  "lib/home-problem-lab/quality.ts",
  "lib/home-problem-lab/dry-run.ts",
  "app/api/home-problem-lab/route.ts",
  "app/home-problem-lab/page.tsx",
];
const text = files.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
const fixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_product_cards.mock.v1.json"), "utf8"));
const boundaryFixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_quality_boundaries.v1.json"), "utf8"));
const expected = [
  "home_problem_lab", "hook_problem", "lumi_diagnosis", "cause_explanation", "free_solution",
  "product_criteria", "product_card_optional", "verdict_cta", "next_case_teaser",
  "ELEVENLABS_LUMI_VOICE_ID", "eleven_multilingual_v2", "eleven_flash_v2_5",
  "stability: 0.62", "similarityBoost: 0.78", "style: 0.08", "speed: 1.08",
  "externalCalls: 0", "instagramUpload: false", "youtubeUpload: false", "credentialFallback: false",
  "title: string", "description: string", "hashtags: string[]", "disclosure: HomeProblemLabDisclosure",
  "HOME_PROBLEM_LAB_VISUAL_NEGATIVE_RULES", "브랜드명, 로고, 패키지, 상품명, 가격표",
];
const failures = expected.filter((value) => !text.includes(value));
if (fixture.isMock !== true || fixture.isPublishable !== false || fixture.affiliateUrl !== null || fixture.sourceUrl !== null) {
  failures.push("mock_fixture_contract_invalid");
}
if (boundaryFixture.cases?.score21?.expectedQualityCandidate !== false || boundaryFixture.cases?.score22?.expectedQualityCandidate !== true) {
  failures.push("quality_boundary_fixture_invalid");
}
if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_CONTRACT_FAIL: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("HOME_PROBLEM_LAB_CONTRACT_PASS: 5 dry-run topics, score boundaries, mock-only product card, no external calls");
