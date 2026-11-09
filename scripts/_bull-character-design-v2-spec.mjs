/**
 * 황소특보(가칭) 캐릭터 디자인 2차 — "거장" 톤 확정 시도.
 *
 * 1차 후보(A 뉴스데스크/B 순수마스코트/C 트레이딩플로어)에서 C가 역동성은
 * 좋았으나 Owner 피드백: "워렌 버핏·레이 달리오·피터 린치·코스톨라니"
 * 느낌 — 신난 스타트업 톤이 아니라 노련하고 확신에 찬 거장 톤으로.
 * 동물은 황소 유지(불마켓 상징성이 핵심 — 곰과 함께 주식시장 양대 상징).
 *
 * 변경 방향: 방방 뛰는 자세 대신 차분히 서 있거나 팔짱 낀 자세, 버핏 스타일
 * 뿔테 안경 + 만년필/시가/손목시계 같은 관록 소품, 신난 표정 대신 날카롭게
 * 응시하는 확신에 찬 표정. 서양식 수트 착용.
 *
 * 비교용으로 같은 톤의 사자 캐릭터도 1개 생성 — Owner가 동물 자체를
 * 재검토할 수 있으므로 나란히 비교.
 */

const MASTER_INVESTOR_TONE_NOTE =
  "The expression is NOT excited or bouncy — it is calm, composed, and quietly confident, like a " +
  "legendary value investor (think Warren Buffett, Ray Dalio, Peter Lynch, André Kostolany): sharp, " +
  "knowing eyes with a slight narrowed focus, a subtle closed-mouth smile or neutral composed " +
  "expression, NOT an open excited grin. The pose is relaxed but authoritative — standing still, " +
  "weight settled, arms crossed or one hand resting thoughtfully near the chin, NOT jumping, " +
  "running, or mid-stride. This character should feel like decades of market wisdom, not youthful " +
  "energy.";

const SUIT_PROPS_NOTE =
  "Wearing a well-tailored dark navy or charcoal three-piece suit (vest, jacket, subtle tie), classic " +
  "round or rectangular wire-rim glasses (like Warren Buffett's iconic glasses), and holding one " +
  "small prop that suggests old-money wisdom — choose ONE: a classic fountain pen held thoughtfully, " +
  "OR a small unlit cigar, OR a pocket watch on a chain. Do not include all three, just one, kept " +
  "subtle and not the visual focus.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v2",
  episode: 0,
  character: "bull_design_candidates_v2",
  title: "황소특보 캐릭터 디자인 2차 (거장 톤) + 사자 비교안",
  slides: [
    {
      id: "bull_master_investor",
      file: "bull_master_investor.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute-but-dignified 3D-rendered chibi-style mascot character shaped like a bull (cow), with ` +
        `a golden metallic/glossy body (rich warm gold color, like polished brass or gold bullion), ` +
        `small golden horns, a small darker-gold ring in the nose. The character has the proportions ` +
        `of a friendly mascot (slightly stylized, not photorealistic livestock) but the demeanor of a ` +
        `distinguished elder.\n\n` +
        `${MASTER_INVESTOR_TONE_NOTE}\n\n` +
        `${SUIT_PROPS_NOTE}\n\n` +
        `Background: a warm, book-lined private study or executive office — dark wood bookshelves, a ` +
        `leather armchair, soft warm lamp lighting, a subtle world map or antique globe, evoking old-` +
        `money wisdom and quiet authority rather than a flashy trading floor.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, photorealistic warm studio ` +
        `background, sharp focus on the character, no text overlays.`,
    },
    {
      id: "bull_master_investor_alt_pose",
      file: "bull_master_investor_alt_pose.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute-but-dignified 3D-rendered chibi-style mascot character shaped like a bull (cow), with ` +
        `a golden metallic/glossy body (rich warm gold color, like polished brass or gold bullion), ` +
        `small golden horns, a small darker-gold ring in the nose.\n\n` +
        `${MASTER_INVESTOR_TONE_NOTE} For this version, the arms are crossed confidently over the ` +
        `chest instead of holding a prop.\n\n` +
        `${SUIT_PROPS_NOTE.replace("holding one small prop that suggests old-money wisdom — choose ONE: a classic fountain pen held thoughtfully, OR a small unlit cigar, OR a pocket watch on a chain. Do not include all three, just one, kept subtle and not the visual focus.", "no handheld prop needed for this version since the arms are crossed.")}\n\n` +
        `Background: a modern but tasteful financial district skyline seen through large windows at ` +
        `dusk (soft golden-hour light), a hint of a market chart faintly visible on a nearby screen, ` +
        `understated and elegant rather than flashy.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, photorealistic warm studio ` +
        `background, sharp focus on the character, no text overlays.`,
    },
    {
      id: "lion_master_investor_comparison",
      file: "lion_master_investor_comparison.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot — this is a COMPARISON ` +
        `alternative using a different animal (lion instead of bull), same tone and purpose.\n\n` +
        `A cute-but-dignified 3D-rendered chibi-style mascot character shaped like a lion, with a ` +
        `warm golden-tan fur body and a magnificent golden mane (the mane itself can be a richer, ` +
        `deeper gold tone to tie into the same finance-mascot gold color family).\n\n` +
        `${MASTER_INVESTOR_TONE_NOTE}\n\n` +
        `${SUIT_PROPS_NOTE}\n\n` +
        `Background: a warm, book-lined private study or executive office — dark wood bookshelves, a ` +
        `leather armchair, soft warm lamp lighting, a subtle world map or antique globe, evoking old-` +
        `money wisdom and quiet authority.\n\n` +
        `Style: same polished 3D-render quality as a Pixar/Disney mascot, photorealistic warm studio ` +
        `background, sharp focus on the character, no text overlays.`,
    },
  ],
});
