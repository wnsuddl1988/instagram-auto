/**
 * 황소특보(가칭) 캐릭터 디자인 4차 — 부엉박사 비율/엣지 요소 이식.
 *
 * v3(bull_young_sharp_cartoon 계열)가 "젊음"은 반영했으나 Owner 피드백:
 * "내가 원하던 느낌은 아니다" — 보내준 참조는 v2(코걸이 있는 근엄한
 * 버전)였고, "부엉박사와 같은 귀여운 느낌과 엣지있는 느낌을 가져오면
 * 어떨까"라고 명확히 지시.
 *
 * 부엉박사(owl3dv5-canonical-reference.png) 분석 결과 핵심 공식:
 *   - 극단적 SD(슈퍼 디포르메) 비율: 머리가 몸통의 대부분, 짧고 뭉툭한
 *     팔다리, 동글동글하고 통통한 몸통 (지금까지의 황소 시안은 팔다리가
 *     길고 사람 비율에 가까웠음 — 이게 "근엄"하게 보인 핵심 원인)
 *   - 크고 반짝이는 만화적 눈(홍채 크게, 하이라이트 두 개, 살짝 처진
 *     눈꺼풀선으로 장난기 있는 표정)
 *   - "엣지" 장치: 선글라스를 쓰지 않고 이마 위로 걸쳐 얹은 포즈 — 이게
 *     "쿨하지만 위협적이지 않은" 인상의 핵심
 *   - 복장은 상반신 조끼만(부엉박사도 조끼만 입고 하의는 없음/깃털 그대로)
 *
 * 이번 버전은 코걸이 없음(3차 확정사항 유지), 골드 컬러 유지, 이 비율/
 * 엣지 공식만 새로 이식한다.
 */

const OWL_PROPORTION_NOTE =
  "CRITICAL proportions — match the exact chibi/SD proportion style of a classic cute mascot: the " +
  "head is HUGE relative to the body (roughly 60-65% of the total height), the body is short, round, " +
  "and plump like a beanbag, and the arms and legs are short and stubby (NOT long human-like limbs " +
  "in dress pants). Do NOT draw this like a person in a suit — draw it like an adorable round toy " +
  "creature. The overall silhouette should be egg-shaped / rounded, not tall and slim.";

const OWL_EYES_NOTE =
  "The eyes must be LARGE, round, and glossy with two bright highlight dots each, cartoon-big " +
  "(taking up a large portion of the face), with a playful, slightly mischievous-but-friendly " +
  "expression — think a confident smirk with sparkling eyes, like a clever kid who just made a " +
  "smart trade, not a stern adult glare. Eyebrows can be slightly angled for a sharp/confident edge, " +
  "but the eyes themselves stay big, round, and warm.";

const SUNGLASSES_EDGE_NOTE =
  "For the \"edgy\" accent: instead of glasses worn normally over the eyes, place a pair of stylish " +
  "dark sunglasses pushed UP and resting on top of the head/forehead (not covering the eyes), " +
  "exactly like a cool news anchor mascot. The eyes underneath remain fully visible and expressive.";

const NO_NOSE_RING_NOTE =
  "Do NOT include a nose ring or any nose piercing — keep the snout/muzzle clean and simple.";

const VEST_ONLY_NOTE =
  "Clothing: only a small fitted dark navy vest (waistcoat) over the chest, similar to a news " +
  "anchor's vest, with NO dress shirt, NO tie, NO pants, and NO shoes underneath — the golden body, " +
  "arms, and legs stay bare and visible below the vest, matching the same minimal-clothing mascot " +
  "convention as the reference owl character.";

const GLOSSY_TOY_TEXTURE_NOTE =
  "Rendering style: soft, glossy, rounded 3D mascot render (Pixar/DreamWorks toy quality) with a " +
  "smooth metallic-gold sheen on the body, matching the polish and cuteness level of a premium " +
  "animated mascot character, not a photorealistic textured suit or realistic cattle anatomy.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_character_design_spec_v4",
  episode: 0,
  character: "bull_design_candidates_v4",
  title: "황소특보 캐릭터 디자인 4차 (부엉박사 비율/엣지 이식)",
  slides: [
    {
      id: "bull_owl_proportion_newsroom",
      file: "bull_owl_proportion_newsroom.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute chibi mascot character shaped like a young bull (cow), with a warm golden metallic ` +
        `body (rich gold color), small golden horns, small rounded ears. ${NO_NOSE_RING_NOTE}\n\n` +
        `${OWL_PROPORTION_NOTE}\n\n` +
        `${OWL_EYES_NOTE}\n\n` +
        `${SUNGLASSES_EDGE_NOTE}\n\n` +
        `${VEST_ONLY_NOTE}\n\n` +
        `${GLOSSY_TOY_TEXTURE_NOTE}\n\n` +
        `Pose: standing confidently, one small arm raised in a friendly wave or thumbs-up gesture, ` +
        `weight balanced, cheerful and approachable stance (not stiff, not arms crossed).\n\n` +
        `Background: a modern financial news studio — dark navy background with a glowing stock ` +
        `ticker tape along the bottom (abstract numbers and arrows, illegible, decorative only), a ` +
        `softly blurred world map or candlestick chart graphic behind, cool blue studio lighting with ` +
        `warm gold rim light on the character.\n\n` +
        `Style: polished 3D cartoon mascot render, sharp focus on the character, no text overlays.`,
    },
    {
      id: "bull_owl_proportion_desk_pointing",
      file: "bull_owl_proportion_desk_pointing.png",
      withCharacter: false,
      prompt:
        `Create a vertical 1080x1920px canonical character reference image (full body, front-facing, ` +
        `centered, clean studio lighting) for a Korean finance Shorts mascot.\n\n` +
        `A cute chibi mascot character shaped like a young bull (cow), with a warm golden metallic ` +
        `body (rich gold color), small golden horns, small rounded ears. ${NO_NOSE_RING_NOTE}\n\n` +
        `${OWL_PROPORTION_NOTE}\n\n` +
        `${OWL_EYES_NOTE}\n\n` +
        `${SUNGLASSES_EDGE_NOTE}\n\n` +
        `${VEST_ONLY_NOTE}\n\n` +
        `${GLOSSY_TOY_TEXTURE_NOTE}\n\n` +
        `Pose: one short arm pointing confidently forward/upward like presenting breaking news, the ` +
        `other arm resting on the hip, a bright confident grin, dynamic and energetic but still cute ` +
        `and rounded — like a mascot excitedly reporting hot market news.\n\n` +
        `Background: a bright modern trading floor with large monitors showing abstract green uptrend ` +
        `candlestick charts in soft focus, daytime energetic lighting, a hint of a city skyline ` +
        `through windows.\n\n` +
        `Style: polished 3D cartoon mascot render, sharp focus on the character, no text overlays.`,
    },
  ],
});
