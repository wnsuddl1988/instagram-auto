/**
 * check-caption-sanitizer.mjs
 *
 * caption sanitizer 로컬 테스트 스크립트 (Node.js ESM, 유료 API 호출 없음)
 *
 * 실행:
 *   node scripts/check-caption-sanitizer.mjs
 *
 * lib/captionSanitizer.ts 와 동일한 로직을 JS로 포팅.
 * TS 파일이 변경되면 이 스크립트도 함께 업데이트할 것.
 */

// ─────────────────────────────────────────────────────────────────────────────
// isCaptionLike (lib/captionSanitizer.ts 와 동일)
// ─────────────────────────────────────────────────────────────────────────────
function isCaptionLike(text) {
  if (!text || text.trim().length === 0) return false;
  const t = text.trim();
  if (/\s(은|는|이|가|을|를|에|의|도|만)$/.test(t)) return false;
  // 조사가 단어에 붙어 끝나는 경우 — "친구의 소식은", "그때 아버지는"
  if (/[가-힣](은|는)$/.test(t) && t.includes(" ")) return false;
  const _wc = t.split(/\s+/).filter(Boolean).length;
  if (/[가-힣](을|를|이|가)$/.test(t) && _wc >= 2) return false;
  if (/(매일|다시|항상|자주|또|더|여전히|아직|지금도|한번|한 번)$/.test(t)) return false;
  if (_wc >= 2 && /(있는|없는|남겨진|숨겨진|기다리던|남아있는|담겨진|담긴|쌓인|잊혀진|잊혀간|잊히는|남은|사라진|지나간|지나온|잃은|떠난|가신|돌아간|먼저간|돌아오지않는|오지않는)$/.test(t)) return false;
  if (/(했어요|했죠|했어|했었어|있어요|없어요|이에요|예요|네요|더라고요|거든요|거예요|셨어요|셨죠|셨어|잖아요|잖죠|겠죠|있었죠|없었죠|있었어요|없었어요)$/.test(t)) return false;
  // 일반 과거형 문장 ("몰랐어요" 포함)
  if (/(남았어요|생겼어요|알았어요|깨달았어요|이해했어요|기억났어요|떠올랐어요|보였어요|들렸어요|느껴졌어요|몰랐어요|알게됐어요|보게됐어요|하게됐어요)$/.test(t)) return false;
  if (/(해요|하죠|하네요|해서요|할게요|할까요|했나요)$/.test(t)) return false;
  if (/(대요|래요|대$|랬대|셨대|었대|았대)/.test(t)) return false;
  if (/(고,|고$|며,|며$|서,|서$)/.test(t)) return false;
  if (/는\s*[가-힣]{1,3}$/.test(t)) return false;
  if (/(져|셨|하셨|하다|였다|었다|있다|없다|겠다|잖$|었죠|았죠|있죠|없죠|이었|이었다|였어|이었어)$/.test(t)) return false;
  if (/(으셨어|셨었어|았어|었어|았었어|었었어|궁금했어|알았어|몰랐어|느꼈어|봤어|봤죠|됐어|됐죠)$/.test(t)) return false;
  // 관형형으로 끝나는 미완성 조각 ("아버지의 소중한" 등), 오브젝트 명사로 끝나는 경우 제외
  if (_wc >= 2 && /(한|ㄴ|운|스러운|다운|로운)$/.test(t)
    && !/(?:사진|지갑|노트|메모|쪽지|열쇠|의자|그릇|도시락|반찬통|액자|전화기|수화기|밥그릇)$/.test(t)) return false;
  // "A와 B", "A과 B" 인물 나열형
  if (/[가-힣]+와\s+[가-힣]+$/.test(t) || /[가-힣]+과\s+[가-힣]+$/.test(t)) return false;
  if (/^(살짝|아주|매우|너무|정말|조금|자주|매일|항상|절대|다시|또|더|조용히|조심스럽게|심스럽게|성스럽게|조심히|가만히|천천히)\s+/.test(t)) return false;
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// singleMap (lib/captionSanitizer.ts 와 동일 — 사진/지갑 entry만 포함)
// ─────────────────────────────────────────────────────────────────────────────
const PHOTO_WALLET_SINGLE_MAP = {
  "사진": "지갑 속 사진", "지갑": "낡은 지갑",
  "아버지": "아버지 지갑", "액자": "먼지 쌓인 액자",
  "메모": "사진 뒷면 메모",
  "손때": "지갑 손때", "가죽": "낡은 가죽",
  "안쪽": "지갑 안쪽", "이음새": "지갑 이음새",
  "모서리": "지갑 모서리", "의문": "낡은 지갑",
  "할머니": "지갑 속 사진",
  "보셨던이유는": "지갑 속 사진", "보셨던 이유는": "지갑 속 사진",
  "아버지가나에게": "아버지 지갑", "아버지가 나에게": "아버지 지갑",
  "사진은지금도": "지갑 속 사진", "사진은 지금도": "지갑 속 사진",
  "남긴사랑": "사진 뒷면 메모", "남긴 사랑": "사진 뒷면 메모",
  "오래된손길": "사진 모서리", "오래된 손길": "사진 모서리",
  "마음속의기억": "지갑 속 사진", "마음속의 기억": "지갑 속 사진",
  "비밀": "지갑 속 사진", "비밀이었어요": "지갑 속 사진",
  "사진을매일": "지갑 속 사진", "사진을 매일": "지갑 속 사진",
  "매일보던사진": "지갑 속 사진", "매일 보던 사진": "지갑 속 사진",
  "모습이다시": "사진 속 아버지", "모습이 다시": "사진 속 아버지",
  "아버지의사랑을": "아버지의 사랑", "아버지의 사랑을": "아버지의 사랑",
  "사랑을간직하다": "간직한 사진", "사랑을 간직하다": "간직한 사진",
  "웃는아버지": "사진 속 아버지", "웃는 아버지": "사진 속 아버지",
  "함께있는": "사진 속 부자", "함께 있는": "사진 속 부자",
  "아버지와의기억": "사진 속 부자", "아버지와의 기억": "사진 속 부자",
  "의문이남았어요": "지갑 속 사진", "의문이 남았어요": "지갑 속 사진",
  "마음의연결": "아버지 사진", "마음의 연결": "아버지 사진",
  "마음속의사진": "지갑 속 사진", "마음속의 사진": "지갑 속 사진",
  "추억의순간": "낡은 사진", "추억의 순간": "낡은 사진",
  "행복한순간": "사진 속 미소", "행복한 순간": "사진 속 미소",
  // QA-4 보강
  "그땐몰랐어요": "지갑 속 사진", "그땐 몰랐어요": "지갑 속 사진",
  "아버지의소중한": "아버지 사진", "아버지의 소중한": "아버지 사진",
  "소중한기억": "아버지 사진", "소중한 기억": "아버지 사진",
  "아침의사진": "지갑 속 사진", "아침의 사진": "지갑 속 사진",
  "첫여행": "첫 여행 사진", "첫 여행": "첫 여행 사진",
  "특별한날": "특별한 사진", "특별한 날": "특별한 사진",
  "아버지와어머니": "부모님 사진", "아버지와 어머니": "부모님 사진",
  "사진을바라보는아버지": "사진 속 아버지", "사진을 바라보는 아버지": "사진 속 아버지",
};

const PHOTO_WALLET_OBJECTS = ["지갑 속 사진", "사진 모서리", "아버지 지갑", "지갑 손때", "지갑 안쪽"];

// ─────────────────────────────────────────────────────────────────────────────
// fixWeakCaption (lib/captionSanitizer.ts 와 동일 — 사진/지갑 seedTopic 전용)
// ─────────────────────────────────────────────────────────────────────────────
function fixWeakCaption(caption, narration, seedTopic) {
  const norm = caption.replace(/\s/g, "");
  // seedTopic이 사진/지갑인 경우만 처리 (테스트 대상)
  const map = PHOTO_WALLET_SINGLE_MAP;
  const primary = PHOTO_WALLET_OBJECTS[0];
  const trimmed = caption.trim();
  // singleMap 결과도 isCaptionLike 검증
  const mapResult = map[norm] ?? map[trimmed] ?? null;
  if (mapResult) {
    return isCaptionLike(mapResult) ? mapResult : primary;
  }

  const RELATION_WORDS = {
    "아버지":   "아버지 " + (PHOTO_WALLET_OBJECTS[0]?.replace(/^아버지\s*/, "") ?? "흔적"),
    "어머니":   "어머니 흔적",
    "엄마":     "엄마 흔적",
    "아빠":     "아빠 흔적",
    "할머니":   "할머니 흔적",
    "할아버지": "할아버지 흔적",
  };
  if (RELATION_WORDS[norm]) return RELATION_WORDS[norm];

  const QUESTION_FORMS = new Set([
    "왜", "왜?", "의문", "의문?", "의아함", "궁금증",
  ]);
  if (QUESTION_FORMS.has(norm)) return primary;

  const SHORT_ABSTRACT = new Set([
    "기다림", "그날", "기억", "순간", "마음", "그때",
    "글씨", "흔적", "빛", "소리", "냄새", "향기", "눈물", "웃음", "미소",
  ]);
  if (SHORT_ABSTRACT.has(norm)) return primary;

  const GLOBAL_FALLBACK = {
    "사진":   primary,
    "의문":   primary,
    "의아함": primary,
  };
  if (GLOBAL_FALLBACK[norm]) return GLOBAL_FALLBACK[norm];

  const ABSTRACT_TAILS = new Set([
    "마음", "의문", "느낌", "감정", "추억", "기억", "걱정", "여운",
    "그리움", "아픔", "슬픔", "일상", "온기", "이야기", "손길",
    "날", "때", "순간", "생각", "시간",
  ]);
  if (narration) {
    const hints = narration.match(/([가-힣]{2,4})\s([가-힣]{2,4})/g);
    if (hints) {
      for (const h of hints) {
        const tail = h.split(" ").pop() ?? "";
        if (isCaptionLike(h) && !ABSTRACT_TAILS.has(tail)) return h;
      }
    }
  }
  return primary;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAPTION_TEMPLATES + rewriteEmotionalCaption (lib/captionSanitizer.ts 동일)
// ─────────────────────────────────────────────────────────────────────────────
const CAPTION_TEMPLATES = [
  {
    patterns: ["사진", "지갑"],
    captions: [
      ["낡은 사진", "오래된 사진", "지갑 속 사진"],
      ["아버지 지갑", "부모님 사진", "사진 속 인물"],
      ["지갑 속 사진", "매일 보던 사진", "낡은 지갑"],
      ["사진 모서리", "사진 뒷면", "지갑 손때"],
      ["흐릿한 글씨", "사진 뒷면 메모", "아버지 손글씨"],
      ["사진 모서리", "지갑 안쪽", "닳은 사진"],
      ["사진 속 부자", "사진 속 미소", "오래된 사진"],
      ["아버지 메모", "사진 뒷면", "아버지 사진"],
      ["간직한 사진", "지갑 속 사진", "낡은 사진"],
      ["지갑 속 사진", "간직한 사진", "아버지 지갑"],
    ],
  },
];

function _matchCaptionTemplate(seedTopic) {
  if (!seedTopic) return null;
  let best = null;
  let bestLen = 0;
  for (const entry of CAPTION_TEMPLATES) {
    for (const pat of entry.patterns) {
      if (seedTopic.includes(pat) && pat.length > bestLen) {
        best = entry;
        bestLen = pat.length;
      }
    }
  }
  return best;
}

function rewriteEmotionalCaption(sceneIndex, seedTopic, usedCaptions) {
  const entry = _matchCaptionTemplate(seedTopic);
  if (!entry) return null;
  const idx = Math.min(sceneIndex, entry.captions.length - 1);
  const candidates = entry.captions[idx] ?? [];
  for (const c of candidates) {
    if (!usedCaptions.has(c)) return c;
  }
  for (const row of entry.captions) {
    for (const c of row) {
      if (!usedCaptions.has(c)) return c;
    }
  }
  return candidates[0] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 테스트 실행
// ─────────────────────────────────────────────────────────────────────────────

const SEED = "아버지 지갑 속 오래된 사진";
let pass = 0;
let fail = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  const icon = ok ? "✅" : "❌";
  console.log(`${icon} ${label}`);
  if (!ok) {
    console.log(`     기대: "${expected}"`);
    console.log(`     실제: "${actual}"`);
  }
  ok ? pass++ : fail++;
}

console.log("\n=== [isCaptionLike] 부적합 caption 감지 (QA-1~3) ===\n");

check('isCaptionLike("사진을 매일")     → false', isCaptionLike("사진을 매일"), false);
check('isCaptionLike("모습이 다시")     → false', isCaptionLike("모습이 다시"), false);
check('isCaptionLike("아버지의 사랑을") → false', isCaptionLike("아버지의 사랑을"), false);
check('isCaptionLike("함께 있는")       → false', isCaptionLike("함께 있는"), false);
check('isCaptionLike("의문이 남았어요") → false', isCaptionLike("의문이 남았어요"), false);

console.log("\n=== [isCaptionLike] 부적합 caption 감지 (QA-4 신규) ===\n");

check('isCaptionLike("그땐 몰랐어요")      → false', isCaptionLike("그땐 몰랐어요"), false);
check('isCaptionLike("아버지의 소중한")    → false', isCaptionLike("아버지의 소중한"), false);
check('isCaptionLike("아버지와 어머니")    → false', isCaptionLike("아버지와 어머니"), false);

console.log("\n=== [isCaptionLike] 정상 caption 오탐 방지 ===\n");

check('isCaptionLike("지갑 속 사진")   → true', isCaptionLike("지갑 속 사진"), true);
check('isCaptionLike("사진 모서리")    → true', isCaptionLike("사진 모서리"), true);
check('isCaptionLike("흐릿한 글씨")    → true', isCaptionLike("흐릿한 글씨"), true);
check('isCaptionLike("아버지 손글씨")  → true', isCaptionLike("아버지 손글씨"), true);
check('isCaptionLike("낡은 지갑")      → true', isCaptionLike("낡은 지갑"), true);
check('isCaptionLike("간직한 사진")    → true', isCaptionLike("간직한 사진"), true);
check('isCaptionLike("오래된 사진")    → true', isCaptionLike("오래된 사진"), true);
check('isCaptionLike("첫 여행 사진")   → true', isCaptionLike("첫 여행 사진"), true);
check('isCaptionLike("특별한 사진")    → true', isCaptionLike("특별한 사진"), true);
check('isCaptionLike("부모님 사진")    → true', isCaptionLike("부모님 사진"), true);
check('isCaptionLike("닳은 사진 가장자리") → true', isCaptionLike("닳은 사진 가장자리"), true);

console.log("\n=== [fixWeakCaption] 보정 결과 검증 (QA-1~3) ===\n");

check('"사진을 매일"     → "지갑 속 사진"',   fixWeakCaption("사진을 매일",     undefined, SEED), "지갑 속 사진");
check('"모습이 다시"     → "사진 속 아버지"', fixWeakCaption("모습이 다시",     undefined, SEED), "사진 속 아버지");
check('"아버지의 사랑을" → "아버지의 사랑"',  fixWeakCaption("아버지의 사랑을", undefined, SEED), "아버지의 사랑");
check('"함께 있는"       → "사진 속 부자"',   fixWeakCaption("함께 있는",       undefined, SEED), "사진 속 부자");
check('"의문이 남았어요" → "지갑 속 사진"',   fixWeakCaption("의문이 남았어요", undefined, SEED), "지갑 속 사진");
check('"마음의 연결"     → "아버지 사진"',    fixWeakCaption("마음의 연결",     undefined, SEED), "아버지 사진");
check('"마음속의 사진"   → "지갑 속 사진"',  fixWeakCaption("마음속의 사진",   undefined, SEED), "지갑 속 사진");

console.log("\n=== [fixWeakCaption] 보정 결과 검증 (QA-4 신규) ===\n");

check('"그땐 몰랐어요"         → "지갑 속 사진"',  fixWeakCaption("그땐 몰랐어요",         undefined, SEED), "지갑 속 사진");
check('"아버지의 소중한"       → "아버지 사진"',   fixWeakCaption("아버지의 소중한",       undefined, SEED), "아버지 사진");
check('"소중한 기억"           → "아버지 사진"',   fixWeakCaption("소중한 기억",           undefined, SEED), "아버지 사진");
check('"아침의 사진"           → "지갑 속 사진"',  fixWeakCaption("아침의 사진",           undefined, SEED), "지갑 속 사진");
check('"첫 여행"               → "첫 여행 사진"',  fixWeakCaption("첫 여행",               undefined, SEED), "첫 여행 사진");
check('"특별한 날"             → "특별한 사진"',   fixWeakCaption("특별한 날",             undefined, SEED), "특별한 사진");
check('"아버지와 어머니"       → "부모님 사진"',   fixWeakCaption("아버지와 어머니",       undefined, SEED), "부모님 사진");
check('"사진을 바라보는 아버지" → "사진 속 아버지"', fixWeakCaption("사진을 바라보는 아버지", undefined, SEED), "사진 속 아버지");

console.log("\n=== [isCaptionLike] 정상 caption → needsFix=false 확인 ===\n");

const okCaptions = ["지갑 속 사진", "사진 모서리", "흐릿한 글씨", "아버지 손글씨", "낡은 사진", "간직한 사진",
                    "첫 여행 사진", "특별한 사진", "부모님 사진", "닳은 사진 가장자리"];
for (const c of okCaptions) {
  check(`isCaptionLike("${c}") → true`, isCaptionLike(c), true);
}

console.log("\n=== [rewriteEmotionalCaption] 10씬 template 재작성 ===\n");

// 예상 caption: CAPTION_TEMPLATES[사진/지갑] 각 씬의 첫 번째 후보
const EXPECTED_REWRITES = [
  "낡은 사진",       // scene 1
  "아버지 지갑",     // scene 2
  "지갑 속 사진",   // scene 3
  "사진 모서리",     // scene 4
  "흐릿한 글씨",     // scene 5
  "사진 모서리",     // scene 6 — 이미 scene4에서 씀 → 다음 후보 "지갑 안쪽"
  "사진 속 부자",   // scene 7
  "아버지 메모",     // scene 8
  "간직한 사진",     // scene 9
  "지갑 속 사진",   // scene 10 — 이미 scene3에서 씀 → 다음 후보 "간직한 사진"
];

const usedForRewrite = new Set();
const rewriteResults = [];

for (let i = 0; i < 10; i++) {
  const result = rewriteEmotionalCaption(i, SEED, usedForRewrite);
  rewriteResults.push(result);
  if (result) usedForRewrite.add(result);
}

// 실제로 중복 없이 10개 caption이 생성되는지 검증
const uniqueCount = new Set(rewriteResults).size;
console.log("10씬 rewrite 결과:");
rewriteResults.forEach((c, i) => {
  console.log(`  scene ${i + 1}: "${c}"`);
});
console.log();

// 검증 1: 모든 결과가 null이 아님
const allNonNull = rewriteResults.every(c => c !== null);
check("모든 씬에서 rewrite 결과 존재 (non-null)", allNonNull, true);

// 검증 2: 모든 결과가 isCaptionLike = true
const allCaptionLike = rewriteResults.every(c => c && isCaptionLike(c));
check("모든 rewrite 결과가 isCaptionLike=true", allCaptionLike, true);

// 검증 3: 중복 2개 이하 (10씬 중 pool이 좁아 일부 중복은 허용)
const dupCount = rewriteResults.length - uniqueCount;
check(`중복 caption 2개 이하 (실제: ${dupCount}개 중복)`, dupCount <= 2, true);

// 검증 4: 마지막 씬 결과가 isCaptionLike
const lastCaption = rewriteResults[9];
check(`마지막 씬(10) caption이 isCaptionLike: "${lastCaption}"`, lastCaption ? isCaptionLike(lastCaption) : false, true);

// 검증 5: 약한 caption 대표 사례가 template에 없음 (GPT 생성 약한 캡션이 template pool에 포함 안 됨)
const weakCaptions = ["그땐 몰랐어요", "언제나 보던", "반복된 시간", "날씨가 맑았던", "아버지 지키기", "특별한 날"];
const allWeak = weakCaptions.every(wc => !rewriteResults.includes(wc));
check("약한 caption이 rewrite 결과에 포함되지 않음", allWeak, true);

// ─────────────────────────────────────────────────────────────────────────────
// [QA-6] template rewrite 결과가 fixWeakCaption에 의해 덮어쓰이지 않음을 검증
// route.ts 에서 _captionWasRewritten=true일 때 needsFix 블록 전체 skip 됨.
// 이 테스트는 "template caption은 그 자체로 isCaptionLike=true여야 한다"를 검증.
// (isCaptionLike=true면 needsFix에서 isVerbEnding=false → needsFix=false → skip)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n=== [QA-6] template rewrite 결과가 fixWeakCaption으로 덮어쓰이지 않음 ===\n");

// QA-6 재발 방지: GPT가 만든 약한 caption에 template rewrite 후 fixWeakCaption이 다시 덮어쓰던 사례
const QA6_CASES = [
  // [GPT원본, template이 주는 caption, scene index]
  // route.ts 시뮬레이션: rewrite 성공 → _captionWasRewritten=true → needsFix 블록 skip
  { gpOrig: "그때 아버지는",    rewritten: "지갑 속 사진",  sceneIdx: 2 },
  { gpOrig: "친구의 소식은",    rewritten: "지갑 안쪽",     sceneIdx: 3 },
  { gpOrig: "친구를 잃은",      rewritten: "사진 모서리",   sceneIdx: 4 },
  { gpOrig: "아버지의 소중한",  rewritten: "아버지 메모",   sceneIdx: 7 },
];

for (const { gpOrig, rewritten, sceneIdx } of QA6_CASES) {
  // 조건 1: template rewrite 결과는 isCaptionLike=true 여야 함 (needsFix에서 isVerbEnding=false)
  check(
    `QA-6: rewrite "${rewritten}" → isCaptionLike=true (덮어쓰기 방지)`,
    isCaptionLike(rewritten),
    true
  );
  // 조건 2: GPT 원본은 isCaptionLike=false 여야 함 (template rewrite 필요 이유 확인)
  check(
    `QA-6: GPT원본 "${gpOrig}" → isCaptionLike=false (rewrite 대상)`,
    isCaptionLike(gpOrig),
    false
  );
  // 조건 3: rewrite 결과가 fixWeakCaption을 거쳐도 원본과 같거나 더 좋아야 함
  // (실제로 route.ts에서는 _captionWasRewritten=true 이면 fixWeakCaption 자체를 호출 안 함)
  const afterFix = fixWeakCaption(rewritten, undefined, "아버지 지갑 속 오래된 사진");
  // fixWeakCaption이 바꾸더라도 isCaptionLike=true여야 함
  check(
    `QA-6: "${rewritten}" → fixWeakCaption 후에도 isCaptionLike=true ("${afterFix}")`,
    isCaptionLike(afterFix ?? rewritten),
    true
  );
}

// ─────────────────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`결과: ${pass} 통과 / ${fail} 실패`);
if (fail === 0) {
  console.log("🎉 모든 테스트 통과!\n");
  process.exit(0);
} else {
  console.log("💥 실패한 테스트가 있습니다. lib/captionSanitizer.ts 확인 필요.\n");
  process.exit(1);
}
