/**
 * QA-18: visualAnchorId 시스템 로컬 테스트
 * - anchor 재사용 로직이 올바르게 동작하는지 검증
 * - reuseAnchorImages: true 시 같은 anchorId는 첫 이미지 재사용
 * - reuseAnchorImages: false 시 독립 이미지 생성 (기존 동작)
 * - anchorId 없는 씬은 기존 동작 유지
 */

// ── anchor 재사용 시뮬레이터 (render-v2 route 로직 인라인) ──────────────────
function simulateAnchorReuse(scenes, reuseAnchorImages, anchorImageCache) {
  const result = [];
  for (const scene of scenes) {
    const anchorId = scene.visualAnchorId;
    // anchor 재사용 조건 체크
    if (reuseAnchorImages && anchorId) {
      const cached = anchorImageCache.get(anchorId);
      if (cached) {
        result.push({ sceneNumber: scene.sceneNumber, action: "reuse_anchor", anchorId, source: cached.sceneName });
        continue;
      }
    }
    // 새 이미지 생성 (시뮬레이션)
    const imagePath = `scene_${scene.sceneNumber}.png`;
    result.push({ sceneNumber: scene.sceneNumber, action: "generate_new", anchorId: anchorId || null, imagePath });
    // anchor 캐시 등록
    if (reuseAnchorImages && anchorId && !anchorImageCache.has(anchorId)) {
      anchorImageCache.set(anchorId, { sceneName: `scene_${scene.sceneNumber}`, imagePath });
    }
  }
  return result;
}

// ── 테스트 픽스처: 10씬 emotional_story with visualAnchorId ──────────────────
const FIXTURE_SCENES_WITH_ANCHOR = [
  { sceneNumber: 1, visualAnchorId: "wallet_photo_anchor", narration: "지갑 안에서 낡은 사진이" },
  { sceneNumber: 2, visualAnchorId: "wallet_photo_anchor", narration: "왜 매일 꺼내 보셨을까요" },
  { sceneNumber: 3, visualAnchorId: "wallet_photo_anchor", narration: "아버지는 매일 꺼내 보셨죠" },
  { sceneNumber: 4, visualAnchorId: "photo_back_anchor",   narration: "왜 그 사진을 매일 보셨는지" },
  { sceneNumber: 5, visualAnchorId: "photo_back_anchor",   narration: "사진 뒷면에는 흐릿한 흔적" },
  { sceneNumber: 6, visualAnchorId: "father_memory_anchor", narration: "그 사진 속 인물이" },
  { sceneNumber: 7, visualAnchorId: "father_memory_anchor", narration: "사진 뒷면엔 손글씨가" },
  { sceneNumber: 8, visualAnchorId: "father_memory_anchor", narration: "내가 태어난 날이었어요" },
  { sceneNumber: 9, visualAnchorId: "present_wallet_anchor", narration: "아버지의 마음이 이해됐어요" },
  { sceneNumber: 10, visualAnchorId: "present_wallet_anchor", narration: "지금도 지갑에 넣고 다녀요" },
];

const FIXTURE_SCENES_NO_ANCHOR = [
  { sceneNumber: 1, narration: "지갑 안에서 낡은 사진이" },
  { sceneNumber: 2, narration: "왜 매일 꺼내 보셨을까요" },
];

const FIXTURE_SCENES_MIXED = [
  { sceneNumber: 1, visualAnchorId: "wallet_photo_anchor", narration: "씬1 (anchor)" },
  { sceneNumber: 2, narration: "씬2 (no anchor — 기존 동작)" },
  { sceneNumber: 3, visualAnchorId: "wallet_photo_anchor", narration: "씬3 (anchor 재사용)" },
];

// ── 테스트 ────────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;

function test(label, fn) {
  try {
    const result = fn();
    if (result === true) {
      console.log(`  ✅ ${label}`);
      pass++;
    } else {
      console.log(`  ❌ ${label}`);
      console.log(`     → ${JSON.stringify(result)}`);
      fail++;
    }
  } catch (e) {
    console.log(`  ❌ ${label} (threw: ${e.message})`);
    fail++;
  }
}

