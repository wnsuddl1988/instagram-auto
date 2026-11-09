#!/usr/bin/env node

/**
 * 부엉이 쇼츠 대본 품질 검사 — 제작 착수 전 게이트.
 *
 * 왜 필요한가:
 *   1편에서 이미지·영상·TTS를 전부 만든 뒤에야 "전달하는 바가 없다"는 걸 발견했다.
 *   대본 단계에서 30초면 잡을 문제를 완성 후에 잡으니 전체 재작업이 됐다.
 *   이 검사는 그 지점을 앞으로 당긴다.
 *
 * 무엇을 잡는가:
 *   기계적으로 판정 가능한 것만 본다. "이 설명이 말이 되는가" 같은 판단은
 *   사람 몫이고, 여기서는 **놓치기 쉬운 구멍**을 짚어주는 역할만 한다.
 *   그래서 결과는 PASS/FAIL 이 아니라 등급 + 지적 목록이다.
 *
 * 사용:
 *   node scripts/check-owl-script-quality-v1.mjs
 *   node scripts/check-owl-script-quality-v1.mjs --evidence <evidence-pack.json>
 */

import fs from "node:fs";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const scenes = OWL_ASSEMBLY_SPEC.scenes ?? [];
const fullText = scenes.map((s) => s.narration).join(" ");
const findings = [];

/** @param {"MUST"|"SHOULD"|"NICE"} level */
function flag(level, id, message, hint) {
  findings.push({ level, id, message, hint });
}

// ── 1. 인과 사슬 — 장면이 서로 이어지는가 ────────────────────────────────────
//
// 1편의 초기 대본이 실패한 지점이다. "카드론"과 "기준금리"가 각각 나오는데
// 둘을 잇는 장면이 없었다. 명사가 장면을 건너뛰며 재등장하는지로 근사한다.
/**
 * 핵심 명사를 뽑는다.
 *
 * 한국어는 조사가 붙어 같은 말이 다른 문자열이 된다("카드론"/"카드론이"/"카드론을").
 * 형태소 분석기를 붙이는 건 과하니, 흔한 조사·어미를 잘라내 어간만 남긴다.
 * 완벽하진 않지만 연결 판정에는 충분하다 — 여기서 중요한 건 정확도보다
 * **오탐을 줄이는 것**이다. 잘못된 경고가 쌓이면 아무도 이 검사를 안 본다.
 */
const PARTICLE_RE = /(이었|였|으로|에서|에게|에는|이라고|라고|부터|까지|보다|처럼|만큼|이고|이며|이나|거든|는데|이면|하면|다고|이야|이지|이다|은|는|이|가|을|를|의|도|만|과|와|로|에|야|지)$/;

function normalizeNoun(word) {
  let w = word;
  // 조사가 겹쳐 붙는 경우가 있어 두 번까지 벗긴다("카드론에서는").
  for (let i = 0; i < 2; i += 1) {
    const stripped = w.replace(PARTICLE_RE, "");
    if (stripped.length < 2 || stripped === w) break;
    w = stripped;
  }
  return w;
}

function extractKeyNouns(text) {
  const words = text.match(/[가-힣]{2,}/g) ?? [];
  const stop = new Set([
    "그런데", "그래서", "하지만", "이게", "우리", "오늘", "지금", "먼저", "실제로",
    "때문", "정도", "가까이", "얘기", "사실", "문제", "여기서", "이거", "이걸",
    "있다고", "치자", "봐도", "된다", "한다", "있어", "없어", "같지", "구해와",
    "진짜", "특히", "결국", "조심", "최고", "다음", "하나", "그거", "이런", "저런",
  ]);
  return words
    .map(normalizeNoun)
    .filter((w) => w.length >= 2 && !stop.has(w));
}

