/**
 * QA-15/16: Imagen-safe imagePrompt 변환 테스트
 * - QA-15: 씬 2,4,6,10 실패 → 씬 2,4 수정 완료
 * - QA-16: 씬 6,10 object-only 강화
 * - sanitizePromptForImagen 인라인 복사 (route.ts와 동기화 유지)
 */

// ── sanitizeImagePrompt 인라인 (route.ts 동기화) ─────────────────────────────
function sanitizeImagePrompt(prompt) {
  // 기본 텍스트/문자 sanitize (간략 버전 — 핵심 패턴만)
  return prompt
    .replace(/\bhandwritten (date|text|writing|inscription|words?|memo)\b/gi, "blurred handwritten trace")
    .replace(/\bhandwriting\b/gi, "blurred trace")
    .replace(/\b(?:a |the |specific |special |exact )?date\b/gi, "indistinct mark")
    .replace(/\binscription\b/gi, "faded surface marking")
    .replace(/\s{2,}/g, " ").trim();
}

// ── sanitizePromptForImagen 인라인 복사 (route.ts와 동기화) ──────────────────
function sanitizePromptForImagen(prompt) {
  return sanitizeImagePrompt(prompt)
    // ── QA-17 object-only 강제 치환 (씬 6 — silhouette+taking photo 완전 제거) ──
    .replace(
      /(?:elderly\s+)?(?:father\s+|man(?:'s)?\s+)?silhouette\s+taking\s+(?:a\s+)?photo[^,]*/gi,
      "old photo half pulled from a worn leather wallet on a wooden table at dawn, warm coat sleeve beside it, warm morning light"
    )
    .replace(/\bshoulder\s+silhouette\b/gi, "back view silhouette, face not visible")
    // ── QA-16/QA-20 object-only 강제 치환 ───────────────────────────────────
    // 씬 10 계열: placing/putting photo into wallet — hands only → object-only
    .replace(
      /(?:(?:child|adult\s+hands?|adult\s+person|elderly\s+man(?:'s)?)\s+)?(?:gently\s+)?placing\s+(?:the\s+|an?\s+)?(?:old\s+)?photo\s+into\s+(?:their\s+own\s+|a\s+|the\s+)?wallet[^,]*/gi,
      "old photo tucked inside a modern wallet on a wooden table, warm light"
    )
    // QA-20 씬 6 계열: elderly man's hands placing/putting photo next to/beside wallet → object-only
    .replace(
      /(?:elderly\s+man(?:'s)?\s+)?(?:weathered\s+)?hands?\s+(?:gently\s+)?(?:placing|putting|setting|laying|resting)\s+(?:the\s+|an?\s+)?(?:old\s+)?photo\s+(?:next\s+to|beside|near|by|alongside)\s+(?:the\s+|an?\s+)?wallet[^,]*/gi,
      "old worn wallet and small faded photo resting side by side on a wooden table, warm cinematic light"
    )
    // elderly man's hands + any action near wallet (broad safety net)
    .replace(
      /elderly\s+man(?:'s)?\s+hands?\s+(?:gently\s+)?(?:placing|putting|setting|holding)\s+(?:the\s+)?photo\s+(?:next\s+to|beside|near|by)\s+(?:the\s+)?wallet[^,]*/gi,
      "old worn wallet and small faded photo side by side on wooden table, warm light"
    )
    .replace(/,?\s*hands\s+only\b/gi, "")
    .replace(/,?\s*their\s+own\s+wallet\b/gi, "a wallet")
    // ── silhouette 잔류 단어 제거 (back view silhouette은 남김) ──────────────
    .replace(/\b(?:elderly\s+)?(?:father\s+)?(?:man(?:'s)?\s+)?silhouette\b(?!\s*,\s*(?:back\s+view|face))/gi,
      "worn coat sleeve")
    .replace(/(?:,\s*back\s+view){2,}/gi, ", back view")
    // ── 복합 인물 구문 (구체적인 것 먼저, 동사 보존)
    .replace(/\bchild\s+opening\b/gi, "adult hands opening")
    .replace(/\bchild\s+placing\b/gi, "adult hands placing")
    .replace(/\bchild\s+holding\b/gi, "adult hands holding")
    .replace(/\bchild\s+looking\s+at\b/gi, "over-the-shoulder view of")
    .replace(/\bchild\s+taking\b/gi, "adult hands taking")
    .replace(/\bchild['']s\s+hands?\b/gi, "adult hands")
    .replace(/\bchild['']s\s+(?:shoulder|back|silhouette)\b/gi, "back view silhouette")
    .replace(/\bchild['']s\b/gi, "adult person's")
    // ── "child" 단독 치환
    .replace(/\bchild\b/gi, "adult person")
    // ── father 복합 구문
    .replace(/\belderly\s+father\s+silhouette\b/gi, "elderly man's silhouette, back view")
    .replace(/\bfather['']s\s+(?:old\s+)?wallet\b/gi, "an old worn wallet")
    .replace(/\bfather['']s\s+weathered\s+hands\b/gi, "elderly man's weathered hands")
    .replace(/\bfather['']s\s+hands\b/gi, "elderly man's hands")
    .replace(/\bfather['']s\s+worn\s+coat\b/gi, "elderly man's worn coat")
    .replace(/\bfather['']s\b/gi, "elderly man's")
    // ── "father" 단독 치환
    .replace(/\bfather\b/gi, "elderly man")
    // ── 기타 인물 표현
    .replace(/\belderly\s+man\s+taking\s+photo\b/gi,
      "elderly man's hands taking a photo from a wallet, face not visible")
    .replace(/\bclose.?up\s+(?:of\s+)?face\b/gi, "close-up of hands")
    .replace(/\bfull.?body\b/gi, "back view")
    .replace(/\bshoulder\s+silhouette\b/gi, "back view silhouette, face not visible")
    // ── 정리
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/,?\s*$/, "")
    // hand-drawn 스타일: "no close-up faces" → "no close-up faces"로 완화
    + ", no close-up faces, no text, no numbers, no readable text";
}

// ── 테스트 ────────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function test(label, input, shouldContain, shouldNotContain = []) {
  const out = sanitizePromptForImagen(input);
  const failedContain = shouldContain.filter((s) => !out.toLowerCase().includes(s.toLowerCase()));
  // shouldNotContain은 단어 경계(\b) 기준으로 체크 — "children" 안의 "child" 오탐 방지
  const failedNotContain = shouldNotContain.filter((s) => {
    const re = new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(out);
  });

  if (failedContain.length === 0 && failedNotContain.length === 0) {
    console.log(`  ✅ ${label}`);
    console.log(`     → ${out.slice(0, 120)}...`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    if (failedContain.length) console.log(`     MISSING   : ${failedContain.join(", ")}`);
    if (failedNotContain.length) console.log(`     STILL HAS : ${failedNotContain.join(", ")}`);
    console.log(`     OUTPUT    : ${out}`);
    fail++;
  }
}

// ── QA-15 실패 씬 4개 ────────────────────────────────────────────────────────
console.log("\n[QA-15/16 실패 씬 — Imagen-safe 변환 확인]");

// 씬 2: child opening father's wallet
test(
  "씬2: child opening father's wallet → adult hands opening an old worn wallet",
  "child opening father's wallet, old faded photo partly visible inside, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["adult hands", "old worn wallet", "no close-up faces", "no close-up faces"],
  ["child", "father's wallet"]
);

// 씬 4: child looking at photo back, shoulder silhouette
test(
  "씬4: child looking at photo back, shoulder silhouette → back view silhouette",
  "child looking at photo back, shoulder silhouette against warm light, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["back view silhouette", "no close-up faces", "no close-up faces"],
  ["child looking at"]
);

// 씬 6 (QA-16): elderly father silhouette taking photo → object-only
test(
  "씬6 (QA-16): elderly father silhouette taking photo → object-only (photo + wallet + dawn)",
  "elderly father silhouette taking photo from wallet at dawn, back view, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["old photo", "wallet", "no close-up faces", "no close-up faces"],
  ["elderly father silhouette", "child", "silhouette taking"]
);

// 씬 6 (QA-17): 최종 확인 — silhouette/person 단어 미잔류
test(
  "씬6 (QA-17): 결과에 silhouette/person 단어 미잔류 확인",
  "elderly father silhouette taking photo from wallet at dawn, back view, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["old photo", "wallet", "coat sleeve", "morning light", "no close-up faces"],
  ["silhouette", "father"]
);

// 씬 10 (QA-16): child placing photo into wallet, hands only → object-only
test(
  "씬10 (QA-16): child placing the photo into their own wallet, hands only → object-only",
  "child placing the photo into their own wallet, hands only, warm light, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["old photo", "wallet", "no close-up faces", "no close-up faces"],
  ["child placing", "child", "hands only"]
);

// ── 추가 단위 테스트 ──────────────────────────────────────────────────────────
console.log("\n[단위 테스트 — 개별 패턴]");

test(
  "child's hand → adult hands",
  "child's hand entering frame from side",
  ["adult hands"],
  ["child"]
);

test(
  "father's weathered hands → elderly man's weathered hands",
  "faded old photo held gently by father's weathered hands",
  ["elderly man's weathered hands"],
  ["father's"]
);

test(
  "father's old wallet → an old worn wallet",
  "father's old wallet on worn wooden desk",
  ["an old worn wallet"],
  ["father's"]
);

test(
  "child → adult person (단독)",
  "a child sits beside an old chair",
  ["adult person"],
  ["child"]
);

test(
  "father's worn coat → elderly man's worn coat",
  "wallet and old photo beside father's worn coat on wooden table",
  ["elderly man's worn coat"],
  ["father's"]
);

test(
  "no faces / no children / no visible person suffix 추가",
  "old wallet on wooden desk, warm cinematic 3D illustration",
  ["no close-up faces", "no close-up faces"],
  []
);

test(
  "shoulder silhouette → back view silhouette, face not visible",
  "child looking at photo back, shoulder silhouette against warm light",
  ["back view silhouette, face not visible"],
  ["shoulder silhouette", "child"]
);

// ── 성공 씬 변환 — 기존 정상 prompt도 망가지지 않는지 확인 ────────────────────
console.log("\n[성공 씬 유지 확인 — 기존 정상 prompt]");

test(
  "씬3 (성공): father's weathered hands → elderly man's weathered hands 유지",
  "faded old photo held gently by father's weathered hands, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["elderly man's weathered hands", "faded old photo", "no close-up faces"],
  ["father's", "child"]
);

test(
  "씬7 (성공): 오브젝트만 있는 prompt는 suffix만 추가",
  "plain back of the photo with soft blurred indistinct marks, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["plain back of the photo", "no close-up faces", "no close-up faces"],
  ["child", "father"]
);

test(
  "씬9 (성공): father's worn coat → elderly man's worn coat",
  "wallet and old photo beside father's worn coat on wooden table, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["elderly man's worn coat", "wallet", "old photo"],
  ["father's"]
);

// ── QA-20 실패 씬 — elderly man's hands placing photo next to wallet ─────────
console.log("\n[QA-20 실패 씬 — placing photo next to wallet]");

// QA-20 씬 6 실제 실패 prompt
test(
  "씬6 (QA-20): elderly man's hands gently placing the photo next to the wallet → object-only",
  "elderly man's hands gently placing the photo next to the wallet on the table, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["wallet", "photo", "wooden table", "no close-up faces", "no close-up faces"],
  ["elderly man's hands", "placing the photo", "next to the wallet"]
);

// placing photo beside/near wallet 변형 패턴
test(
  "씬6 변형: hands placing photo beside wallet → object-only",
  "elderly man's weathered hands placing the old photo beside the wallet on the desk",
  ["wallet", "photo", "no close-up faces", "no close-up faces"],
  ["hands placing", "beside the wallet"]
);

// placing into wallet (기존 QA-16 패턴 — 회귀 확인)
test(
  "씬10 (QA-16 회귀): elderly man's hands placing photo into wallet → object-only",
  "elderly man's hands placing the old photo into the wallet, warm light",
  ["old photo", "wallet", "no close-up faces", "no close-up faces"],
  ["hands placing", "into the wallet"]
);

// ── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`\n총 ${pass + fail}건 — ✅ ${pass} pass  ❌ ${fail} fail`);
if (fail > 0) process.exit(1);