// ── [1] reuseAnchorImages: true — anchor 씬 재사용 확인 ───────────────────────
console.log("\n[1] reuseAnchorImages: true — anchor 재사용");
{
  const cache = new Map();
  const result = simulateAnchorReuse(FIXTURE_SCENES_WITH_ANCHOR, true, cache);

  test("씬 1은 새 이미지 생성", () =>
    result[0].action === "generate_new" && result[0].sceneNumber === 1
  );
  test("씬 2는 anchor 재사용 (wallet_photo_anchor)", () =>
    result[1].action === "reuse_anchor" && result[1].anchorId === "wallet_photo_anchor"
  );
  test("씬 3도 anchor 재사용 (wallet_photo_anchor)", () =>
    result[2].action === "reuse_anchor" && result[2].anchorId === "wallet_photo_anchor"
  );
  test("씬 4는 새 이미지 생성 (photo_back_anchor 첫 등장)", () =>
    result[3].action === "generate_new" && result[3].anchorId === "photo_back_anchor"
  );
  test("씬 5는 anchor 재사용 (photo_back_anchor)", () =>
    result[4].action === "reuse_anchor" && result[4].anchorId === "photo_back_anchor"
  );
  test("씬 6은 새 이미지 생성 (father_memory_anchor 첫 등장)", () =>
    result[5].action === "generate_new" && result[5].anchorId === "father_memory_anchor"
  );
  test("씬 7~8은 anchor 재사용 (father_memory_anchor)", () =>
    result[6].action === "reuse_anchor" && result[7].action === "reuse_anchor"
  );
  test("씬 9는 새 이미지 생성 (present_wallet_anchor 첫 등장)", () =>
    result[8].action === "generate_new" && result[8].anchorId === "present_wallet_anchor"
  );
  test("씬 10은 anchor 재사용 (present_wallet_anchor)", () =>
    result[9].action === "reuse_anchor" && result[9].anchorId === "present_wallet_anchor"
  );

  // 이미지 생성은 4번만 (anchor 4개 × 첫 씬)
  const generateCount = result.filter((r) => r.action === "generate_new").length;
  test(`이미지 생성 횟수 = 4회 (10씬 중 anchor 4개 첫 씬만), 실제: ${generateCount}`, () =>
    generateCount === 4
  );
}

// ── [2] reuseAnchorImages: false — 기존 동작 (전부 새 이미지) ──────────────────
console.log("\n[2] reuseAnchorImages: false — 기존 동작 유지");
{
  const cache = new Map();
  const result = simulateAnchorReuse(FIXTURE_SCENES_WITH_ANCHOR, false, cache);

  test("모든 씬이 새 이미지 생성 (anchor 무시)", () =>
    result.every((r) => r.action === "generate_new")
  );
  const generateCount = result.filter((r) => r.action === "generate_new").length;
  test(`이미지 생성 횟수 = 10회, 실제: ${generateCount}`, () =>
    generateCount === 10
  );
}

// ── [3] anchorId 없는 씬 — 기존 동작 유지 ────────────────────────────────────
console.log("\n[3] anchorId 없는 씬 — 기존 동작 유지");
{
  const cache = new Map();
  const result = simulateAnchorReuse(FIXTURE_SCENES_NO_ANCHOR, true, cache);

  test("anchorId 없는 씬은 항상 새 이미지 생성", () =>
    result.every((r) => r.action === "generate_new")
  );
  test("anchor 캐시에 아무것도 등록 안 됨", () =>
    cache.size === 0
  );
}

// ── [4] mixed — anchor 있는 씬과 없는 씬 혼재 ─────────────────────────────────
console.log("\n[4] mixed — anchor 있는 씬 + 없는 씬");
{
  const cache = new Map();
  const result = simulateAnchorReuse(FIXTURE_SCENES_MIXED, true, cache);

  test("씬 1: 새 이미지 생성 + anchor 캐시 등록", () =>
    result[0].action === "generate_new" && cache.has("wallet_photo_anchor")
  );
  test("씬 2: anchorId 없으므로 새 이미지 생성", () =>
    result[1].action === "generate_new" && result[1].anchorId === null
  );
  test("씬 3: wallet_photo_anchor 재사용", () =>
    result[2].action === "reuse_anchor" && result[2].anchorId === "wallet_photo_anchor"
  );
  test("총 이미지 생성 = 2회 (씬1, 씬2)", () => {
    const count = result.filter((r) => r.action === "generate_new").length;
    return count === 2;
  });
}