const nounsByScene = scenes.map((s) => new Set(extractKeyNouns(s.narration)));
const brokenLinks = [];
for (let i = 1; i < scenes.length - 1; i += 1) {
  // 마지막 장면(CTA)은 내용 연결 대상이 아니다.
  const prev = nounsByScene[i - 1];
  const cur = nounsByScene[i];
  const shared = [...cur].filter((n) => prev.has(n));
  if (shared.length === 0) {
    brokenLinks.push({ from: scenes[i - 1].scene, to: scenes[i].scene });
  }
}
if (brokenLinks.length > 0) {
  flag(
    "MUST",
    "causal-chain",
    `장면 연결이 끊긴 지점 ${brokenLinks.length}곳: ` +
      brokenLinks.map((l) => `${l.from}→${l.to}`).join(", "),
    "앞 장면의 말을 받아서 다음 장면을 시작하세요. 두 사실을 나란히 놓기만 하면 시청자는 왜 연결되는지 모릅니다.",
  );
}

// ── 2. 숫자를 생활 언어로 번역했는가 ─────────────────────────────────────────
//
// 채널 이름이 "번역소"인 이유. "0.25%p 인상"은 정보고,
// "1000만원이면 연 2만 5천원"은 번역이다.
const hasMoneyTranslation = /[0-9,]+\s*(만원|천원|원)/.test(fullText);
if (!hasMoneyTranslation) {
  flag(
    "MUST",
    "money-translation",
    "퍼센트를 실제 금액으로 바꿔준 대목이 없습니다.",
    '"0.25%p 오르면 1000만원 기준 연 2만 5천원" 같은 환산을 최소 한 번 넣으세요.',
  );
}

// 체감 비유 — 금액을 일상 단위로 한 번 더 내리는가
const hasRelatable = /(커피|점심|한 달|월세|치킨|택시|주유|장보기|통신비)/.test(fullText);
if (!hasRelatable) {
  flag(
    "SHOULD",
    "relatable-scale",
    "금액을 일상 감각으로 옮긴 표현이 없습니다.",
    '"한 달 커피 두 잔 값", "점심 한 끼" 처럼 크기를 체감하게 해주면 기억에 남습니다.',
  );
}

// ── 3. 행동의 이득이 있는가 ──────────────────────────────────────────────────
//
// 1편의 가장 큰 구멍이었다. "리볼빙 확인해 봐"에서 끝나면
// 확인해서 뭘 얻는지 모른다.
const actionScene = scenes.find((s) => s.role === "action");
if (!actionScene) {
  flag("MUST", "action-missing", "행동 유도(action) 장면이 없습니다.", "시청자가 오늘 할 수 있는 일 하나를 넣으세요.");
} else {
  const a = actionScene.narration;
  const hasConcreteStep = /(앱|메뉴|설정|콜센터|홈페이지|고객센터|화면|들어가)/.test(a);
  // 한국어 활용형 주의: "피하다"는 "피해"/"피할"/"피하면"처럼 어미마다 표기가
  // 갈린다. "피하"라는 부분 문자열은 "피할"엔 없다(한글은 음절 단위 조합이라
  // "피" + "하" + "ㄹ" → "피할"이 되지 "피하"+"ㄹ"이 아니다). 어간 "피"만 보는
  // 대신 흔한 활용형을 각각 나열해 놓친다.
  const hasBenefit = /(아끼|줄어|줄이|절약|막아|막을|막는|방지|낮추|피해|피할|피하면|덜 내|안 내도|묶이|묶여)/.test(a);
  if (!hasConcreteStep) {
    flag(
      "SHOULD",
      "action-howto",
      "행동 장면에 '어디서 어떻게' 하는지가 없습니다.",
      '"카드 앱 → 결제 예정 금액 → 리볼빙 설정" 처럼 경로를 짚어주세요.',
    );
  }
  if (!hasBenefit) {
    flag(
      "MUST",
      "action-benefit",
      "행동 장면에 '그래서 뭘 얻는지'가 없습니다.",
      '"확인해 봐"에서 끝내지 말고 "켜져 있으면 끄기만 해도 이자를 몇 % 덜 낸다" 처럼 이득을 붙이세요.',
    );
  }
}

