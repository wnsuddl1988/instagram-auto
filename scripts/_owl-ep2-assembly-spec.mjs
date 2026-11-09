/**
 * 부엉이 쇼츠 조립 스펙 — 8장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 2편 출처: _ai/live-topic-runs/2026-09-16T15-17-35-683Z-llm-response-household-debt.json
 *           candidate-01 (가계부채 총량 규제 유지, 중앙일보 단독 보도 기반).
 * 1편: scripts/_owl-assembly-spec.mjs (기준금리→카드론 전가, 게시 완료).
 *
 * 설계 원칙:
 *   - narration은 대본 원문 그대로 둔다. TTS 엔진이 "2.75연%"를 어떻게 읽는지는
 *     TTS 단계의 문제이고, 여기서 임의로 고쳐 쓰면 대본과 음성이 어긋난다.
 *   - overlay는 HC-10(이미지에 숫자를 굽지 않는다) 때문에 존재한다. 영상에는
 *     빈 카드/게이지만 있고, 실제 수치는 이 단계에서 렌더러가 얹는다.
 *   - 좌표는 1080x1920 기준이다(프로젝트 표준 해상도). 소스가 720x1280이므로
 *     조립 시 업스케일한 뒤 오버레이를 얹는 순서를 지켜야 한다.
 *   - 안전영역은 _ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md §3.1을 따른다:
 *     금지구역 y 0~150, y 1600~1920, x 900~1080.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-01-target-hit-but-regulation-stays",
  title: "가계부채 목표 코앞인데, 왜 대출 규제는 그대로일까?",
  channelName: "경제번역소",
  // 상단 고정 제목 바. 벤치마킹 채널(moneyhunter_kr)처럼 주제를 한 문장으로 붙박아
  // 스크롤하다 멈춘 사람이 0.5초 안에 무슨 영상인지 알게 한다.
  headerTitle: ["가계부채 목표치 코앞", "그런데 규제는 그대로?"],

  // 최종 산출 규격. 소스가 720x1280이라 업스케일이 필요하다.
  render: Object.freeze({
    width: 1080,
    height: 1920,
    fps: 24, // 소스 8개가 전부 24fps — 재타이밍 없이 그대로 간다
    videoCodec: "libx264",
    crf: 18,
    pixFmt: "yuv420p",
    audioCodec: "aac",
    audioBitrate: "192k",
    audioSampleRate: 48000, // 소스 오디오가 48kHz
    audioChannels: 1,
  }),

  scenes: Object.freeze([
    {
      scene: 1,
      key: "s1_hook",
      role: "hook",
      video: "owl_s1_hook_motion.mp4",
      narration: "가계부채 비율 81.3%, 목표 코앞이라 대출 풀리겠지? 이번 주 당국 답은 정반대였어.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_s2_loss_aversion_motion.mp4",
      narration: "대출 알아보던 사람이라면 꼭 들어야 해. 규제가 빡빡해져서 금리 0.5%p만 올라도, 3억 대출이면 이자가 연 150만원 늘어. 월세 반달치야.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_s3_evidence_card_motion.mp4",
      narration: "이 규제, 다 가계부채 때문이야. 정부는 GDP 대비 80%까지 낮추겠다고 했는데, 벌써 81.3%까지 왔어.",
      // 1편 좌표 체계 재사용(y1500 고정 자막 위쪽, 검증됨). 텍스트만 새 수치로 교체.
      overlays: [
        { text: "가계부채 비율", x: 590, y: 1020, size: 40, kind: "label" },
        { text: "81.3%", x: 590, y: 1100, size: 52, kind: "value" },
        { text: "목표 80%", x: 590, y: 1195, size: 52, kind: "accent" },
        { text: "중앙일보", x: 590, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_s4_background_motion.mp4",
      narration: "이건 2030년 목표였거든. 근데 4년이나 앞당겨서 거의 다 왔어.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_s5_twist_motion.mp4",
      narration: "목표에 다 왔으니 그럼 규제 풀리는 거 아니냐고? 당국 답은 아니오였어. 총량 규제는 계속 간대.",
      // 1편은 막대 두 개로 수치 대비를 보여줬다. 이번엔 "근접했다"와 "그래도 유지"를
      // 같은 구도로 대비시킨다 — 캐릭터가 든 막대 위쪽에 목표/현재, 아래에 결론.
      overlays: [
        { text: "목표", x: 745, y: 760, size: 40, kind: "label" },
        { text: "근접", x: 890, y: 620, size: 40, kind: "accent" },
        { text: "규제는 계속 유지", x: 560, y: 1230, size: 46, kind: "alert" },
        { text: "중앙일보", x: 560, y: 1330, size: 28, kind: "source" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact",
      role: "impact",
      video: "owl_s6_impact_motion.mp4",
      narration: "이유는 이거야. 한국 가계부채가 세계 9위라 규모가 여전히 많거든. 전문가는 규제 유지가 대출금리를 더 올릴 수 있다고 경고했어.",
      // 순위·경고 둘 다 부담 신호라 빨강을 쓴다(1편과 동일 원칙).
      overlays: [
        { text: "가계부채 세계 9위", x: 130, y: 1190, size: 50, kind: "alert" },
        { text: "규제 지속 시 금리 상승 우려", x: 130, y: 1290, size: 40, kind: "value" },
        { text: "중앙일보", x: 130, y: 1385, size: 28, kind: "source" },
      ],
    },
    {
      scene: 7,
      key: "s7_action",
      role: "action",
      video: "owl_s7_action_motion.mp4",
      narration: "대출금리 더 오를 수 있으니 오늘 확인해 봐. 내 대출이 변동금리면 고정으로 바꿔서 이자 부담을 피할 수 있어.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_closing",
      role: "closing_cta",
      video: "owl_s8_closing_motion.mp4",
      narration: "어려운 경제 뉴스를 내 지갑 얘기로, 매번 쉽게 번역해주는 경제번역소. 팔로우해두면 다음 이야기도 가장 먼저 만나볼 수 있어.",
      // 1편에서 확정한 원칙 유지: 면책 문구 대신 팔로우 유도.
      overlays: [
        { text: "팔로우", x: 150, y: 1090, size: 76, kind: "accent" },
        { text: "다음 소식도 먼저 받기", x: 150, y: 1220, size: 48, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