// ── [5] anchor 5개 ID 유효성 확인 (QA-21: hand-drawn 스타일 전환, 5-anchor 체계) ──
console.log("\n[5] 5개 anchor ID 명세 확인 (QA-21)");
const VALID_ANCHOR_IDS = new Set([
  "wallet_photo_anchor",
  "photo_back_anchor",
  "memory_table_anchor",    // 구 father_memory_anchor → memory_table_anchor
  "hands_closeup_anchor",   // 씬 8 전용 새 앵커
  "present_wallet_anchor",
]);
// 구 4-anchor ID도 유효로 인정 (이전 콘티와의 하위 호환)
const LEGACY_ANCHOR_IDS = new Set([
  "wallet_photo_anchor",
  "photo_back_anchor",
  "father_memory_anchor",   // 구 앵커 — 하위 호환 허용
  "present_wallet_anchor",
]);
test("5-anchor 명세 집합이 올바름 (5개)", () =>
  VALID_ANCHOR_IDS.size === 5
);
test("10씬이 anchor로 모두 커버됨 (anchor 미할당 씬 없음)", () => {
  return FIXTURE_SCENES_WITH_ANCHOR.every((s) => s.visualAnchorId);
});

// ── [6] QA-19 anchor mismatch 보정 시뮬레이션 ────────────────────────────────
// QA-19에서 GPT가 씬 5=father_memory_anchor, 씬 6=photo_back_anchor로 교차 배정
// sanitizePlan의 강제 보정 로직을 인라인 재현하여 보정 결과 검증
console.log("\n[6] QA-19 anchor mismatch — sanitize 보정 시뮬레이션");

// QA-21 5-anchor 체계 (generate-v2/route.ts ANCHOR_MAP과 동기화)
const ANCHOR_MAP = {
  1: "wallet_photo_anchor", 2: "wallet_photo_anchor", 3: "wallet_photo_anchor",
  4: "photo_back_anchor",   5: "photo_back_anchor",
  6: "memory_table_anchor", 7: "memory_table_anchor",
  8: "hands_closeup_anchor",
  9: "present_wallet_anchor", 10: "present_wallet_anchor",
};

// QA-19 GPT 출력 (씬 5/6 교차 오배정 — 구 4-anchor 기준)
// QA-21 이후에는 새 5-anchor 맵으로 보정됨
const QA19_GPT_ANCHORS = {
  1: "wallet_photo_anchor",
  2: "wallet_photo_anchor",
  3: "wallet_photo_anchor",
  4: "photo_back_anchor",
  5: "father_memory_anchor",  // ← 오배정 (expected now: photo_back_anchor)
  6: "photo_back_anchor",     // ← 오배정 (expected now: memory_table_anchor)
  7: "father_memory_anchor",  // ← 오배정 (expected now: memory_table_anchor)
  8: "father_memory_anchor",  // ← 오배정 (expected now: hands_closeup_anchor)
  9: "present_wallet_anchor",
  10: "present_wallet_anchor",
};

function simulateAnchorSanitize(gptAnchors) {
  const correctedWarnings = [];
  const result = {};
  for (const [sceneStr, gptAnchor] of Object.entries(gptAnchors)) {
    const sceneNumber = Number(sceneStr);
    const expected = ANCHOR_MAP[sceneNumber];
    if (!expected) { result[sceneNumber] = gptAnchor; continue; }
    if (!gptAnchor) {
      correctedWarnings.push({ sceneNumber, type: "missing", corrected: expected });
      result[sceneNumber] = expected;
    } else if (gptAnchor !== expected) {
      correctedWarnings.push({ sceneNumber, type: "mismatch", gpt: gptAnchor, corrected: expected });
      result[sceneNumber] = expected;
    } else {
      result[sceneNumber] = gptAnchor;
    }
  }
  return { result, correctedWarnings };
}

