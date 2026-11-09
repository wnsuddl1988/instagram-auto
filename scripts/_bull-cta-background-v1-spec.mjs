/**
 * 황소특보(bull3dv1) 고정 CTA 전용 배경 재작업.
 *
 * 캐릭터 디자인 확정용 canonical reference(bull3dv1-canonical-reference.png)의
 * "서재+도심야경" 배경은 캐릭터 외형을 확정하려고 만든 것일 뿐, CTA 전용으로
 * 검증된 배경이 아니었다. CTA는 모든 편 끝에 매번 반복 재생되는 고정 클립이라
 * 특정 소재와 무관하게 항상 잘 어울려야 하는데, 이전 시도가 이 배경을 검증 없이
 * 그대로 재사용해서 Owner 지적을 받았다(2026-09-23: "저 배경은 캐릭터 선정할때
 * 넣은거지 저 배경으로CTA 고정갈거야?? 배경은 모든 화면에 다 어울리는 걸로
 * 해야되는거 아니가").
 *
 * Owner 확정 방향(2026-09-23): "시황, 투자관련 얘기를 전달하는거니가 그 분위기에
 * 맞게. 그리고 현대적인 분위기로" — 서재의 원목/고전적 톤을 완전히 배제하고,
 * 밝고 깨끗한 유리·메탈 소재의 현대적 트레이딩룸/뉴스룸, 뒤쪽에 대형 시황
 * 디스플레이 월(여러 화면에 지수·차트), 파란색/흰색 조명 중심 톤으로 교체한다.
 * 부엉박사 밝은 톤 CTA(owl_cta_bright_follow.png 계열, 화이트/라이트베이지/
 * 소프트골드 뉴스룸)와 결이 비슷하되, 황소특보는 시황 캐스터이므로 시황
 * 디스플레이 요소가 더 두드러지게 한다.
 *
 * 캐릭터 자체의 외형(골드색 SD비율 황소, 큰 뿔, 넓적한 주둥이, dewlap, 안경,
 * 흰셔츠+넥타이+네이비바지)과 포즈(오른손 포인팅+왼손 허리, 50~55% 프레임)는
 * v8 확정 스펙에서 전혀 바꾸지 않는다 — 배경만 교체.
 */

// ── 새 배경: 현대적 트레이딩룸/뉴스룸 (서재/야경 완전 배제) ──
// 이 CTA는 고정 재사용 클립이라 특정 날짜의 실제 지수 수치를 박아 넣으면 안
// 된다(Owner 지적, 2026-09-23: "배경에 코스피, 코스닥, S&P 500 수치가
// 적혀있는데 지금거랑 맞는게 전혀 없잖아, 숫자는 삭제하는게 좋을듯 매일
// 변경되는건데"). 화면에는 종목명/지수명/구체적 숫자를 절대 넣지 않고,
// 추상적인 상승 그래프 라인/캔들 실루엣만 장식 요소로 둔다.
const MODERN_TRADING_ROOM_BACKGROUND_NOTE =
  "Background: a bright, clean, modern financial newsroom / trading-floor studio — sleek glass and " +
  "brushed-metal interior surfaces, no wood paneling, no bookshelves, no antique globe or map, no " +
  "warm sunset city skyline. Behind the character, a large wall of multiple sleek monitor screens " +
  "displaying only abstract decorative chart graphics — simple upward-trending line graphs and " +
  "candlestick-bar silhouettes in green/red, with NO numbers, NO index names (no KOSPI/KOSDAQ/S&P " +
  "labels or any ticker text), NO percentages, and NO words anywhere on the screens — purely visual " +
  "chart shapes as ambient decoration, since this is a reusable evergreen clip and any specific " +
  "number would look wrong on a different day. Cool blue and white studio lighting dominates (subtle " +
  "blue LED accent strips along the glass panels), with clean white/light-gray architectural " +
  "surfaces. The overall mood is contemporary, sharp, and energetic — like a modern financial news " +
  "broadcast set, not a cozy study.";

const FRAME_COMPOSITION_NOTE =
  "Frame composition: the character's full body should occupy only about 50-55% of the vertical " +
  "frame height, positioned so there is generous background visible above, beside, and below — a " +
  "medium shot that shows the character stepped back within the scene, NOT a tight close-up that " +
  "fills the frame.";

const GLOSSY_TOY_TEXTURE_NOTE =
  "Rendering style: soft, glossy, rounded 3D mascot render (Pixar/DreamWorks toy quality) with a " +
  "smooth metallic-gold sheen on the body, polished and cute like a premium animated mascot " +
  "character.";

// §0 규칙1(작은 글씨 금지) + 고정클립 원칙(숫자/종목명 금지): 배경 모니터에는
// 어떤 텍스트도 넣지 않는다 — 순수 그래프 도형만.
const SMALL_TEXT_SAFETY_NOTE =
  "On the background monitor screens, render ONLY simple abstract line/candlestick chart shapes — " +
  "absolutely no numbers, no letters, no index names, no percentages, no captions, no axis labels, " +
  "and no UI text of any kind anywhere in the entire scene (including any signage or wall graphics).";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "bull_cta_background_spec_v2",
  episode: 0,
  character: "bull",
  title: "황소특보 CTA 전용 배경 (현대적 트레이딩룸/뉴스룸, canonical reference 편집)",
  slides: [
    {
      id: "bull_cta_bg_v2",
      file: "bull_cta_bg_v2.png",
      // v1은 withCharacter:false(텍스트만으로 신규 생성)로 만들었더니 얼굴 비율·
      // 색조가 canonical reference와 미묘하게 달라짐(Owner 지적, 2026-09-23:
      // "캐릭터 얼굴이 조금 변한거 같은데? 색도 다르고"). v2는 canonical
      // reference 이미지를 실제로 첨부해 편집 요청으로 진행 — 이번엔 진짜 참조
      // 이미지가 있으므로 "reference/exact" 표현을 써도 오인식 거부 버그가
      // 발생하지 않는다(그 버그는 참조 이미지 없이 비교 문구만 쓸 때 발생).
      withCharacter: true,
      prompt:
        `Edit the attached reference image. Keep the bull mascot character's design, face, colors, ` +
        `proportions, and pose EXACTLY identical to the reference image — do not redraw or restyle ` +
        `the character in any way, only replace the background behind it.\n\n` +
        `${MODERN_TRADING_ROOM_BACKGROUND_NOTE}\n\n` +
        `${SMALL_TEXT_SAFETY_NOTE}\n\n` +
        `${FRAME_COMPOSITION_NOTE}\n\n` +
        `Do not change the character's horns, muzzle, dewlap, glasses, facial expression, gold body ` +
        `color/shade, clothing (white shirt, dark red necktie, navy pants, brown shoes), or the ` +
        `raised pointing-finger pose with the other hand on the hip — every detail of the character ` +
        `itself must stay pixel-for-pixel consistent with the reference image. Only the environment ` +
        `around the character changes.`,
    },
  ],
});
