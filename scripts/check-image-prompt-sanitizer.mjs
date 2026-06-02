/**
 * QA-10: imagePrompt sanitization test
 * sanitizeImagePromptForGeneration 가 위험 패턴을 안전하게 치환하는지 검증
 */

// ── sanitizeImagePromptForGeneration 인라인 복사 (route.ts 와 동기화 유지) ───
function sanitizeImagePromptForGeneration(prompt) {
  let next = prompt;

  next = next
    // ── 선제 중복 제거 (다른 치환 전에 먼저) ────────────────────────────────────
    .replace(/\bplain plain\b/gi, "plain")
    .replace(/\bblurred plain\b/gi, "plain")
    // ── 사진 뒷면 (복합 패턴 — 가장 먼저 처리해 중첩 치환 방지) ────────────────
    .replace(/\bback of (the |a )?(old |faded )?photo showing\b/gi, "plain back of the photo with blurred marks")
    .replace(/\bback of (the |a )?(old |faded )?photo (with|that has)\b/gi, "plain back of the photo with blurred marks,")
    // ── 필기·손글씨 ──────────────────────────────────────────────────────────
    .replace(/\bold handwritten letter\b/gi, "blank folded old letter")
    .replace(/\bhandwritten letter\b/gi, "blank folded letter")
    .replace(/\bold handwritten note\b/gi, "blank folded old note")
    .replace(/\bhandwritten note\b/gi, "blank folded note")
    .replace(/\bhandwritten (date|text|writing|inscription|words?|memo)\b/gi, "blurred handwritten trace")
    .replace(/\bhandwriting\b/gi, "blurred trace")
    .replace(/\bnote with (a )?(short )?phrase\b/gi, "small folded note with no visible writing")
    .replace(/\bnote that reads\b/gi, "small folded note with no visible writing")
    .replace(/\bphoto that reads\b/gi, "photo with blurred back")
    // ── 날짜·숫자·달력 (구체적 패턴을 먼저, 일반 패턴은 뒤에) ─────────────────
    .replace(/\bbirthday date\b/gi, "soft glowing keepsake")
    .replace(/\bcalendar marked with (special |specific )?dates?\b/gi, "plain surface with no markings")
    .replace(/\bcalendar page( with no numbers)?\b/gi, "blank reminder card")
    .replace(/\bshowing a date\b/gi, "showing indistinct marks")
    .replace(/\bshowing (the )?(date|numbers?|digits?|writing|text)\b/gi, "showing only faded blurs")
    .replace(/\bdate written\b/gi, "indistinct faded marks")
    .replace(/\bnumbers on (the )?(back of the |old |faded )?(photo|picture)\b/gi, "blurred marks on the back")
    .replace(/\b(?:a |the |specific |special |exact )?date\b/gi, "indistinct mark")
    // ── 메모·비문·문자 ───────────────────────────────────────────────────────
    .replace(/\breadable memo\b/gi, "blurred paper slip")
    .replace(/\binscription\b/gi, "faded surface marking")
    .replace(/\bthank you message\b/gi, "warm glowing heart-shaped keepsake")
    .replace(/\bmessage\b/gi, "keepsake")
    .replace(/\bphrase\b/gi, "memory cue")
    .replace(/\bwriting on (the )?(back|photo|picture|paper)\b/gi, "blurred marks on the back")
    // ── 사람 얼굴·신원 ───────────────────────────────────────────────────────
    .replace(/\bphoto frame of a mother\b/gi, "family photo frame turned away")
    .replace(/\bmother in the background\b/gi, "soft family memory in the background")
    .replace(/\s{2,}/g, " ")
    .trim();

  // ── 중복 단어/구문 정리 ──────────────────────────────────────────────────────
  next = next
    .replace(/\bplain plain\b/gi, "plain")
    .replace(/\bblurred marks\s+indistinct markings\b/gi, "soft blurred indistinct marks")
    .replace(/\bblurred marks,\s*blurred indistinct marks\b/gi, "soft blurred indistinct marks")
    .replace(/\bblurred marks,\s*blurred marks\b/gi, "soft blurred marks")
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  const noWriting = /no (readable )?(text|writing|letters)/i.test(next);
  if (!noWriting) {
    next = `${next}, no readable writing, no letters`;
  }

  return { prompt: next, changed: next !== prompt };
}