{
  const { result, correctedWarnings } = simulateAnchorSanitize(QA19_GPT_ANCHORS);

  test("씬 5: father_memory_anchor → photo_back_anchor 보정", () =>
    result[5] === "photo_back_anchor"
  );
  test("씬 6: photo_back_anchor → memory_table_anchor 보정", () =>
    result[6] === "memory_table_anchor"
  );
  test("보정 건수 = 4건 (씬 5, 6, 7, 8 — 5-anchor 기준)", () =>
    correctedWarnings.length === 4
  );
  test("보정 후 mismatch 0건 (전 씬 expected와 일치)", () => {
    return Object.entries(result).every(([sceneStr, anchor]) => {
      const expected = ANCHOR_MAP[Number(sceneStr)];
      return !expected || anchor === expected;
    });
  });
  test("씬 1~3 = wallet_photo_anchor 유지", () =>
    result[1] === "wallet_photo_anchor" && result[2] === "wallet_photo_anchor" && result[3] === "wallet_photo_anchor"
  );
  test("씬 9~10 = present_wallet_anchor 유지", () =>
    result[9] === "present_wallet_anchor" && result[10] === "present_wallet_anchor"
  );
}

// ── [7] anchor 강제 보정 후 reuseAnchorImages 동작 확인 ───────────────────────
// QA-19 GPT 씬들을 anchor 보정 후 anchor reuse 시뮬레이션 실행
console.log("\n[7] QA-19 — anchor 보정 후 reuseAnchorImages 동작");
{
  // QA-19 실제 씬 데이터 (anchor 보정 전 — GPT 출력 기준)
  const QA19_SCENES_RAW = [
    { sceneNumber: 1, visualAnchorId: "wallet_photo_anchor",   narration: "지갑 안에서 낡은 사진이, 나왔어요." },
    { sceneNumber: 2, visualAnchorId: "wallet_photo_anchor",   narration: "아버지는 그 사진을, 매일 꺼내 보셨죠." },
    { sceneNumber: 3, visualAnchorId: "wallet_photo_anchor",   narration: "아버지의 손은, 그 사진을 조심스럽게 다루었어요." },
    { sceneNumber: 4, visualAnchorId: "photo_back_anchor",     narration: "사진 뒷면엔, 뭔가 적혀 있었어요." },
    { sceneNumber: 5, visualAnchorId: "father_memory_anchor",  narration: "아버지는 그 사진을, 언제나 내 곁에 두셨죠." }, // 오배정
    { sceneNumber: 6, visualAnchorId: "photo_back_anchor",     narration: "사진 뒷면엔, 내가 태어난 날이 적혀 있었어요." }, // 오배정
    { sceneNumber: 7, visualAnchorId: "father_memory_anchor",  narration: "그 사진은, 나의 탄생을 기념한 순간이었어요." },
    { sceneNumber: 8, visualAnchorId: "father_memory_anchor",  narration: "그제야 아버지의 마음이, 조금은 이해됐어요." },
    { sceneNumber: 9, visualAnchorId: "present_wallet_anchor", narration: "그래서 나는 지금도, 그 사진을 지갑에 넣고 다녀요." },
    { sceneNumber: 10, visualAnchorId: "present_wallet_anchor", narration: "그 사진을, 나는 지금도 지갑에 넣고 다녀요." },
  ];

  // anchor 보정 적용
  const corrected = QA19_SCENES_RAW.map((s) => ({
    ...s,
    visualAnchorId: ANCHOR_MAP[s.sceneNumber] || s.visualAnchorId,
  }));

  const cache = new Map();
  const reuseResult = simulateAnchorReuse(corrected, true, cache);

  test("보정 후 이미지 생성 = 5회 (anchor 5개 첫 씬만)", () => {
    const count = reuseResult.filter((r) => r.action === "generate_new").length;
    return count === 5;
  });
  test("보정 후 씬 5: photo_back_anchor 재사용 (씬 4 이미지 공유)", () =>
    reuseResult[4].action === "reuse_anchor" && reuseResult[4].anchorId === "photo_back_anchor"
  );
  test("보정 후 씬 6: memory_table_anchor 새 생성 (첫 등장)", () =>
    reuseResult[5].action === "generate_new" && reuseResult[5].anchorId === "memory_table_anchor"
  );
  test("보정 후 씬 7: memory_table_anchor 재사용", () =>
    reuseResult[6].action === "reuse_anchor" && reuseResult[6].anchorId === "memory_table_anchor"
  );
  test("보정 후 씬 8: hands_closeup_anchor 새 생성 (첫 등장)", () =>
    reuseResult[7].action === "generate_new" && reuseResult[7].anchorId === "hands_closeup_anchor"
  );
}

// ── 결과 요약 ────────────────────────────────────────────────────────────────
console.log(`\n총 ${pass + fail}건 — ✅ ${pass} pass  ❌ ${fail} fail`);
if (fail > 0) process.exit(1);
