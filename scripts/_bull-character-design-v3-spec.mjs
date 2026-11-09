/**
 * 황소특보(가칭) 캐릭터 디자인 3차 — "젊은 실력자" 톤 + 코걸이 제거.
 *
 * v2(bull_master_investor_alt_pose, 팔짱+도심야경)가 방향은 맞았으나 Owner
 * 피드백: "너무 근엄진지하다", "옷이 너무 실사풍이다", "좀 더 젊은 황소면
 * 좋겠다", "코걸이는 빼는게 어때?". 즉:
 *   - 나이 톤: 노년 거장(버핏 은퇴 연배) → 3040대 신진 고수(젊은 헤지펀드
 *     매니저/애널리스트 느낌)로 하향
 *   - 질감: 실사 정장 텍스처 → 부엉박사·금박사와 같은 카툰풍 마스코트
 *     질감(둥글둥글, 매끈한 표면)으로 복귀
 *   - 코걸이(노즈링) 제거 — 투우/야생 느낌 대신 깔끔한 마스코트 느낌
 *   - 유지할 것: 팔짱 낀 자세, 확신에 찬 눈빛, 도심/시황 배경, 뿔테 안경
 *     (관록 상징은 유지하되 나이는 젊게), 수트(단 카툰 텍스처로)
 */

const YOUNG_SHARP_TONE_NOTE =
  "The character should read as a young, sharp, confident rising star investor — think a brilliant " +
  "30-something hedge fund analyst, not an elderly retired tycoon. Energetic but composed, not " +
  "stiff or overly solemn. The expression is confident and slightly playful-smart — sharp knowing " +
  "eyes, a subtle smirk-like half-smile (not a big grin, not a stern frown), like someone who just " +
  "spotted a great trade. The pose: arms crossed confidently over the chest, standing casually, " +
  "weight slightly to one side rather than stiffly centered — relaxed swagger, not rigid formality.";

const CARTOON_TEXTURE_NOTE =
  "IMPORTANT — rendering style: this must match a soft, rounded, glossy CARTOON mascot look (like a " +
  "Pixar/DreamWorks plush toy character), NOT a photorealistic textured suit. The suit fabric should " +
  "look smooth, slightly glossy/plastic-like (like a toy figure), simplified and rounded — no visible " +
  "fabric weave, no realistic wrinkles. Keep it playful and clean, matching a cute chibi mascot " +
  "proportions (big rounded head, stubby simplified limbs), the same friendly toy-like finish as a " +
  "children's animated character, not a realistic CGI film render.";

const NO_NOSE_RING_NOTE =
  "IMPORTANT: do NOT include a nose ring or any nose piercing on the character — keep the snout/" +
  "muzzle clean and simple, no metal ring through the nose. This should look like a sleek, modern, " +
  "friendly mascot, not a rodeo/wild-bull look.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v3",
  episode: 0,
  character: "bull_design_candidates_v3",
  title: "황소특보 캐릭터 디자인 3차 (젊고 카툰풍, 코걸이 없음)",
  slides: [
    {
      id: "bull_young_sharp_cartoon",
      file: "bull_young_sharp_cartoon.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute chibi-style 3D-rendered mascot character shaped like a young bull (cow), with a warm ` +
        `golden metallic/glossy body (rich gold color), small golden horns, big expressive round eyes. ` +
        `${NO_NOSE_RING_NOTE}\n\n` +
        `${YOUNG_SHARP_TONE_NOTE}\n\n` +
        `Wearing a slim dark navy suit (jacket and vest, open collar with no tie or a loosened tie for ` +
        `a modern youthful look) and small round or rectangular wire-rim glasses. ` +
        `${CARTOON_TEXTURE_NOTE}\n\n` +
        `Background: a modern city skyline at dusk seen through large windows, with a large softly-lit ` +
        `stock chart screen showing an abstract green candlestick uptrend faintly visible in the ` +
        `background (illegible numbers, decorative), warm golden-hour lighting mixed with cool blue ` +
        `city lights.\n\n` +
        `Style: polished 3D cartoon mascot render (Pixar/DreamWorks toy-like quality), photorealistic ` +
        `background environment but the character itself stays glossy and toy-like, sharp focus on ` +
        `the character, no text overlays.`,
    },
    {
      id: "bull_young_sharp_cartoon_alt",
      file: "bull_young_sharp_cartoon_alt.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute chibi-style 3D-rendered mascot character shaped like a young bull (cow), with a warm ` +
        `golden metallic/glossy body (rich gold color), small golden horns, big expressive round eyes. ` +
        `${NO_NOSE_RING_NOTE}\n\n` +
        `${YOUNG_SHARP_TONE_NOTE} For this version, one hand is raised near the chin thoughtfully ` +
        `(index finger touching the chin, like having a sharp insight) instead of fully crossed arms.\n\n` +
        `Wearing a slim dark navy suit vest over a simple white shirt (no jacket, sleeves rolled up ` +
        `slightly for an energetic "working hard" look) and small round wire-rim glasses. ` +
        `${CARTOON_TEXTURE_NOTE}\n\n` +
        `Background: a bright modern trading floor / open-plan fintech office, large monitors with ` +
        `abstract green uptrend charts in soft focus, daytime bright and energetic lighting (not dark ` +
        `moody).\n\n` +
        `Style: polished 3D cartoon mascot render (Pixar/DreamWorks toy-like quality), photorealistic ` +
        `background environment but the character itself stays glossy and toy-like, sharp focus on ` +
        `the character, no text overlays.`,
    },
  ],
});
