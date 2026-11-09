/**
 * check-lh3-living-tips-boost.mjs
 *
 * QA-LH-3 저장 plan 기준으로 living_tips narration 보강 로직 로컬 검증
 * (유료 API 호출 없음 — 저장 JSON만 사용)
 *
 * 실행:
 *   node scripts/check-lh3-living-tips-boost.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const plan = JSON.parse(
  readFileSync(join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh3_plan.json"), "utf8")
);

// ── 보강 로직 (route.ts 5-a-lt 블록과 동일) ────────────────────────────────
const NARRATION_WARNING_LEN = 14;
const THIN_CTA_RE =
  /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요|고\s*보세요)|공유해\s*주세요|팔로우해\s*주세요|이\s*방법을\s*기억하세요|기억해\s*두세요)[!.。]?\s*$/;
const CTA_SUMMARY_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;

// scene 10 CTA 판정 (route.ts 6-d와 동일)
const LIVING_TIPS_THIN_CTA_GATE_RE =
  /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요)|저장해\s*두고\s*보세요|공유해\s*주세요|팔로우해\s*주세요|팔로우하고\s*더\s*보세요|구독해\s*주세요|좋아요\s*눌러\s*주세요)[!.。]?\s*$/;
const CTA_HAS_SUMMARY_GATE_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;

const total = plan.scenes.length;

console.log("=== QA-LH-3 living_tips 보강 시뮬레이션 ===\n");

const results = plan.scenes.map((scene, idx) => {
  const sceneNumber = idx + 1;
  let narration = (scene.narration ?? "").trim();
  let caption = (scene.caption ?? "").trim();
  let narLen = narration.replace(/\s/g, "").length;
  const boosts = [];

  // scene 2~7 중반부 얇은 문장 보강
  if (sceneNumber >= 2 && sceneNumber <= 7 && narLen < NARRATION_WARNING_LEN) {
    const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
    const nextNar = (plan.scenes[idx + 1]?.narration ?? "").trim();
    const LOCATION_RE = /(?:안쪽\s*칸|문칸|냉동실|냉장실|상온|서늘한\s*곳|그늘진\s*곳|통풍이\s*잘\s*되는)/;
    const locationMatch = prevNar.match(LOCATION_RE) ?? nextNar.match(LOCATION_RE);
    const REASON_RE = /(?:온도\s*변화|온도\s*차이|습기|냄새|세균|에틸렌|산화)/;
    const reasonMatch = nextNar.match(REASON_RE);
    const reasonWord = reasonMatch ? reasonMatch[0].trim() : null;
    let boosted = null;
    if (locationMatch) {
      const loc = locationMatch[0].trim();
      const candidate = `${loc}은 ${narration}`;
      const candidateLen = candidate.replace(/\s/g, "").length;
      if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
    }
    if (!boosted && reasonWord) {
      const candidate = `${narration.replace(/[.。]$/, "")}, ${reasonWord}가 심해요.`;
      const candidateLen = candidate.replace(/\s/g, "").length;
      if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
    }
    if (boosted) {
      boosts.push({ type: "scene2~7 보강", from: narration, to: boosted });
      narration = boosted;
      narLen = boosted.replace(/\s/g, "").length;
    }
  }

  // scene 8~9 얇은 문장 보강
  if ((sceneNumber === 8 || sceneNumber === 9) && narLen < NARRATION_WARNING_LEN) {
    const captionLen = caption.replace(/\s/g, "").length;
    if (captionLen >= 3 && !narration.includes(caption.replace(/[!.。]$/, ""))) {
      const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
      const objectMatch = prevNar.match(/([가-힣]{2,})(?:와|과|은|는|이|가|을|를|에서|으로)/);
      const hasJongseong = objectMatch
        ? (objectMatch[1].charCodeAt(objectMatch[1].length - 1) - 0xAC00) % 28 !== 0
        : false;
      const josa = hasJongseong ? "을" : "를";
      const subjectPrefix = objectMatch ? `${objectMatch[1]}${josa} 함께 두면 ` : "";
      const boosted = subjectPrefix
        ? `${subjectPrefix}${narration}`
        : `${caption.replace(/[!.。]$/, "")}일 때 ${narration}`;
      const boostedLen = boosted.replace(/\s/g, "").length;
      if (boostedLen >= NARRATION_WARNING_LEN && boostedLen <= 30) {
        boosts.push({ type: "scene8~9 보강", from: narration, to: boosted });
        narration = boosted;
        narLen = boostedLen;
      }
    }
  }

  // scene 10 CTA 단독 보강
  if (sceneNumber === total) {
    const origNar = narration;
    const isThinCta =
      THIN_CTA_RE.test(origNar) || (!CTA_SUMMARY_RE.test(origNar) && narLen < 14);
    if (isThinCta && caption.replace(/\s/g, "").length >= 5) {
      const captionCore = caption.replace(/[!.。]$/, "").trim();
      const boosted = `${captionCore} 두세요, 저장해두면 유용해요.`;
      const boostedLen = boosted.replace(/\s/g, "").length;
      if (boostedLen >= 14 && boostedLen <= 35) {
        boosts.push({ type: "scene10 CTA 보강", from: origNar, to: boosted });
        narration = boosted;
        narLen = boostedLen;
      }
    }
  }

  const isShortAfter = narLen < NARRATION_WARNING_LEN;

  return { sceneNumber, caption, narBefore: scene.narration, narAfter: narration, narLen, isShortAfter, boosts };
});

// ── 결과 출력 ─────────────────────────────────────────────────────────────────
let shortCount = 0;
for (const r of results) {
  const changed = r.boosts.length > 0;
  const still_short = r.isShortAfter;
  if (changed || still_short) {
    console.log(`[scene ${r.sceneNumber}] caption: "${r.caption}"`);
    if (changed) {
      for (const b of r.boosts) {
        console.log(`  ✅ ${b.type}: "${b.from}" → "${b.to}" (${b.to.replace(/\s/g,"").length}자)`);
      }
    }
    if (still_short) {
      console.log(`  ⚠️  보강 후에도 짧음 (${r.narLen}자): "${r.narAfter}"`);
      shortCount++;
    }
    console.log();
  }
}

// ── CTA gate 재평가 ───────────────────────────────────────────────────────────
const scene10After = results[9]?.narAfter ?? "";
const scene10Len = scene10After.replace(/\s/g, "").length;
const isThinCtaAfter =
  LIVING_TIPS_THIN_CTA_GATE_RE.test(scene10After) ||
  (!CTA_HAS_SUMMARY_GATE_RE.test(scene10After) && scene10Len < 14);

console.log("=== scene 10 CTA gate 재평가 ===");
console.log(`  narration: "${scene10After}" (${scene10Len}자)`);
console.log(`  isThinCta (게이트 적용됨): ${isThinCtaAfter}`);
console.log(`  → ${isThinCtaAfter ? "⚠️  CTA 핵심 요약 누락 warning 유지 (gate L 작동)" : "✅ CTA 핵심 요약 통과"}`);

// ── 최종 short narration 집계 ─────────────────────────────────────────────────
const shortNarCount = results.filter((r) => r.isShortAfter).length;
console.log(`\n=== 최종 short narration 집계 ===`);
console.log(`  보강 후 14자 미만 scene 수: ${shortNarCount}건`);
console.log(`  Gate M (3건 이상 → review 상한 79): ${shortNarCount >= 3 ? "⚠️ 작동" : "✅ 통과"}`);

console.log("\n=== 검증 완료 (유료 API 호출 없음) ===");
