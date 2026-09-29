/**
 * 금박사 카드뉴스 4편(파일명 순번, 실제 배포는 1편 — 환율의 원리와 파급 효과)
 * 슬라이드 스펙.
 * 원본 영상: scripts/_geumbaksa-ep4-assembly-spec.mjs (완성,
 * C:/tmp/geumbaksa-ep4-episode-final-v2/owl_episode_final.mp4).
 *
 * 실제 배포 편수는 1편이다(2026-09-20 Owner 확정) — 부엉이 5편(한국은행
 * 기준금리 3.00%, 환율 1,380원 돌파 포함) 배포일 오전에 선행 배치하는 실질적
 * 첫 편이다. 파일명은 순번 규칙(ep2, ep3 다음)을 따라 ep4로 지었을 뿐 실제
 * 배포 순서와 무관하다 — [[project_geumbaksa_episode_renumbering_fx_first]] 참고.
 *
 * 게시는 1편 영상이 실제 배포되는 날 세트로 진행한다(Owner 확정 원칙) — 이미지는
 * 미리 만들어 저장만 해둔다.
 *
 * 1~3편 스펙의 배지 규칙·하단 텍스트 제거·무브랜드 원칙을 그대로 승계.
 *
 * 정보량이 많은 편(11씬 표준 구조)이라 본문을 3장으로 나눈다:
 *   본문1(1~3): 환율 정의(해외직구 체감 비유, 한 줄 정리)
 *   본문2(4~7): 영향 범위+전가 경로+가계 부담+기업 부담
 *   본문3(8~10): 핵심 수치(한국은행 +0.4%p)+체감 환산(1/5)+다음 파급(기준금리 인상)
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same friendly smiling face, no " +
  "clothing. Do not change its design.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 4,
  character: "geumbaksa",
  title: "환율이 오르면 왜 내 지갑부터 나라 금리까지 흔들릴까",
  slides: [
    {
      id: "cover",
      file: "01_geumbaksa_ep4_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a warm, bright home-studio or cozy office ` +
        `space, softly blurred, with a subtle dark navy semi-transparent overlay (about 45% ` +
        `opacity) for text contrast.\n\n` +
        `Position the gold coin character on the right side of the frame, holding a small card ` +
        `with a balance scale showing ₩ and $ symbols, with a curious, welcoming expression, not ` +
        `blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold white/yellow headline text, exactly as written, no typos:\n` +
        `"환율이 오르면\n내 지갑에\n생기는 일"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional but friendly ` +
        `financial news headline card, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_geumbaksa_ep4_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a smartphone showing a simple online shopping ` +
        `checkout screen with a shoe and "$100" price tag, softly blurred, with a dark navy ` +
        `semi-transparent overlay (about 55% opacity) for text contrast. No visible real brand ` +
        `name/logo — plain anonymous surfaces and generic icons only.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (1, 2, 3) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `1. 같은 100달러짜리도\n환율에 따라 내가 내는 돈은 달라진다\n\n` +
        `2. 환율, 우리 돈과\n다른 나라 돈을 바꾸는 비율\n\n` +
        `3. 이 비율이 오르는 순간\n지갑에서 나가는 돈도 함께 오른다\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body2",
      file: "03_geumbaksa_ep4_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a shipping container port with oil barrels and ` +
        `wheat sacks, or a bright market/factory scene, softly blurred, with a dark navy ` +
        `semi-transparent overlay (about 55% opacity) for text contrast. No visible real brand ` +
        `name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 4 numbered points stacked vertically: large bold yellow numbers (4, 5, 6, 7) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `4. 직구족만의 이야기가 아니다,\n기름 넣고 빵 사는 사람도 전부 영향권\n\n` +
        `5. 석유도 밀도 대부분 수입,\n원가부터 흔들리는 구조\n\n` +
        `6. 빵값도 커피값도 기름값도,\n가계는 피할 도리가 없다\n\n` +
        `7. 기업이라고 다를까,\n오른 원가는 결국 가격표에 반영된다\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "body3",
      file: "04_geumbaksa_ep4_body3.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information account.\n\n` +
        `Background: realistic photographic image of a rising bar chart with a pie chart, or a ` +
        `central bank building interior, softly blurred, with a dark navy semi-transparent overlay ` +
        `(about 55% opacity) for text contrast. No visible real brand name/logo.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 3 numbered points stacked vertically: large bold yellow numbers (8, 9, 10) ` +
        `on the left, Korean text on the right in white with black outline for readability, key ` +
        `numbers/phrases highlighted in cyan blue (#64D8FF). Render the Korean text EXACTLY as ` +
        `written, no typos:\n\n` +
        `8. 한국은행 분석 결과,\n환율만으로 소비자물가 +0.4%포인트\n\n` +
        `9. 물가가 오른 이유,\n5분의 1은 바로 환율\n\n` +
        `10. 물가가 뛰면 한국은행도\n기준금리 인상 카드를 만지작\n\n` +
        `Double-check line by line, character by character — the numbers +0.4%포인트, 5분의 1 must ` +
        `be rendered EXACTLY as given, no digit substitutions.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, high contrast, ` +
        `photorealistic background.`,
    },
    {
      id: "closing",
      file: "05_geumbaksa_ep4_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, closing slide for a Korean finance ` +
        `information account. ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `Background: same realistic warm home-studio or cozy office space as the cover slide, ` +
        `softly blurred, dark navy semi-transparent overlay (about 45% opacity).\n\n` +
        `Position the gold coin character on the right side of the frame, holding a heart-shaped ` +
        `card with ₩ and $ symbols close to its body, warm and friendly expression.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, bold white text, exactly as written, no typos:\n` +
        `"환율은 그냥 숫자가 아니다\n내 가계부터 기업, 금리까지\n다 이어져 있다"\n\n` +
        `Below that, in bold yellow accent text:\n"팔로우하면 다음 소식도 먼저"\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `card, high contrast, photorealistic background.`,
    },
  ],
});