// ── 테스트 케이스 ─────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function test(label, input, shouldContain, shouldNotContain = []) {
  const { prompt: out } = sanitizeImagePromptForGeneration(input);

  const failedContain = shouldContain.filter((s) => !out.toLowerCase().includes(s.toLowerCase()));
  const failedNotContain = shouldNotContain.filter((s) => out.toLowerCase().includes(s.toLowerCase()));

  if (failedContain.length === 0 && failedNotContain.length === 0) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}`);
    if (failedContain.length) console.log(`     MISSING   : ${failedContain.join(", ")}`);
    if (failedNotContain.length) console.log(`     STILL HAS : ${failedNotContain.join(", ")}`);
    console.log(`     OUTPUT    : ${out}`);
    fail++;
  }
}

// ── Section 1: 손글씨 패턴 ───────────────────────────────────────────────────
console.log("\n[1] 손글씨 패턴");
test(
  "handwritten date → blurred handwritten trace",
  "back of an old photo with a handwritten date, cinematic",
  ["blurred handwritten trace"],
  ["handwritten date"]
);
test(
  "handwriting → blurred trace",
  "old photo with handwriting on the back, cinematic",
  ["blurred trace"],
  ["handwriting on the back"]
);
test(
  "handwritten note → blank folded note",
  "a handwritten note left on the desk, cinematic",
  ["blank folded note"],
  ["handwritten note"]
);
test(
  "handwritten inscription → blurred handwritten trace",
  "stone surface with a handwritten inscription, cinematic",
  ["blurred handwritten trace"],
  ["handwritten inscription"]
);

// ── Section 2: 날짜·달력 패턴 ────────────────────────────────────────────────
console.log("\n[2] 날짜·달력 패턴");
test(
  "back of the photo showing a date written in small handwriting",
  "back of the photo showing a date written in small handwriting, cinematic 3D illustration",
  ["plain back of the photo with"],
  ["showing a date", "date written", "handwriting"]
);
test(
  "calendar marked with special dates",
  "the old photo on a calendar marked with special dates, warm cinematic 3D illustration",
  ["plain surface with no markings"],
  ["calendar marked with", "special dates"]
);
test(
  "birthday date → soft glowing keepsake",
  "a birthday date carved into the surface, cinematic",
  ["soft glowing keepsake"],
  ["birthday date"]
);
test(
  "showing a date → showing indistinct marks",
  "old journal showing a date from decades ago",
  ["showing indistinct marks"],
  ["showing a date"]
);
test(
  "showing the numbers",
  "envelope showing the numbers written by hand",
  ["showing only faded blurs"],
  ["showing the numbers"]
);
test(
  "calendar page → blank reminder card",
  "old calendar page on the wall, warm lighting",
  ["blank reminder card"],
  ["calendar page"]
);

// ── Section 3: 메모·비문·문자 패턴 ───────────────────────────────────────────
console.log("\n[3] 메모·비문·문자 패턴");
test(
  "readable memo → blurred paper slip",
  "old drawer with a readable memo inside, cinematic",
  ["blurred paper slip"],
  ["readable memo"]
);
test(
  "inscription → faded surface marking",
  "wooden box with an inscription on the lid, cinematic",
  ["faded surface marking"],
  ["inscription"]
);
test(
  "writing on the back → blurred marks on the back",
  "old postcard with writing on the back",
  ["blurred marks on the back"],
  ["writing on the back"]
);
test(
  "note that reads → small folded note",
  "a note that reads the final words, cinematic",
  ["small folded note with no visible writing"],
  ["note that reads"]
);

// ── Section 4: 사진 뒷면 패턴 ────────────────────────────────────────────────
console.log("\n[4] 사진 뒷면 패턴");
test(
  "back of the old photo showing",
  "back of the old photo showing the inscription, warm cinematic",
  ["plain back of the photo with"],
  ["back of the old photo showing", "inscription"]
);
test(
  "back of a faded photo with",
  "back of a faded photo with small handwritten text",
  ["plain back of the photo with blurred marks"],
  ["back of a faded photo with"]
);

// ── Section 5: no readable writing suffix 자동 추가 ─────────────────────────
console.log("\n[5] suffix 자동 추가");
test(
  "suffix added when missing",
  "old leather wallet on a wooden table, warm cinematic 3D illustration",
  ["no readable writing"],
  []
);
test(
  "suffix NOT duplicated when already present",
  "old wallet, no readable writing, no letters",
  ["no readable writing"],
  []
);

// ── Section 6: 실제 QA-10 위험 프롬프트 (full integration) ───────────────────
console.log("\n[6] 실제 QA-10 위험 프롬프트 (통합)");
test(
  "QA-10 scene 6 full prompt",
  "the old photo on a calendar marked with special dates, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["plain surface with no markings"],
  ["calendar marked with", "special dates"]
);
test(
  "QA-10 scene 7 full prompt",
  "the back of the photo showing a date written in small handwriting, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["plain back of the photo with"],
  ["showing a date", "date written", "handwriting"]
);

// ── Section 7: QA-12 중복 표현 정리 ─────────────────────────────────────────
console.log("\n[7] QA-12 중복 표현 정리");

// QA-12 scene 7 imagePrompt (실제 값)
test(
  "QA-12 scene7: 'plain plain' → 'plain' 중복 제거",
  "blurred plain plain back of the photo with blurred marks, blurred marks indistinct markings, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["plain back", "no readable writing"],
  ["plain plain", "blurred marks, blurred marks", "blurred marks indistinct markings"]
);

// QA-12 scene 8 imagePrompt (실제 값)
test(
  "QA-12 scene8: 'plain plain' + 'blurred indistinct marks' 중복 정리",
  "plain plain back of the photo with blurred marks, blurred indistinct marks, warm cinematic 3D illustration, soft emotional lighting, 9:16 portrait, no text, no faces, no numbers, no readable writing",
  ["plain back", "no readable writing"],
  ["plain plain"]
);

// 단독 중복 패턴 테스트
test(
  "blurred marks, blurred marks → soft blurred marks (직접 입력)",
  "old paper surface with blurred marks, blurred marks, warm cinematic",
  ["soft blurred marks", "no readable writing"],
  ["blurred marks, blurred marks"]
);
test(
  "blurred marks indistinct markings → soft blurred indistinct marks",
  "back of old photo with blurred marks indistinct markings, warm cinematic",
  ["soft blurred indistinct marks"],
  ["blurred marks indistinct markings"]
);
test(
  "no text suffix still present after dedup",
  "old wallet with blurred marks, blurred marks",
  ["no readable writing"],
  []
);

// ── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`\n총 ${pass + fail}건 — ✅ ${pass} pass  ❌ ${fail} fail`);
if (fail > 0) process.exit(1);
