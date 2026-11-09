/**
 * 금박사 7편(예금자보호 한도 1억원) 유튜브 썸네일 + 인스타 릴스 커버 공용 이미지 스펙.
 *
 * v2(2026-09-22, 전면 재설계): v1(캐릭터 없이 흐릿한 사무실 배경+숫자만)이
 * "건조하고 밋밋하다, 애정이 안 생긴다"는 Owner 피드백으로 폐기됨. 문제 4가지:
 * ①캐릭터 없어서 재미없음 ②배경이 흐릿해 심심함 ③훅이 설명체라 안 자극적
 * ④카드뉴스·영상의 쨍한 톤과 단절된 낯선 디자인.
 *
 * v2 방향(Owner 확정): 캐릭터를 화면 크게 과장된 표정(놀람/걱정)으로 다시
 * 넣는다. 배경은 흐릿한 사무실톤 대신 선명한 그라디언트/단색 배경으로 캐릭터·
 * 텍스트를 강하게 부각시킨다. 문구는 설명형("1억원, 진짜 다 보호될까?") 대신
 * 위기감·반전형("내 돈, 안전하지 않을 수도 있다")으로 바꿔 불안감을 자극해
 * 클릭을 유도한다. 카드뉴스와 같은 노란 배지·진한 남색 텍스트 팔레트는 유지해
 * 브랜드 일관성을 지킨다.
 *
 * v2.1(2026-09-22, 크롭 안전영역 보정): 9:16 원본을 유튜브 Shorts 그리드(세로
 * 직사각형)와 인스타 릴스 커버(정사각형, 보통 세로 중앙 기준 크롭)에 그대로
 * 써야 하는데, v2는 텍스트를 상단 절반, 캐릭터를 하단 절반에 나눠 배치해서
 * 정사각형으로 크롭되면 텍스트나 캐릭터 중 하나가 잘릴 위험이 있었다(Owner
 * 지적). 어느 플랫폼이 어떻게 자르든 핵심 텍스트+캐릭터 얼굴이 살아남도록,
 * 화면 세로 중앙 40~50% 안전영역 안에 텍스트와 캐릭터 얼굴을 함께 몰아넣는
 * 레이아웃으로 조정한다. 배경 장식(경고 아이콘, 그라디언트)만 상하단 여백을
 * 채우고, 잘려도 무방하다.
 *
 * **확정(2026-09-22, Owner 승인)**: v2.1(안전영역 보정 버전)을 최종본으로
 * 확정. 세로 직사각형(9:16 그대로)·정사각형 중앙 크롭(941x941) 양쪽 시뮬레이션
 * 검수 완료 — 핵심 문구·캐릭터 얼굴 모두 생존 확인. 최종 파일:
 * `C:/tmp/geumbaksa-cover-ep7-final/geumbaksa_ep7_cover_thumb.png`.
 *
 * 1장만 생성, 9:16(1080x1920 타겟, 실제 출력은 비율만 유지되면 됨). 유튜브
 * Shorts 썸네일과 인스타 릴스 커버 양쪽에 동일 이미지 재사용.
 */

const GEUMBAKSA_CHARACTER_NOTE =
  "Include the same 3D-rendered gold coin mascot character from the attached reference image " +
  "exactly as shown — same golden metallic disc-shaped body, same white gloved hands and feet, " +
  "no clothing. Do not change its core design (color, shape, gloves), but EXAGGERATE its facial " +
  "expression far beyond the reference image: wide shocked eyes, eyebrows raised high, mouth open " +
  "in an alarmed gasp, both hands raised up near its face in a startled \"uh-oh\" gesture. This is " +
  "a dramatic, funny, attention-grabbing expression — think viral thumbnail energy, not the usual " +
  "calm smile.";

export const CARDNEWS_SPEC = Object.freeze({
  specVersion: "owl_cover_thumbnail_spec_v1",
  episode: 7,
  character: "geumbaksa",
  title: "예금자보호 한도 1억원, 진짜 다 보호되는 걸까",
  slides: [
    {
      id: "cover_thumb",
      file: "00_geumbaksa_ep7_cover_thumb_v2.png",
      withCharacter: true,
      prompt:
        `Create a vertical 1080x1920px thumbnail/cover image for a Korean finance Shorts video, ` +
        `designed to grab attention and feel alarming/intriguing even when shrunk down to a tiny ` +
        `square grid thumbnail (this is NOT a calm carousel slide — it needs punch and drama at a ` +
        `glance). ${GEUMBAKSA_CHARACTER_NOTE}\n\n` +
        `CRITICAL SAFE-ZONE LAYOUT (this image will be cropped differently by different apps — a ` +
        `tall rectangle on one platform, a centered square on another): every essential element ` +
        `(both text lines AND the character's full head/face) MUST fit within the vertical center ` +
        `40-50% band of the frame (roughly from 30% to 75% of the total height). Nothing essential ` +
        `may be placed in the top 25% or bottom 20% of the frame — those zones are decorative ` +
        `background only and may be cropped away safely.\n\n` +
        `Background: a bold, vivid, high-contrast background — NOT a blurry photographic office ` +
        `scene. Use a dramatic gradient from deep navy (#0A1633) at the top to a warning red-orange ` +
        `(#E23E2E) glow radiating from behind the character, with a few large soft-focus warning-` +
        `style icons faintly visible in the decorative top/bottom zones only (a cracked piggy bank ` +
        `silhouette, a downward red arrow), kept abstract and dark so text stays highly legible on ` +
        `top. High energy, slightly urgent mood.\n\n` +
        `Layout inside the safe-zone band: at the top of the band, two short punchy bold text lines, ` +
        `white with a thick dark navy (#0A1633) outline and a subtle red glow, exactly as written, ` +
        `no typos:\n"내 돈,\n안전하지 않을 수도"\n` +
        `Directly below the text within the same safe-zone band, the character's head and shoulders ` +
        `large enough that its exaggerated shocked expression (as described above) is clearly ` +
        `visible even at small thumbnail size — the character's eyes and open mouth must sit near ` +
        `the vertical center of the whole frame, not near the bottom edge.\n\n` +
        `Top-left corner (inside the decorative zone, may be cropped on some platforms — acceptable): ` +
        `a small rounded yellow badge (#FFD54A) with bold dark navy (#14213D) Korean text ` +
        `"경제번역소", about 14% of image width.\n\n` +
        `Do not add any other text, props, or captions besides what is specified above — keep the ` +
        `composition bold, high-contrast, and instantly readable, like a viral short-form video ` +
        `thumbnail designed to stop someone mid-scroll.\n\n` +
        `Style: bold sans-serif Korean font (Black Han Sans style), maximum contrast, dramatic ` +
        `lighting, punchy and slightly urgent, not calm or corporate.`,
    },
  ],
});