// ── 4. 후킹 요소 ─────────────────────────────────────────────────────────────
const hookScene = scenes.find((s) => s.role === "hook");
if (hookScene) {
  const h = hookScene.narration;
  if (!/[0-9]/.test(h)) {
    flag("SHOULD", "hook-number", "훅에 숫자가 없습니다.", "구체적 수치가 있으면 멈춰 세우는 힘이 커집니다.");
  }
  if (!/(\?|지\?|까\?|는데|근데|사실)/.test(h)) {
    flag("NICE", "hook-tension", "훅에 의문이나 반전 신호가 약합니다.", '"~인 줄 알았지?", "근데" 같은 장치로 궁금증을 만드세요.');
  }
}

// 중간 반전 — 통념을 뒤집거나 의외의 사실을 주는 대목
const hasTwist = /(사실은|의외로|그런데|알고 보면|다르|반대로|착각|오해|모르는)/.test(fullText);
if (!hasTwist) {
  flag(
    "SHOULD",
    "twist",
    "통념을 뒤집거나 의외성을 주는 대목이 없습니다.",
    "아는 내용만 나오면 끝까지 안 봅니다. 한 번은 '어?' 하게 만드세요.",
  );
}

// ── 5. 전문성 — 원리를 설명하는가 ────────────────────────────────────────────
//
// 사실 나열과 원리 설명은 다르다. 후자가 있어야 "쉽게 풀어주는 전문가"가 된다.
const hasMechanism = /(때문|이유|구조|원리|어떻게|그래서|하려면|못 받|대신|거쳐)/.test(fullText);
if (!hasMechanism) {
  flag(
    "MUST",
    "mechanism",
    "왜 그런 일이 벌어지는지 설명하는 대목이 없습니다.",
    "숫자만 나열하면 뉴스 요약입니다. 메커니즘을 한 번 풀어주세요.",
  );
}

// ── 6. 분량 ──────────────────────────────────────────────────────────────────
//
// 상한은 없다. 다만 너무 짧으면 정보가 전달되다 만다(Owner 지적).
const totalChars = fullText.replace(/\s/g, "").length;
const estimatedSec = Math.round(totalChars / 7.0); // 1편 실측 기준 근사
if (totalChars < 350) {
  flag(
    "SHOULD",
    "too-short",
    `대본이 ${totalChars}자(약 ${estimatedSec}초)로 짧습니다.`,
    "설명이 끊긴 느낌을 줍니다. 예시나 배경을 붙여 밀도를 높이세요.",
  );
}

// ── 7. 근거 ──────────────────────────────────────────────────────────────────
const evidencePath = getArg("--evidence");
if (evidencePath && fs.existsSync(evidencePath)) {
  const pack = JSON.parse(fs.readFileSync(evidencePath, "utf8"));
  const evidenceText = JSON.stringify(pack);
  // 대본에 나온 숫자가 근거 자료에 실제로 있는지 본다.
  // "1000만원 쓴다고 치자" 같은 **가정 수치**는 근거가 필요 없다. 계산 예시를
  // 들기 위한 임의 값이기 때문이다. 가정 표현 근처의 숫자는 검사에서 뺀다.
  const assumptionNumbers = new Set();
  for (const match of fullText.matchAll(
    /([0-9,]+(?:\.[0-9]+)?)\s*(?:만원|원|천원|%p?)[^.]{0,20}?(치자|가정|예를 들|라면|기준으로|만약)/g,
  )) {
    assumptionNumbers.add(match[1].replace(/,/g, ""));
  }
  // "만약"이 숫자 앞에 오는 경우도 잡는다("만약 규제가 빡빡해져서 0.5%p만 올라도").
  // 같은 문장(마침표 전까지) 안에서만 연결한다 — 문장을 넘어가면 오탐 위험이 커진다.
  // 소수점을 문장 구분자로 착각하지 않도록, 숫자 뒤가 아닌 마침표에서만 자른다.
  for (const sentence of fullText.split(/(?<![0-9])[.!?]\s*/)) {
    if (!/만약/.test(sentence)) continue;
    for (const n of sentence.match(/[0-9,]+(?:\.[0-9]+)?/g) ?? []) {
      assumptionNumbers.add(n.replace(/,/g, ""));
    }
  }
  // 계산으로 나온 값도 근거 자료엔 없다("0.25%p 오르면 2만 5천원 늘어").
  // 소수점을 문장 구분자로 착각하지 않도록, 숫자 뒤가 아닌 마침표에서만 자른다.
  const derivedNumbers = new Set();
  for (const sentence of fullText.split(/(?<![0-9])[.!?]\s*/)) {
    if (!/(늘어|줄어|더 나가|더 내|아껴|절약|계산하면)/.test(sentence)) continue;
    for (const n of sentence.match(/[0-9,]+(?:\.[0-9]+)?/g) ?? []) {
      derivedNumbers.add(n.replace(/,/g, ""));
    }
  }

  const scriptNumbers = [...new Set(fullText.match(/[0-9]+(?:\.[0-9]+)?/g) ?? [])];
  const unbacked = scriptNumbers.filter((n) => {
    if (n.length <= 1) return false; // 1, 2 같은 건 문맥 숫자일 수 있다
    if (assumptionNumbers.has(n) || derivedNumbers.has(n)) return false;
    return !evidenceText.includes(n);
  });
  if (unbacked.length > 0) {
    flag(
      "MUST",
      "unbacked-numbers",
      `근거 자료에서 찾을 수 없는 숫자: ${unbacked.join(", ")}`,
      "계산으로 도출한 값이면 괜찮습니다. 아니면 출처를 확인하세요 — 틀린 숫자는 채널 신뢰를 한 번에 무너뜨립니다.",
    );
  }
}

