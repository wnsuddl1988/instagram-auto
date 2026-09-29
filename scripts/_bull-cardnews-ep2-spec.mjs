/**
 * 황소특보 카드뉴스 2편(레버리지 ETF 반전 수급, 개미는 팔고 외국인·기관은
 * 담았다) 슬라이드 스펙.
 * 원본 영상: scripts/_bull-ep2-assembly-spec.mjs.
 *
 * 문구는 영상 대본을 그대로 옮기지 않고 카피라이팅 문체로 재구성한다(부엉이
 * 트랙 원칙 계승). 핵심 수치(SK하이닉스 레버리지 ETF 외국인 순매수 최대
 * 684억원, 현물에서는 외국인이 SK하이닉스 1조4,150억원 순매도, 같은 기간
 * 삼성전자 +11.27%·SK하이닉스 +8.88%)는 유지하되 문장은 카드뉴스용으로 새로
 * 쓴다. "레버리지 ETF"와 "현물"의 수급 방향이 반대라는 반전 포인트를
 * 명확히 구분해서 전달한다(assembly spec의 팩트체크 원칙 계승 — 뭉뚱그리면
 * 팩트 오류).
 *
 * 배경은 커버/스토리 이미지와 통일해 증권사 트레이딩 라운지(캔들차트 모니터,
 * 파스텔톤) 컨셉으로 설정 — 부엉박사 트랙과 겹치지 않는 황소특보 고유
 * 3D 카툰 스타일.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded gold badge (#F5A623), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const BULL_CHARACTER_NOTE =
  "Include the same 3D-rendered gold bull mascot character from the attached reference image " +
  "exactly as shown — same extreme SD-proportion golden bull with glasses, white shirt, burgundy " +
  "tie, navy pants, no jacket. Do not change its design.";

const TRADING_LOUNGE_BG =
  "a securities trading lounge in the same cute, soft, cartoon 3D animation style as the " +
  "character (never photorealistic) — smooth rounded monitors with faint candlestick chart " +
  "silhouettes (numbers illegible), pastel-toned lighting, smooth floor";

const BRIGHT_OVERLAY_NOTE =
  "with a light, bright semi-transparent overlay (warm off-white/light gray, about 25-30% " +
  "opacity, NOT a dark navy overlay) so the background stays clearly visible and airy, not moody " +
  "or dim.";

const SIMPLE_BACKGROUND_NOTE =
  "Keep any background chart/screen details minimal and generic (silhouette icons only, no " +
  "readable numbers or logos) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 2,
  character: "bull",
  title: "레버리지 ETF, 개미는 팔고 외국인·기관은 담았다",
  slides: [
    {
      id: "cover",
      file: "01_bull_ep2_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${BULL_CHARACTER_NOTE}\n\n` +
        `Background: ${TRADING_LOUNGE_BG}, ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the bull character on the right side of the frame, holding a small card with a ` +
        `red downward arrow icon (symbolizing individual investors selling) with a confident, ` +
        `sharp expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"레버리지 ETF\n개미는 팔고\n외국인·기관은\n담았다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
    {
      id: "body1",
      file: "02_bull_ep2_body1.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: ${TRADING_LOUNGE_BG} with a simple downward red arrow icon on one screen ` +
        `and an upward blue arrow icon on another (numbers illegible), ${BRIGHT_OVERLAY_NOTE} No ` +
        `visible real institution logo — plain anonymous surfaces and generic icons only. ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 2 numbered points stacked vertically: large bold gold numbers (1, 2) on ` +
        `the left, Korean text on the right in dark navy (#14213D) with white outline for ` +
        `readability, key numbers/phrases highlighted in blue (#1B6FD1). Render the Korean text ` +
        `EXACTLY as written, no typos:\n\n` +
        `1. 최근 일주일간 삼성전자·SK하이닉스\n레버리지 ETF에서\n개인이 대거 순매도했어\n\n` +
        `2. 그 물량, 외국인·기관이 받아갔어\nSK하이닉스 레버리지는\n외국인이 최대 684억 원 순매수\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast.`,
    },
    {
      id: "body2",
      file: "03_bull_ep2_body2.png",
      withCharacter: false,
      prompt:
        `Create a vertical Instagram carousel slide, 1080x1350px, for a Korean finance information ` +
        `account.\n\n` +
        `Background: ${TRADING_LOUNGE_BG} with two screens showing opposite-direction arrow icons ` +
        `side by side (one red down, one blue up, numbers illegible), ${BRIGHT_OVERLAY_NOTE} No ` +
        `visible real institution logo. ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `Below the badge, 1 numbered point: a large bold gold number (3) on the left, Korean text ` +
        `on the right in dark navy (#14213D) with white outline for readability, key phrases ` +
        `highlighted in red (#D93A3A) for the twist. Render the Korean text EXACTLY as written, no ` +
        `typos:\n\n` +
        `3. 근데 같은 기간 현물에서는\n외국인이 SK하이닉스를\n1조 4,150억 원어치 팔았어,\n레버리지랑 정반대야\n\n` +
        `Double-check the text character by character: it must read exactly ` +
        `"근데 같은 기간 현물에서는 외국인이 SK하이닉스를 1조 4,150억 원어치 팔았어, 레버리지랑 정반대야" — ` +
        `do not substitute or drop any character or digit.\n\n` +
        `Style: bold sans-serif Korean font, professional financial news card, bright and clean, ` +
        `high contrast.`,
    },
    {
      id: "closing",
      file: "04_bull_ep2_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${BULL_CHARACTER_NOTE}\n\n` +
        `Background: ${TRADING_LOUNGE_BG} with a subtle upward chart line icon (blurred, ` +
        `illegible), ${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The gold badge (top-left, as specified above)\n` +
        `2) A large bold gold word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "새로운 투자 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"같은 기간 삼성전자 11.27%\nSK하이닉스 8.88% 올랐어\n레버리지는 등락폭이 크니 신중하게"\n\n` +
        `Position the bull character standing on the lower-right of the frame, smaller scale ` +
        `(about 35% of image height), one hand raised in a confident wave, positioned so it does ` +
        `NOT overlap or cover any of the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast.`,
    },
  ],
});
