/**
 * 부엉이 카드뉴스 14편(v2, 국민연금 보험료 2027년 10%) — 표지(1/4)만 새로 만든다.
 * v1 표지("27년 만에 처음으로 오른다")는 2026-01 인상이 이미 시행돼 시점이 지난 표현이라 교체.
 * 2~4장은 v1(`C:/tmp/owl-cardnews-ep10/02~04`) 그대로(1998년 9%·27년 동결, 2026년부터 매년
 * 0.5%p·2033년 13%, 소득대체율 41.5→43%·국가 책임, 1355·공제액 비교 — 모두 여전히 사실).
 * 파일 이름은 v1과 같게 해 한 폴더에서 4장으로 묶는다.
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
  "no full sentences) — this is a background detail, not the main message.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cardnews_spec_v1",
  episode: 14,
  character: "owl",
  title: "국민연금 보험료, 올해 오른 데 이어 내년 1월에 또 오른다",
  slides: [
    {
      id: "cover",
      file: "01_ep10_cover.png",
      withCharacter: true,
      prompt:
        `Create a vertical Instagram card, 1080x1350px, cover slide for a Korean finance ` +
        `information account. ${OWL_CHARACTER_NOTE}\n\n` +
        `Background: a realistic photographic scene of a bright, well-lit public pension ` +
        `consultation counter with a large screen showing a simple pension-inquiry menu ` +
        `(blurred, illegible), softly blurred, warm daylight tone, ${BRIGHT_OVERLAY_NOTE} ` +
        `${SIMPLE_BACKGROUND_NOTE}\n\n` +
        `Position the owl character on the right side of the frame, holding up a payslip-like ` +
        `card showing a small "국민연금" label with a red upward arrow mark, serious but ` +
        `confident expression, not blocking the text area.\n\n` +
        `${BADGE_RULE}\n\n` +
        `Center-left, large bold navy/dark text (#14213D) with a thin white outline for contrast ` +
        `against the bright background, exactly as written, no typos:\n` +
        `"국민연금 보험료\n올해 오른 데 이어\n내년 1월 또 오른다"\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), professional financial news ` +
        `headline card, bright and clean, high contrast, no other text.`,
    },
  ],
});