// ── 8. 마무리 ────────────────────────────────────────────────────────────────
const closing = scenes.find((s) => s.role === "closing_cta");
if (!closing) {
  flag("SHOULD", "cta-missing", "마무리 CTA 장면이 없습니다.", "팔로우·구독 유도를 넣으세요.");
} else if (/(참고용|책임|판단은 본인)/.test(closing.narration)) {
  flag(
    "MUST",
    "disclaimer-in-cta",
    "마무리에 면책 문구가 들어 있습니다.",
    "뉴스 성격 채널에서 '판단은 본인에게'는 정보의 정확성을 스스로 의심하게 만듭니다. 팔로우 유도로 바꾸세요.",
  );
}

// ── 출력 ─────────────────────────────────────────────────────────────────────
const must = findings.filter((f) => f.level === "MUST");
const should = findings.filter((f) => f.level === "SHOULD");
const nice = findings.filter((f) => f.level === "NICE");

console.log("");
console.log("═".repeat(64));
console.log("  부엉이 쇼츠 대본 품질 검사");
console.log("═".repeat(64));
console.log(`  제목: ${OWL_ASSEMBLY_SPEC.title}`);
console.log(`  분량: ${totalChars}자 (약 ${estimatedSec}초 예상) / ${scenes.length}장면`);
console.log("");

if (findings.length === 0) {
  console.log("  지적 사항 없음. 제작을 진행하세요.");
} else {
  for (const group of [
    { label: "반드시 고칠 것", items: must, mark: "✗" },
    { label: "고치면 좋은 것", items: should, mark: "!" },
    { label: "참고", items: nice, mark: "·" },
  ]) {
    if (group.items.length === 0) continue;
    console.log(`  [${group.label}] ${group.items.length}건`);
    for (const f of group.items) {
      console.log(`    ${group.mark} ${f.message}`);
      console.log(`      → ${f.hint}`);
    }
    console.log("");
  }
}

console.log("─".repeat(64));
if (must.length > 0) {
  console.log(`  판정: 제작 보류 — 반드시 고칠 것 ${must.length}건`);
} else if (should.length > 0) {
  console.log(`  판정: 진행 가능 — 다만 ${should.length}건 검토 권장`);
} else {
  console.log("  판정: 진행 가능");
}
console.log("");
console.log("  ※ 이 검사는 놓치기 쉬운 구멍을 짚을 뿐입니다.");
console.log("    '이 설명이 실제로 말이 되는가'는 사람이 읽고 판단하세요.");
console.log("");

process.exit(must.length > 0 ? 1 : 0);
