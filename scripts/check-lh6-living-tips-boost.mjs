/**
 * check-lh6-living-tips-boost.mjs
 *
 * QA-LH-6 저장 plan 기준으로 living_tips narration 보강 로직 로컬 검증
 * (유료 API 호출 없음 — 저장 JSON만 사용)
 *
 * 실행:
 *   node scripts/check-lh6-living-tips-boost.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const plan = JSON.parse(
  readFileSync(join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh6_plan.json"), "utf8")
);

const NARRATION_WARNING_LEN = 14;

// ── scene 2~7 boost regex ──────────────────────────────────────────────────
const QUESTION_ENDING_RE = /(?:죠|나요|을까요|ㄹ까요|까요)[?？]?\s*$/;
const LOCATION_RE = /(?:안쪽\s*칸|문칸|냉동실|냉장실|상온|서늘한\s*곳|그늘진\s*곳|통풍이\s*잘\s*되는)/;
const REASON_RE = /(?:온도\s*변화|온도\s*차이|습기|냄새|세균|에틸렌|산화)/;

// ── scene 8~9 boost ────────────────────────────────────────────────────────
const FOOD_STORAGE_CONTEXT_RE = /냉장고|냉동|냉장실|냉동실|보관|신선도|에틸렌|산화|산패/;

const subTopicId =
  plan._meta?.subTopicId ?? plan._subTopicId ?? "";
const isFoodStorageContext = (prevNar, curNar) =>
  subTopicId.includes("food-storage") ||
  subTopicId.includes("fridge") ||
  FOOD_STORAGE_CONTEXT_RE.test(prevNar) ||
  FOOD_STORAGE_CONTEXT_RE.test(curNar);

// ── scene 10 CTA boost regex ───────────────────────────────────────────────
const LIVING_TIPS_THIN_CTA_GATE_RE =
  /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요)|저장해\s*두고\s*보세요|공유해\s*주세요|팔로우해\s*주세요|팔로우하고\s*더\s*보세요|구독해\s*주세요|좋아요\s*눌러\s*주세요)[!.。]?\s*$/;
const CTA_HAS_SUMMARY_GATE_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;

const THIN_CTA_RE =
  /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요|고\s*보세요)|공유해\s*주세요|팔로우해\s*주세요|이\s*방법을\s*기억하세요|기억해\s*두세요)[!.。]?\s*$/;
const CTA_SUMMARY_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;
const ABSTRACT_CAPTION_RE = /^(?:유용한?\s*팁|꿀팁|저장|공유|팔로우|기억|정보|방법|팁)[!.。]?\s*$/;

const INGREDIENT_RE = /(?:식초|베이킹소다|소금|레몬|알코올|세제|[0-9]+분|[0-9]+:[0-9]+|[0-9]+배)/;
const OBJECT_RE = /(?:기름때|찌든\s*때|냄새|녹|얼룩|물때|세균)/;

const total = plan.scenes.length;

console.log(`=== QA-LH-6 living_tips 보강 시뮬레이션 (${plan.title}) ===`);
console.log(`    subTopicId: ${subTopicId}\n`);

const results = plan.scenes.map((scene, idx) => {
  const sceneNumber = idx + 1;
  let narration = (scene.narration ?? "").trim();
  const caption = (scene.caption ?? "").trim();
  let narLen = narration.replace(/\s/g, "").length;
  const boosts = [];

  // ── scene 2~7 보강 ─────────────────────────────────────────────────────────
  if (sceneNumber >= 2 && sceneNumber <= 7 && narLen < NARRATION_WARNING_LEN) {
    const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
    const nextNar = (plan.scenes[idx + 1]?.narration ?? "").trim();
    let boosted = null;

    if (QUESTION_ENDING_RE.test(narration) && narLen < NARRATION_WARNING_LEN) {
      const captionCore = caption.replace(/[?！!.。]$/, "").trim();
      if (captionCore.replace(/\s/g, "").length >= 3) {
        const captionNounMatch = captionCore.match(/^([가-힣]{2,})/);
        const captionNoun = captionNounMatch ? captionNounMatch[1] : captionCore;
        const lastCode = captionNoun.charCodeAt(captionNoun.length - 1);
        const nounJosa = (lastCode - 0xAC00) % 28 !== 0 ? "이" : "가";
        const nextKeyMatch = nextNar.match(/([가-힣]{2,}(?:하면|하지|되면|될수록|될수|않으면))/);
        const candidate = nextKeyMatch
          ? `${captionNoun}은 방치하면 더 닦기 어려워집니다.`
          : `${captionNoun}${nounJosa} 쌓이면 청소가 더 힘들어져요.`;
        const candidateLen = candidate.replace(/\s/g, "").length;
        if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 35) boosted = candidate;
      }
    }

    if (!boosted) {
      const locationMatch = prevNar.match(LOCATION_RE) ?? nextNar.match(LOCATION_RE);
      if (locationMatch) {
        const loc = locationMatch[0].trim();
        const candidate = `${loc}은 ${narration}`;
        const candidateLen = candidate.replace(/\s/g, "").length;
        if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
      }
    }

    if (!boosted) {
      const reasonMatch = nextNar.match(REASON_RE);
      if (reasonMatch) {
        const reasonWord = reasonMatch[0].trim();
        const candidate = `${narration.replace(/[.。]$/, "")}, ${reasonWord}가 심해요.`;
        const candidateLen = candidate.replace(/\s/g, "").length;
        if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
      }
    }

    if (boosted) {
      boosts.push({ type: "scene2~7 보강", from: narration, to: boosted });
      narration = boosted;
      narLen = boosted.replace(/\s/g, "").length;
    }
  }

  // ── scene 8~9 보강 ─────────────────────────────────────────────────────────
  if ((sceneNumber === 8 || sceneNumber === 9) && narLen < NARRATION_WARNING_LEN) {
    const captionLen = caption.replace(/\s/g, "").length;
    if (captionLen >= 3 && !narration.includes(caption.replace(/[!.。]$/, ""))) {
      const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
      let boosted = null;

      if (isFoodStorageContext(prevNar, narration)) {
        // 음식 보관 맥락: 직전 명사 + "을/를 함께 두면"
        const objectMatch = prevNar.match(/([가-힣]{2,})(?:와|과|은|는|이|가|을|를|에서|으로)/);
        if (objectMatch) {
          const hasJongseong =
            (objectMatch[1].charCodeAt(objectMatch[1].length - 1) - 0xAC00) % 28 !== 0;
          const josa = hasJongseong ? "을" : "를";
          const candidate = `${objectMatch[1]}${josa} 함께 두면 ${narration}`;
          const candidateLen = candidate.replace(/\s/g, "").length;
          if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
        }
      } else {
        // 비음식 맥락: caption 첫 한글 단어 + "은/는 {origNar}"
        const captionCore = caption.replace(/[!.。]$/, "").trim();
        const captionNounMatch = captionCore.match(/^([가-힣]+)/);
        const captionFirstWord = captionNounMatch?.[1] ?? "";
        if (captionFirstWord.length >= 2 && !captionCore.includes(" ")) {
          const lastCode = captionFirstWord.charCodeAt(captionFirstWord.length - 1);
          const hasJong = (lastCode - 0xAC00) % 28 !== 0;
          const topic = hasJong ? `${captionFirstWord}은` : `${captionFirstWord}는`;
          const candidate = `${topic} ${narration}`;
          const candidateLen = candidate.replace(/\s/g, "").length;
          if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
        }
        // fallback
        if (!boosted) {
          const candidate = `이 방법으로 ${narration}`;
          const candidateLen = candidate.replace(/\s/g, "").length;
          if (candidateLen >= NARRATION_WARNING_LEN && candidateLen <= 30) boosted = candidate;
        }
      }

      if (boosted) {
        const boostedLen = boosted.replace(/\s/g, "").length;
        boosts.push({ type: "scene8~9 보강", from: narration, to: boosted });
        narration = boosted;
        narLen = boostedLen;
      }
    }
  }

  // ── scene 10 CTA 보강 ──────────────────────────────────────────────────────
  if (sceneNumber === total) {
    const origNar = narration;
    const isThinCta =
      THIN_CTA_RE.test(origNar) || (!CTA_SUMMARY_RE.test(origNar) && narLen < 14);

    if (isThinCta) {
      const captionIsAbstract =
        ABSTRACT_CAPTION_RE.test(caption) || caption.replace(/\s/g, "").length < 5;
      let boosted = null;

      if (!captionIsAbstract) {
        const captionCore = caption.replace(/[!.。]$/, "").trim();
        const candidate = `${captionCore} 두세요, 저장해두면 유용해요.`;
        const candidateLen = candidate.replace(/\s/g, "").length;
        if (candidateLen >= 14 && candidateLen <= 35) boosted = candidate;
      }

      if (!boosted) {
        const lateSummaryNars = plan.scenes.slice(5, 9)
          .map(s => (s.narration ?? "").trim())
          .filter(n => n.length > 0);

        let ingredientWord = null;
        let objectWord = null;
        for (const n of lateSummaryNars) {
          if (!ingredientWord) { const m = n.match(INGREDIENT_RE); if (m) ingredientWord = m[0]; }
          if (!objectWord)     { const m = n.match(OBJECT_RE);     if (m) objectWord = m[0]; }
        }

        if (ingredientWord && objectWord) {
          const candidate = `${objectWord}엔 ${ingredientWord}이 효과적이에요, 저장해두면 유용해요.`;
          if (candidate.replace(/\s/g, "").length >= 14 && candidate.replace(/\s/g, "").length <= 40) boosted = candidate;
        } else if (ingredientWord) {
          const candidate = `${ingredientWord} 방법, 저장해두면 유용해요.`;
          if (candidate.replace(/\s/g, "").length >= 14 && candidate.replace(/\s/g, "").length <= 35) boosted = candidate;
        } else if (objectWord) {
          const candidate = `${objectWord} 제거엔 이 방법을 기억하세요.`;
          if (candidate.replace(/\s/g, "").length >= 14 && candidate.replace(/\s/g, "").length <= 35) boosted = candidate;
        }
      }

      if (boosted) {
        boosts.push({ type: "scene10 CTA 보강", from: origNar, to: boosted });
        narration = boosted;
        narLen = boosted.replace(/\s/g, "").length;
      }
    }
  }

  const isShortAfter = narLen < NARRATION_WARNING_LEN;
  return { sceneNumber, caption, narBefore: scene.narration, narAfter: narration, narLen, isShortAfter, boosts };
});

// ── 출력 ──────────────────────────────────────────────────────────────────────
for (const r of results) {
  if (r.boosts.length > 0 || r.isShortAfter) {
    console.log(`[scene ${r.sceneNumber}] caption: "${r.caption}"`);
    for (const b of r.boosts) {
      console.log(`  ✅ ${b.type}: "${b.from}" → "${b.to}" (${b.to.replace(/\s/g,"").length}자)`);
    }
    if (r.isShortAfter) {
      console.log(`  ⚠️  보강 후에도 짧음 (${r.narLen}자): "${r.narAfter}"`);
    }
    console.log();
  }
}

// ── CTA gate 재평가 ────────────────────────────────────────────────────────────
const scene10After = results[9]?.narAfter ?? "";
const scene10Len = scene10After.replace(/\s/g, "").length;
const isThinCtaAfter =
  LIVING_TIPS_THIN_CTA_GATE_RE.test(scene10After) ||
  (!CTA_HAS_SUMMARY_GATE_RE.test(scene10After) && scene10Len < 14);

console.log("=== scene 10 CTA gate 재평가 ===");
console.log(`  narration: "${scene10After}" (${scene10Len}자)`);
console.log(`  isThinCta (gate L): ${isThinCtaAfter ? "⚠️  누락 warning 유지" : "✅ 통과"}`);

// ── short narration 집계 ─────────────────────────────────────────────────────
const shortNarCount = results.filter(r => r.isShortAfter).length;
console.log(`\n=== 최종 short narration 집계 ===`);
console.log(`  보강 후 14자 미만 scene 수: ${shortNarCount}건`);
console.log(`  Gate M (3건 이상 → cap 79): ${shortNarCount >= 3 ? "⚠️ 작동" : "✅ 통과"}`);
console.log("\n=== 검증 완료 (유료 API 호출 없음) ===");
