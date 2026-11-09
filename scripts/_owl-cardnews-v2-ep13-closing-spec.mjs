/**
 * 부엉이 카드뉴스 13편(v2, 고용률·청년 취업 지원) — 마지막 장(4/4)만 새로 만든다.
 * 1~3장은 v1(`C:/tmp/owl-cardnews-ep11/01~03`)을 그대로 쓴다(수치 재확인 완료:
 * 70.4%, 46개월, 청년 실업률 4년 만에 최고).
 * v1 마지막 장은 2024-09 종료된 "워크넷"을 안내해 폐기 → 고용24·고용센터와
 * 구직촉진수당으로 교체. 파일 이름은 v1과 같게 해 한 폴더에서 4장으로 묶는다.
 */

const BADGE_RULE =
  "Top-left corner: a large rounded yellow badge (#FFD54A), noticeably big and prominent " +
  "(bigger than a normal UI badge, roughly 20% of the image width), containing bold dark " +
  "navy blue (#14213D) Korean text \"경제번역소\". Do not add any text at the bottom of the image.";

const OWL_CHARACTER_NOTE =
  "Include the same 3D-rendered chibi owl mascot character from the attached reference image " +
  "exactly as shown — same face, feathers, glasses, vest, tie. Do not change its design.";

const BRIGHT_OVERLAY_NOTE =
  "with a light, bright semi-transparent overlay (warm off-white/light gray, about 25-30% " +
  "opacity, NOT a dark navy overlay) so the background stays clearly visible and airy, not moody " +
  "or dim.";

const SIMPLE_BACKGROUND_NOTE =
  "Keep any background signage or screen text minimal and generic (short labels or icons only, " +
  "no full sentences, no website names) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 13,
  character: "owl",
  title: "고용률 역대 최고인데 취업은 왜 더 어려울까, 지금 챙길 지원금",
  slides: [
    {
      id: "closing",
      file: "04_ep11_closing.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram carousel card, 1080x1350px, the LAST slide of a 4-slide ` +
        `Korean finance carousel post (cover, body1, body2 already exist — this is slide 4/4, a ` +
        `text-heavy call-to-action card, NOT a character portrait or wallpaper). ` +
        `${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a bright employment center consultation desk scene with a standing ` +
        `information sign (blurred, illegible), softly blurred, warm daylight tone, ` +
        `${BRIGHT_OVERLAY_NOTE} ${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `${BADGE_RULE}\n\n` +
        `This slide MUST contain large printed Korean text overlaid on the image — treat it like a ` +
        `news headline graphic, not a photo. Layout, top to bottom:\n` +
        `1) The yellow badge (top-left, as specified above)\n` +
        `2) A large bold yellow word with dark outline: "팔로우"\n` +
        `3) Below it, bold white text with black outline: "다음 소식도 먼저"\n` +
        `4) Below that, bold dark navy text (#14213D) with white outline, three lines exactly as ` +
        `written, no typos:\n"취업 준비 중이라면\n구직촉진수당 대상인지\n고용24·고용센터에서 확인"\n\n` +
        `Position the owl character standing on the lower-right of the frame, smaller scale (about ` +
        `35% of image height), waving one wing, positioned so it does NOT overlap or cover any of ` +
        `the text blocks above.\n\n` +
        `Style: bold sans-serif Korean font, warm and inviting tone, professional financial news ` +
        `carousel closing card, bright and clean, high contrast, photorealistic background.`,
    },
  ],
});
