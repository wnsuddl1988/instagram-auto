/**
 * _lh10-generate-plan.mjs
 * QA-LH-10 수건 냄새 반전 소재 story형 plan 생성 스크립트
 *
 * - OpenAI generate 1회 호출 (gpt-4o-mini)
 * - 렌더/TTS/Pexels/이미지 다운로드 없음
 * - 유료 플래그: 스크립트 내에서 임시 세팅 → 완료 후 즉시 원복
 *
 * 실행: pnpm node scripts/_lh10-generate-plan.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 환경변수 로드 (.env.local에서 OPENAI_API_KEY만 필요) ──────────────────────
function loadEnv(fp) {
  if (!existsSync(fp)) return;
  for (const line of readFileSync(fp, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(join(ROOT, ".env.local"));

// ── 유료 플래그 임시 활성화 ────────────────────────────────────────────────────
console.log("=== QA-LH-10 Plan 생성 스크립트 ===\n");
console.log("[FLAG] PAID_API_ENABLED=true (임시)");
console.log("[FLAG] ALLOW_OPENAI_GENERATE=true (임시)");
console.log("[FLAG] TTS/Imagen/Pexels/Pollinations → false (금지)\n");

process.env.PAID_API_ENABLED = "true";
process.env.ALLOW_OPENAI_GENERATE = "true";
process.env.ALLOW_OPENAI_TTS = "false";
process.env.ALLOW_IMAGEN = "false";
process.env.ALLOW_ELEVENLABS = "false";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  console.error("⛔ OPENAI_API_KEY 없음. .env.local 확인 필요.");
  process.exit(1);
}

// ── 출력 경로 설정 ─────────────────────────────────────────────────────────────
const OUT_DIR = join(ROOT, "output", "v2", "paid_qa");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const RESP_PATH    = join(OUT_DIR, "gpt4o_mini_life_hacks_qa_lh10_response.json");
const PLAN_PATH    = join(OUT_DIR, "gpt4o_mini_life_hacks_qa_lh10_plan.json");
const QUALITY_PATH = join(OUT_DIR, "gpt4o_mini_life_hacks_qa_lh10_quality.json");
const ATTEMPT_PATH = join(OUT_DIR, "gpt4o_mini_life_hacks_qa_lh10_attempts.json");

// ── OpenAI API 호출 헬퍼 ───────────────────────────────────────────────────────
async function callOpenAI(messages, model = "gpt-4o-mini") {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.85,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API 오류 ${res.status}: ${err}`);
  }
  return res.json();
}

// ── 프롬프트 구성 ──────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a Korean Instagram Reels scriptwriter. You MUST output valid JSON only — no markdown, no explanation.

Output format:
{
  "topTitle": "string (영상 제목, 20자 이내, 클릭 유도형)",
  "hook": "string (scene 1 narration, 16~28자)",
  "estimatedDuration": 45,
  "scenes": [
    {
      "sceneNumber": 1,
      "caption": "string (화면 자막, 10자 이내, 라벨형 아닌 궁금증/반전형)",
      "narration": "string (음성 내레이션, 16~28자)",
      "imagePrompt": "string (영어, Pexels 검색용 오브젝트 중심 묘사)",
      "fallbackSearchQuery": "string (영어, Pexels 검색어 2~4단어, 구체 오브젝트)",
      "motion": "string (alive|slow_zoom_in|slow_zoom_out|character_nod|character_pulse)",
      "duration": 5
    }
  ],
  "_meta": {
    "categoryId": "life-hacks-v2",
    "subTopicId": "laundry-clothing",
    "referenceStyle": "living_tips",
    "generatedAt": "2026-05-30"
  }
}`;

const styleGuide = `A practical Korean lifestyle tips reel — clean, informative, and actionable:
- Visual style: clean household object photography style. Real-life laundry / bathroom items. Clear focus on the tip object.
- imagePrompt style: "clean practical household object, soft studio lighting, minimal clean background, 9:16 portrait, no text, no logo, no people, clear object focus"
- Scene beat structure (STRICT):
  · Scene 1 (hook): Bold opening — "수건을 빨았는데도 냄새가 다시 올라오나요?" style [타깃형D hook]
  · Scenes 2~3 (mistake + hidden cause): Show the common wrong action (세제 더 넣기) then reveal the surprising root cause (세제 잔여물 + 습기 + 세균)
  · Scenes 4~6 (solution steps): Step-by-step fix. Each scene = one concrete action.
  · Scene 7 (result): Before/after — concrete measurable result after fix.
  · Scenes 8~9 (bonus/warning): Extra tip or rule. Must be information-dense, not generic.
  · Scene 10 (CTA): "저장해두면 유용해요" style closing. Motion MUST be slow_zoom_out.`;

const qualityBar = `Quality bar — LIVING TIPS rules (mandatory):

STORY STRUCTURE (anti-listicle):
- This is ONE mini problem-solving story arc, NOT a list of tips.
- Act 1 (scenes 1~3): "나도 이런 문제 겪었는데 → 원인이 이거였네" (공감 → 숨은 원인)
- Act 2 (scenes 4~6): "이렇게 바꾸면 해결되네" (행동 변화)
- Act 3 (scenes 7~9): "바꾸면 이렇게 달라짐 → 주의사항 → 한 줄 규칙" (결과 + 정리)
- CTA (scene 10): 행동 유도

HOOK rules:
- Scene 1 must use 반전형C or 타깃형D pattern:
  ✅ "수건을 빨았는데도 냄새가 다시 올라오나요?" [타깃형D]
  ✅ "수건 냄새, 세제 더 넣으면 더 심해집니다" [반전형C]
- Must trigger "혹시 나도 잘못하고 있나?" reaction

SCENE-SPECIFIC requirements:
- Scene 2: 구체 잘못된 행동 — "세제를 더 넣는다" 명시
- Scene 3: 숨은 원인 reveal — 세제 잔여물이 습기와 결합 → 세균 번식 설명
- Scenes 4~6: 해결 단계 (세제 줄이기 → 뜨거운 물/식초 세탁 → 완전 건조)
- Scene 7: 구체 결과 — "냄새 사라짐 + 수건 촉감 회복"
- Scene 8~9: 주의/보너스 — 건조기 온도, 세탁망, 헹굼 횟수 중 하나
- Scene 10: CTA + 핵심 키워드 (세제양 + 완전건조), motion=slow_zoom_out

NARRATION rules:
- scene 1 (hook): 16~28자
- scenes 2~10: 16~28자, 14자 미만 절대 금지
- 장황한 설명 금지, 한 문장 = 한 행동/원인/결과

CAPTION rules:
- 10자 이내
- 라벨형 명사 단독 금지: ❌ "세제" / ❌ "수건 냄새"
- 궁금증/반전/행동 유발: ✅ "더 심해져요" / ✅ "이게 원인" / ✅ "이렇게 하세요"

FALLBACK SEARCH QUERY rules (Pexels):
- 영어 2~4단어, 구체 오브젝트 중심
- ✅ "white towel pile", "laundry detergent bottle", "washing machine drum", "drying towel rack"
- ❌ "smell", "bacteria", "problem", "concept" — 추상어 금지
- ❌ "person washing", "woman folding" — 사람 중심 금지`;

const USER_PROMPT = `주제: "수건 냄새, 세제 더 넣으면 더 심해지는 이유"

카테고리: 생활꿀팁 (life-hacks-v2)
소주제: laundry-clothing
타입: living_tips
씬 수: 10씬 고정
예상 길이: 45초

핵심 스토리 구조:
- 문제: 빨아도 수건 냄새가 남음 (시청자 공감)
- 흔한 실수: 세제를 더 넣음 (대부분 이렇게 함)
- 숨은 원인: 세제 잔여물 + 습기 + 세균 번식 (반전 reveal)
- 해결: 세제 줄이기 → 뜨거운 물 or 식초 세탁 → 완전 건조
- 결과: 냄새 줄고 수건 촉감 회복
- CTA: "다음 세탁 전 세제 양부터 줄여보기"

${styleGuide}

${qualityBar}

10씬 구조로 story arc를 완성하세요. 각 씬은 이전 씬의 이해를 한 단계 진전시켜야 합니다.`;

// ── 플래그 원복 함수 (호이스팅을 위해 호출 전에 선언) ─────────────────────────
function resetFlags() {
  process.env.PAID_API_ENABLED = "false";
  process.env.ALLOW_OPENAI_GENERATE = "false";
  process.env.ALLOW_OPENAI_TTS = "false";
  process.env.ALLOW_IMAGEN = "false";
  process.env.ALLOW_ELEVENLABS = "false";
}

// ── generate 실행 ──────────────────────────────────────────────────────────────
console.log("[STEP 1] OpenAI generate-v2 호출 시작...");
console.log("         topic: 수건 냄새, 세제 더 넣으면 더 심해지는 이유");
console.log("         model: gpt-4o-mini\n");

const startTime = Date.now();
let rawResponse;

try {
  rawResponse = await callOpenAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: USER_PROMPT },
  ]);
} catch (err) {
  // 호출 실패 시 즉시 플래그 원복 후 종료
  console.error("⛔ OpenAI 호출 실패:", err.message);
  resetFlags();
  process.exit(1);
}

const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
console.log(`[STEP 1] ✅ 완료 (${elapsed}s)`);
console.log(`         usage: prompt=${rawResponse.usage?.prompt_tokens}, completion=${rawResponse.usage?.completion_tokens}, total=${rawResponse.usage?.total_tokens}\n`);

// ── 응답 파싱 ──────────────────────────────────────────────────────────────────
let plan;
try {
  const content = rawResponse.choices[0]?.message?.content ?? "{}";
  plan = JSON.parse(content);
} catch (err) {
  console.error("⛔ JSON 파싱 실패:", err.message);
  writeFileSync(RESP_PATH, JSON.stringify(rawResponse, null, 2), "utf8");
  resetFlags();
  process.exit(1);
}

// ── 유료 플래그 즉시 원복 ──────────────────────────────────────────────────────
resetFlags();
console.log("[FLAG] 유료 플래그 원복 완료 ✅");
console.log("       PAID_API_ENABLED=false");
console.log("       ALLOW_OPENAI_GENERATE=false\n");

// ── plan 품질 검증 ─────────────────────────────────────────────────────────────
console.log("[STEP 2] Plan 품질 검증 중...\n");

const scenes = plan.scenes ?? [];
const totalScenes = scenes.length;

// 기본 점수 계산
const warnings = [];
let score = 100;
const capReasons = [];
const breakdown = [];

// ① 씬 수 검증
if (totalScenes !== 10) {
  warnings.push({ severity: "warning", sceneNumber: 0, message: `씬 수 불일치: 10씬 필요, 실제 ${totalScenes}씬` });
  score = Math.min(score, totalScenes < 8 || totalScenes > 12 ? 59 : 79);
  capReasons.push(`(A) 씬 수 불일치: ${totalScenes}씬 → ${totalScenes < 8 || totalScenes > 12 ? "fail" : "review"} 상한`);
}
breakdown.push({ label: "씬 수 정확", earned: totalScenes === 10 ? 10 : 0, max: 10, pass: totalScenes === 10 });

// ② narration 길이 검증
let shortNarCount = 0;
scenes.forEach((s, i) => {
  const nar = s.narration ?? "";
  const len = nar.length;
  if (i > 0 && len < 14) {
    shortNarCount++;
    warnings.push({ severity: "warning", sceneNumber: i + 1, message: `narration 너무 짧음: ${len}자 "${nar}"` });
  } else if (i > 0 && len < 16) {
    warnings.push({ severity: "info", sceneNumber: i + 1, message: `narration 목표 미달: ${len}자 (권장 16자+) "${nar}"` });
  }
});
if (shortNarCount >= 3) {
  score = Math.min(score, 79);
  capReasons.push(`(M) narration 짧음 ${shortNarCount}건 → review 상한 79`);
}
breakdown.push({
  label: `narration 짧음 ${shortNarCount}건`,
  earned: shortNarCount === 0 ? 30 : shortNarCount === 1 ? 20 : shortNarCount === 2 ? 10 : 0,
  max: 30,
  pass: shortNarCount === 0,
});

// ③ scene 10 motion 검증
const scene10 = scenes[9];
const lastMotionOk = scene10?.motion === "slow_zoom_out";
if (!lastMotionOk) {
  warnings.push({ severity: "warning", sceneNumber: 10, message: `scene 10 motion="${scene10?.motion}" — slow_zoom_out 이어야 함` });
}
breakdown.push({ label: "마지막 씬 slow_zoom_out", earned: lastMotionOk ? 10 : 0, max: 10, pass: lastMotionOk });

// ④ 후반 정보 밀도 (scene 8~9)
const GENERIC_PATTERNS = /^(좋아요|저장|공유|팔로우|도움|감사|오늘도|잘 되셨나요|도움이 됐나요)/;
let lateSceneThinCount = 0;
[7, 8].forEach((idx) => {
  const s = scenes[idx];
  if (!s) return;
  const nar = s.narration ?? "";
  if (nar.length < 14 || GENERIC_PATTERNS.test(nar)) {
    lateSceneThinCount++;
    warnings.push({ severity: "warning", sceneNumber: idx + 1, message: `후반 씬 정보 밀도 부족: "${nar}"` });
  }
});
if (lateSceneThinCount >= 2) {
  score = Math.min(score, 79);
  capReasons.push(`(L) 후반 정보 밀도 부족 scene 8~9 generic ${lateSceneThinCount}건 → review 상한 79`);
}
breakdown.push({ label: "후반 정보 밀도", earned: lateSceneThinCount === 0 ? 10 : lateSceneThinCount === 1 ? 5 : 0, max: 10, pass: lateSceneThinCount <= 1 });

// ⑤ CTA 핵심 요약 검증
const CTA_THIN_RE = /^(저장해두세요|저장하세요|공유해주세요|팔로우해주세요|좋아요 눌러주세요)\.?$/;
const ctaThin = CTA_THIN_RE.test((scene10?.narration ?? "").trim());
if (ctaThin) {
  warnings.push({ severity: "warning", sceneNumber: 10, message: `CTA narration이 단순 저장/공유 단독 — 핵심 키워드 포함 필요` });
  score = Math.min(score, 79);
  capReasons.push("(L) CTA 핵심 요약 누락 → review 상한 79");
}
breakdown.push({ label: "CTA 핵심 요약", earned: ctaThin ? 0 : 10, max: 10, pass: !ctaThin });

// ⑥ caption 품질
let captionLabelCount = 0;
const LABEL_ONLY_RE = /^[가-힣]{2,5}$/;
scenes.forEach((s, i) => {
  const cap = s.caption ?? "";
  if (LABEL_ONLY_RE.test(cap.trim())) {
    captionLabelCount++;
    warnings.push({ severity: "info", sceneNumber: i + 1, message: `caption 라벨형: "${cap}" — 반전/질문형 권장` });
  }
});
breakdown.push({ label: "caption 품질", earned: captionLabelCount <= 2 ? 10 : 0, max: 10, pass: captionLabelCount <= 2 });

// ⑦ topic 다양성 (씬별 narration 중복 체크)
const narrations = scenes.map((s) => (s.narration ?? "").trim());
const uniqueNar = new Set(narrations).size;
const hasTopicVariety = uniqueNar >= totalScenes * 0.8;
breakdown.push({ label: "topic 다양성", earned: hasTopicVariety ? 5 : 0, max: 5, pass: hasTopicVariety });
if (!hasTopicVariety) {
  warnings.push({ severity: "warning", sceneNumber: 0, message: `narration 중복 과다: ${totalScenes}씬 중 unique ${uniqueNar}건` });
}

// ⑧ imagePrompt 품질 (추상어 감지)
const ABSTRACT_QUERY = /\b(smell|odor|bacteria|concept|problem|issue|solution|abstract)\b/i;
let abstractQueryCount = 0;
scenes.forEach((s, i) => {
  const q = s.fallbackSearchQuery ?? "";
  if (ABSTRACT_QUERY.test(q)) {
    abstractQueryCount++;
    warnings.push({ severity: "info", sceneNumber: i + 1, message: `fallbackSearchQuery 추상어 감지: "${q}"` });
  }
});
breakdown.push({ label: "imagePrompt 구체성", earned: abstractQueryCount === 0 ? 5 : abstractQueryCount <= 2 ? 3 : 0, max: 5, pass: abstractQueryCount <= 2 });

// ── 최종 점수 계산 ─────────────────────────────────────────────────────────────
const maxTotal = breakdown.reduce((a, b) => a + b.max, 0);
const earnedTotal = breakdown.reduce((a, b) => a + b.earned, 0);
score = maxTotal > 0 ? Math.min(score, Math.round((earnedTotal / maxTotal) * 100)) : score;

const grade = score >= 80 ? "pass" : score >= 60 ? "review" : "fail";

const qualityScore = { score, grade, breakdown, capReasons };

// ── TTS 싱크 사전 예측 ────────────────────────────────────────────────────────
const totalNarChars = narrations.reduce((a, b) => a + b.length, 0);
const estimatedTtsSec = Math.round(totalNarChars / 6.5); // 평균 6.5자/초 (nova 0.92)
const videoSec = totalScenes * 5;
const ttsGapSec = videoSec - estimatedTtsSec;
const ttsWarning = ttsGapSec > 5
  ? `⚠️ 예상 gap ${ttsGapSec}s — tail trim 권장`
  : ttsGapSec < -3
  ? `⚠️ 예상 TTS가 영상보다 ${Math.abs(ttsGapSec)}s 길 수 있음`
  : "✅ 예상 싱크 양호";

// ── story 구조 평가 ────────────────────────────────────────────────────────────
const storyEval = [];

// scene 1 hook 검증
const s1nar = scenes[0]?.narration ?? "";
const HOOK_PATTERNS = {
  "반전형C": /인 줄|알았는데|오히려|더 심해|반대|역효과/,
  "타깃형D": /나요\?$|하세요\?$|있나요\?$|겪고 있|겪은 적/,
  "손실형B": /더 나옵|낭비|버립|망가/,
  "금지형A": /하면 안|마세요|넣지 마|금지/,
};
const hookMatched = Object.entries(HOOK_PATTERNS).filter(([, re]) => re.test(s1nar)).map(([k]) => k);
storyEval.push({
  scene: 1,
  role: "hook",
  narration: s1nar,
  caption: scenes[0]?.caption ?? "",
  evaluation: hookMatched.length > 0
    ? `✅ hook 패턴 감지: [${hookMatched.join(", ")}]`
    : `⚠️ hook 패턴 미감지 — 반전형/타깃형/손실형 강화 필요`,
  pass: hookMatched.length > 0,
});

// scene 2 — 흔한 실수 구체성
const s2nar = scenes[1]?.narration ?? "";
const hasMistake = /세제|더 넣|많이 넣|세탁/.test(s2nar);
storyEval.push({
  scene: 2,
  role: "mistake",
  narration: s2nar,
  caption: scenes[1]?.caption ?? "",
  evaluation: hasMistake ? "✅ 흔한 실수 행동(세제 과다) 구체 언급" : "⚠️ 세제 과다 넣기 행동 구체 언급 필요",
  pass: hasMistake,
});

// scene 3 — 숨은 원인 reveal
const s3nar = scenes[2]?.narration ?? "";
const hasHiddenCause = /잔여물|세균|습기|번식|남아|찌꺼기|헹굼/.test(s3nar);
storyEval.push({
  scene: 3,
  role: "hidden_cause",
  narration: s3nar,
  caption: scenes[2]?.caption ?? "",
  evaluation: hasHiddenCause ? "✅ 숨은 원인 reveal (세제 잔여물/세균/습기)" : "⚠️ 숨은 원인 구체 미언급 — 잔여물/세균/습기 키워드 필요",
  pass: hasHiddenCause,
});

// scenes 4~6 — 해결 단계적 이어짐
const sol456 = scenes.slice(3, 6).map((s) => s?.narration ?? "");
const hasStepwiseSolution = sol456.every((n) => n.length >= 14);
const hasSolDiversity = new Set(sol456).size === 3;
storyEval.push({
  scene: "4~6",
  role: "solution",
  narrations: sol456,
  evaluation: hasStepwiseSolution && hasSolDiversity
    ? "✅ 해결 단계 3씬 모두 구체적이고 다양"
    : !hasSolDiversity
    ? "⚠️ 해결 씬 중복 또는 같은 규칙 반복 감지"
    : "⚠️ 해결 씬 중 narration 너무 짧음",
  pass: hasStepwiseSolution && hasSolDiversity,
});

// scene 7 — before/after 결과
const s7nar = scenes[6]?.narration ?? "";
const hasResult = /줄|없어|사라|회복|개선|깨끗|촉감|부드|상쾌|달라/.test(s7nar);
storyEval.push({
  scene: 7,
  role: "result",
  narration: s7nar,
  caption: scenes[6]?.caption ?? "",
  evaluation: hasResult ? "✅ 구체 결과 언급 (냄새 감소/촉감 회복)" : "⚠️ 구체 결과 미언급 — '냄새 줄다/사라지다/촉감 회복' 표현 필요",
  pass: hasResult,
});

// scenes 8~9 — 정보 밀도
const s8nar = scenes[7]?.narration ?? "";
const s9nar = scenes[8]?.narration ?? "";
const bonus89Dense = s8nar.length >= 14 && s9nar.length >= 14 && !GENERIC_PATTERNS.test(s8nar) && !GENERIC_PATTERNS.test(s9nar);
storyEval.push({
  scene: "8~9",
  role: "bonus_warning",
  narrations: [s8nar, s9nar],
  evaluation: bonus89Dense ? "✅ 보너스/주의사항 정보 밀도 충분" : "⚠️ scene 8~9 정보 밀도 부족 — 주의사항/보너스 구체 내용 필요",
  pass: bonus89Dense,
});

// scene 10 — CTA + motion
const s10nar = scene10?.narration ?? "";
const s10motion = scene10?.motion ?? "";
const ctaOk = s10motion === "slow_zoom_out" && !CTA_THIN_RE.test(s10nar.trim()) && s10nar.length >= 14;
storyEval.push({
  scene: 10,
  role: "CTA",
  narration: s10nar,
  caption: scene10?.caption ?? "",
  motion: s10motion,
  evaluation: ctaOk
    ? "✅ CTA + 핵심 요약 + slow_zoom_out motion"
    : `⚠️ ${s10motion !== "slow_zoom_out" ? "motion 오류 " : ""}${CTA_THIN_RE.test(s10nar.trim()) ? "핵심 요약 누락 " : ""}${s10nar.length < 14 ? "narration 너무 짧음" : ""}`,
  pass: ctaOk,
});

// ── fallbackSearchQuery 사전 평가 ─────────────────────────────────────────────
const queryEval = scenes.map((s, i) => {
  const q = s.fallbackSearchQuery ?? "";
  const abstract = ABSTRACT_QUERY.test(q);
  const hasPerson = /\b(person|woman|man|people|hands?)\b/i.test(q);
  const wordCount = q.trim().split(/\s+/).length;
  return {
    scene: i + 1,
    query: q,
    wordCount,
    issues: [
      ...(abstract ? ["추상어 감지"] : []),
      ...(hasPerson ? ["사람 중심 — 오브젝트로 교체 권장"] : []),
      ...(wordCount < 2 ? ["너무 짧음 (2단어 이상 권장)"] : []),
      ...(wordCount > 5 ? ["너무 김 (4단어 이내 권장)"] : []),
    ],
    pass: !abstract && !hasPerson && wordCount >= 2 && wordCount <= 5,
  };
});

// ── 결과 저장 ──────────────────────────────────────────────────────────────────
// 1. raw response
writeFileSync(RESP_PATH, JSON.stringify(rawResponse, null, 2), "utf8");

// 2. plan (씬 구조)
writeFileSync(PLAN_PATH, JSON.stringify(plan, null, 2), "utf8");

// 3. quality score
writeFileSync(QUALITY_PATH, JSON.stringify({
  ...qualityScore,
  storyEval,
  queryEval,
  ttsPredict: {
    totalNarChars,
    estimatedTtsSec,
    videoSec,
    ttsGapSec,
    warning: ttsWarning,
  },
}, null, 2), "utf8");

// 4. attempts summary
writeFileSync(ATTEMPT_PATH, JSON.stringify([{
  attempt: 1,
  score,
  grade,
  sceneCount: totalScenes,
  warningCounts: {
    fixed: warnings.filter((w) => w.severity === "fixed").length,
    warning: warnings.filter((w) => w.severity === "warning").length,
    info: warnings.filter((w) => w.severity === "info").length,
  },
  failedBreakdownLabels: breakdown.filter((b) => !b.pass).map((b) => b.label),
  capReasons,
  usage: rawResponse.usage,
  elapsedSec: parseFloat(elapsed),
}], null, 2), "utf8");

// ── 콘솔 리포트 ────────────────────────────────────────────────────────────────
console.log("══════════════════════════════════════════");
console.log("QA-LH-10 Plan 생성 결과");
console.log("══════════════════════════════════════════\n");

console.log(`📊 품질 점수: ${score}/100 (${grade.toUpperCase()})`);
if (capReasons.length) console.log("   Cap 이유:", capReasons.join("\n           "));
console.log();

console.log("📋 씬 구조 요약:");
scenes.forEach((s, i) => {
  console.log(`  Scene ${i + 1}: [${s.motion}] "${s.caption}" / "${s.narration}"`);
});
console.log();

console.log("🎯 Story 구조 평가:");
storyEval.forEach((e) => {
  console.log(`  Scene ${e.scene} (${e.role}): ${e.evaluation}`);
});
console.log();

console.log("🔍 fallbackSearchQuery 평가:");
queryEval.forEach((q) => {
  const status = q.pass ? "✅" : "⚠️";
  const issues = q.issues.length ? ` [${q.issues.join(", ")}]` : "";
  console.log(`  Scene ${q.scene}: ${status} "${q.query}"${issues}`);
});
console.log();

console.log("⏱️  TTS 싱크 예측:");
console.log(`  총 narration 글자 수: ${totalNarChars}자`);
console.log(`  예상 TTS 길이: ~${estimatedTtsSec}초`);
console.log(`  영상 길이: ${videoSec}초 (${totalScenes}씬 × 5초)`);
console.log(`  예상 gap: ${ttsGapSec > 0 ? "+" : ""}${ttsGapSec}초 → ${ttsWarning}`);
console.log();

if (warnings.length) {
  console.log(`⚠️  Warnings (${warnings.length}건):`);
  warnings.forEach((w) => {
    const icon = w.severity === "warning" ? "⚠️" : w.severity === "fixed" ? "🔧" : "ℹ️";
    console.log(`  ${icon} [Scene ${w.sceneNumber}] ${w.message}`);
  });
  console.log();
}

console.log("📁 저장 완료:");
console.log(`  response: ${RESP_PATH}`);
console.log(`  plan:     ${PLAN_PATH}`);
console.log(`  quality:  ${QUALITY_PATH}`);
console.log(`  attempts: ${ATTEMPT_PATH}`);
console.log();

console.log("🔒 유료 API 사용 내역:");
console.log(`  호출: OpenAI gpt-4o-mini 1회`);
console.log(`  tokens: ${rawResponse.usage?.total_tokens ?? "unknown"} (prompt: ${rawResponse.usage?.prompt_tokens}, completion: ${rawResponse.usage?.completion_tokens})`);
const estimatedCost = ((rawResponse.usage?.prompt_tokens ?? 0) * 0.00000015 + (rawResponse.usage?.completion_tokens ?? 0) * 0.0000006).toFixed(5);
console.log(`  예상 비용: ~$${estimatedCost}`);
console.log();

console.log("✅ 금지 API 호출 없음 (TTS/Imagen/Pexels/Pollinations)");
console.log("✅ 유료 플래그 false 원복 완료");
