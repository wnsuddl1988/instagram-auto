/**
 * [폐기 — 재실행 금지] 이 스펙으로 만든 산출물(geumbaksa-cta-assembly-v2/
 * owl_shorts_final.mp4)은 1편(IRP) 전용 헤더가 영상에 하드코딩된 결함
 * 자산이었다. 확정 CTA는 geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final.mp4
 * 하나뿐이다(_ai/CURRENT_STANDARDS.md §2). 히스토리 참고용으로만 남겨둔다.
 *
 * 금박사 고정 CTA 조립 스펙 — 1씬(팔로우 유도)만 담은 전용 스펙.
 *
 * 부엉이 CTA(follow 8초+teaser 8초, 부엉이 캐릭터 등장)를 금박사 편 끝에
 * 그대로 붙이면 캐릭터가 갑자기 바뀌어 흐름이 끊긴다는 지적(2026-09-19)에
 * 따라, 금박사 전용 클로징(팔로우 유도만, 다음 편 예고 없음)을 별도로
 * 만든다. 매 금박사 편 끝에 고정 재사용한다(부엉이처럼 한 번만 만들고
 * 계속 붙여쓰는 방식).
 *
 * run-owl-assemble-shorts-v2.mjs를 --spec-module로 그대로 재사용한다.
 */

export const GEUMBAKSA_CTA_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "geumbaksa_cta_assembly_spec_v1",
  sourceTopic: "geumbaksa-fixed-cta-follow",
  title: "금박사 고정 CTA",
  channelName: "경제번역소",
  character: "coin3dv1",
  characterDisplayName: "금박사",
  track: "geumbaksa",

  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24,
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000,
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "cta_follow",
      role: "cta_follow",
      video: "geumbaksa_cta_follow_motion.mp4",
      narration:
        "몰랐던 돈 얘기, 금박사가 하나씩 쉽게 풀어줄게. 아는 만큼 챙길 수 있는 게 많아지니까, 팔로우 눌러두고 계속 같이 알아가자.",
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return GEUMBAKSA_CTA_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
