/**
 * 금박사 CTA v2(새 오디오+새 영상) 자막 생성 전용 스펙 — 조립 파이프라인을
 * 그대로 태워 검증된 자막 로직(buildDynamicCaptionTimeline)을 재사용하기
 * 위한 임시 스펙. 앞 3씬은 패딩(TTS 러너의 최소 4씬 요구 충족용, 최종적으로
 * 버려짐), 4번째 씬만 실제 사용하는 CTA다.
 *
 * scenes[].narration/key는 _build-geumbaksa-cta-tts-script-once.mjs가 만든
 * TTS 스크립트와 정확히 일치해야 alignment 매칭이 된다.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "geumbaksa_cta_v2_caption_spec_v1",
  sourceCandidate: "geumbaksa-cta-v2-caption-only",
  title: "금박사 CTA v2 자막 생성용",
  channelName: "경제번역소",
  characterDisplayName: "금박사",
  headerTitle: [],
  emphasisTerms: ["금박사"],

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
      key: "s1_opening",
      role: "opening",
      video: "s1_opening_motion.mp4",
      narration: "안녕, 난 매일 경제 뉴스를 콕 집어 전해주는 부엉박사야! 오늘은 27년 만에 오르는 국민연금 얘기해볼게.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook",
      role: "hook",
      video: "s2_hook_motion.mp4",
      narration: "내년부터 월급에서 국민연금으로 더 빠져나가는 돈, 많게는 매달 만 원 넘게 늘어난다는 거 알아?",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_why",
      role: "loss_aversion",
      video: "s3_why_motion.mp4",
      narration: "1998년에 9%로 정해진 뒤로 한 번도 안 바뀌었는데, 그대로 두면 연금 기금이 2056년에 바닥날 걸로 예상됐거든.",
      overlays: [],
    },
    {
      scene: 4,
      key: "geumbaksa_cta_follow",
      role: "closing_cta",
      video: "geumbaksa_cta_follow_motion.mp4",
      narration: "몰랐던 돈 얘기, 금박사가 하나씩 쉽게 풀어줄게. 아는 만큼 챙길 수 있는 게 많아지니까, 팔로우 눌러두고 계속 같이 알아가자.",
      overlays: [],
    },
  ]),
});

export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
