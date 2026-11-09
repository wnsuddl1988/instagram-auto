/**
 * 부엉이 쇼츠 조립 스펙 — 9장면의 영상·나레이션·오버레이를 한곳에서 정의한다.
 *
 * 이 파일은 원래 _ai/ 하위에 OWL_EP6_ASSEMBLY_SPEC_BACKUP_DEPRECATED_V1.mjs 로만 있던
 * 6편 스펙을 scripts/ 아래로 정식 이전한 것이다(2026-09-20) — 6편이 scripts/
 * 안에 활성 파일 없이 _ai/ 백업으로만 존재해, 자막 강조 구조 개선
 * (emphasisTerms)을 적용하려면 먼저 정식 위치로 옮겨야 했다. 파일명의
 * "DEPRECATED"는 스펙 내용 자체가 폐기됐다는 뜻이 아니라 예전 백업 명명
 * 관례일 뿐이며, 이 소재(IRP 안전자산 30% 규정)는 이미 게시 완료된 편이다.
 * 원본 백업의 설계 원칙·개정 이력은 그대로 보존한다.
 *
 * 6편 출처: C:/tmp/owl-ep6-llm-response-v3.json candidate-07-irp-safe-asset-etf
 *           (금융감독원 IRP 안전자산 30% 규정, 혼합형 ETF도 인정 — 투자·자산관리
 *           도메인 investing). 게시 완료.
 * 5편: scripts/_owl-ep5-assembly-spec.mjs (한국은행 기준금리 3.00%, 게시 완료).
 * 4편: scripts/_owl-ep4-assembly-spec.mjs (서울 12평 이하 아파트값 15% 상승, 배포 대기).
 * 3편: scripts/_owl-ep3-assembly-spec.mjs (서울 집값 84주 연속 상승·전세난 역설, 게시 완료).
 * 2편: scripts/_owl-ep2-assembly-spec.mjs (가계부채 목표 근접·규제 유지, 게시 완료).
 * 1편: scripts/_owl-assembly-spec.mjs (기준금리→카드론 전가, 게시 완료).
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action 장면에서
 * 바로 끝내고 고정 CTA 클립(밝은 톤, follow+teaser)을 조립 단계에서 이어붙인다.
 *
 * 6편 소재 선정 경위(2026-09-19 Owner 지적, 3차 반려 후 확정):
 *   - investing 도메인에서 처음엔 기준금리 재탕(5편과 20~30% 초과 중복) → 반려.
 *   - 로봇주 테마(코스닥 시총 바이오→로봇 교체)로 재시도 → "근거 없이 기대감만
 *     준다, 바이오가 왜 밀렸는지 설명이 없다"는 지적으로 반려. 실제로 evidence
 *     pack 조각들이 서로 모순(로봇주 상승 뉴스 vs 같은 날 로봇주 차익실현 하락
 *     뉴스)이라 하나의 일관된 스토리로 쓸 재료가 부실했다.
 *   - 레버리지 ETF 대통령 발언도 검토했으나 정치적 발언 인용이라 보류.
 *   - 최종적으로 IRP 안전자산 규정(제도 정보, 종목명 없음, 계절/시황에 안 좌우됨)
 *     으로 확정 — Owner 방향: "아직 팔로워가 적어 개별종목·테마·당일 대장주는
 *     나중에, 지금은 ETF·연금·신탁·펀드·인덱스펀드 같은 대중적·안정자산 위주로."
 *   - action이 "확인해보자" 한 줄뿐이라 구체성 부족 지적 → 3단계로 보강
 *     (① 혼합형 ETF가 뭔지 ② IRP 계좌에서 찾는 방법 ③ 기존 보유자 점검).
 *
 * 보조 캐릭터 도입(2026-09-19 Owner 확정): 부엉이(owl3dv5)의 부하로 금화
 * 캐릭터(coin3dv1)를 신설했다 — 단, 이번 영상에 함께 출연하는 게 아니라
 * 완전히 별도 트랙("금화 1편"부터 시작하는 독립 번호 체계)으로 운영한다.
 * 이 스펙(6편)은 부엉이 단독 진행으로 기존 방식 그대로 진행한다.
 *
 * [스펙-산출물 불일치 주의, 2026-09-21] 이 스펙 파일의 scenes 배열은 여전히
 * 9씬(오프닝 없음, scene 1이 s1_hook)이다. 실제 배포용 최종 영상
 * (owl-ep6-episode-final-v8/owl_episode_final.mp4)은 오프닝 씬을 소급 추가한
 * 10씬 구조로 이미 재조립됐지만, 그 오프닝 씬 추가는 별도 스크립트
 * (run-owl-opening-retrofit-caption-assemble-once.mjs)로 진행되어 이 스펙
 * 파일 자체에는 반영돼 있지 않다. 이 스펙을 그대로 다시 실행하면 오프닝 없는
 * 9씬 결과가 나오니 주의 — 최신 배포 상태는 _ai/CURRENT_STANDARDS.md §1을
 * 따른다.
 *
 * 배경 다양화(2026-09-19 Owner 지적): "4편과 5편이 거의 같은 사무실/거실
 * 배경이라 영상미가 식상하다"는 지적에 따라, 6편은 증권사·은행 상담 라운지
 * (데이터 패널·자문 데스크가 있는 공간)로 배경을 새로 설계한다 — 1~5편 어디에도
 * 쓰지 않은 공간.
 *
 * 설계 원칙:
 *   - narration은 대본 원문 그대로 둔다. TTS 엔진이 숫자를 어떻게 읽는지는
 *     TTS 단계의 문제이고, 여기서 임의로 고쳐 쓰면 대본과 음성이 어긋난다.
 *   - 오버레이 방식 폐기(2026-09-19 Owner 확정, 6편부터 적용): 기존에는
 *     HC-10(이미지에 숫자를 굽지 않는다)을 이유로 이미지는 빈 카드/게이지만
 *     만들고 실제 수치는 조립 단계에서 오버레이 텍스트로 얹었다. 그런데
 *     실제 작업 순서는 항상 "대본을 먼저 확정(하드컷 통과)한 뒤에 이미지를
 *     생성"이었으므로, 이미지 생성 시점에는 이미 숫자가 바뀔 위험이 없었다.
 *     반면 오버레이 합성 단계에서 틀어지면(2026-09-19 실제 사례: 오버레이가
 *     제대로 안 돼 영상을 처음부터 재조립) 이미지·모션 자산을 통째로 다시
 *     만들어야 해서 오히려 자산 낭비와 품질 저하로 이어졌다. 그래서 앞으로는
 *     오버레이 합성 없이 숫자·핵심 문구를 이미지 생성 단계에서 소품/화면에
 *     직접 그려 넣는다. 단, 이 방식이 안전하려면 "이미지 생성은 반드시
 *     대본이 최종 확정된 이후에만 시작한다"는 순서를 절대 어기지 않는다 —
 *     이 순서가 지켜지는 한 부엉이(뉴스 기반)든 금박사(고정 개념)든 동일하게
 *     적용 가능하다.
 *   - 소품은 완전한 백지가 아니라 방향성 있는 이미지(게이지, 저울, 체크리스트
 *     등)로 만든다(2026-09-19 Owner 확정: "직접적이지만 않으면 연상시키는
 *     그림은 얼마든지 나와도 된다"). 5편에서 검증된 패턴(격자그래프·화살표·
 *     체크박스)을 계승하되, 이제는 그 소품 위에 실제 수치·문구까지 함께
 *     그려 넣는다.
 *   - 좌표는 1080x1920 기준이다(프로젝트 표준 해상도). 소스가 720x1280이므로
 *     조립 시 업스케일한다.
 *   - 안전영역은 _ai/MONEY_SHORTS_OS_VIDEO_PIPELINE_SPEC_V1.md §3.1을 따른다:
 *     금지구역 y 0~150, y 1600~1920, x 900~1080. 이미지에 텍스트를 배치할
 *     때도 이 안전영역을 피해서 구도를 잡는다.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-07-irp-safe-asset-etf",
  title: "오늘 알아두면 좋은 금융감독원 IRP 안전자산 규정의 진짜 의미",
  channelName: "경제번역소",
  headerTitle: ["IRP 안전자산 규정", "주식형도 인정된다?"],

  instagramCaptionHook: "안전자산 30% 규정, 주식형으로도 채울 수 있다는 거 알아?",
  instagramCaptionPoints: [
    "IRP는 포트폴리오 최소 30%를 안전자산으로 채워야 하는 규정이 있어",
    "많은 사람들이 IRP는 채권형 상품만 담아야 한다고 오해해왔어",
    "실제로는 주식·채권 혼합형 상품도 안전자산으로 인정돼",
    "혼합형 ETF는 주식과 채권을 5대 5로 담아 매일 비율을 맞추는 상품",
    "IRP 계좌 안에서 혼합형 ETF를 검색해 자산 구성부터 확인해보자",
  ],
  instagramPriorityTags: ["IRP", "퇴직연금", "ETF", "연금저축", "안전자산"],

  // 자막 강조색이 적용될 이 편의 핵심 용어·출처 기관명(2026-09-20 구조 개선 —
  // 편마다 조립기 파일의 전역 목록을 직접 수정하지 않고 스펙에서 선언한다).
  // 배열의 첫 항목(안전자산)은 이 편의 대표 주제어로, 조립기가 한 자막 줄의
  // 강조 슬롯이 숫자로 다 찼어도 항상 우선 강조한다.
  emphasisTerms: ["안전자산", "IRP", "혼합형", "금융감독원"],

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
      key: "s1_hook",
      role: "hook",
      video: "owl_ep6_s1_hook_motion.mp4",
      narration: "안전자산 30% 규정, 주식형으로도 채울 수 있다는 거 알아?",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_loss_aversion",
      role: "loss_aversion",
      video: "owl_ep6_s2_loss_aversion_motion.mp4",
      narration: "이 흐름을 모르고 지나치면 IRP 계좌를 채권으로만 채워 성장 기회를 놓칠 수 있어.",
      overlays: [
        { text: "IRP 성장 기회 놓칠 수 있음", x: 130, y: 1250, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 3,
      key: "s3_evidence_card",
      role: "evidence_card",
      video: "owl_ep6_s3_evidence_card_motion.mp4",
      narration: "현행 규정상 개인형퇴직연금 IRP는 포트폴리오의 최소 30%를 안전자산으로 채워야 해.",
      overlays: [
        { text: "IRP 안전자산 의무 비율", x: 130, y: 1020, size: 36, kind: "label" },
        { text: "최소 30%", x: 130, y: 1100, size: 56, kind: "accent" },
        { text: "금융감독원 감독규정", x: 130, y: 1290, size: 28, kind: "source" },
      ],
    },
    {
      scene: 4,
      key: "s4_background",
      role: "background",
      video: "owl_ep6_s4_background_motion.mp4",
      narration: "많은 사람들이 IRP는 채권형 상품만 담아야 한다고 생각해왔어.",
      overlays: [
        { text: "흔한 오해", x: 130, y: 1250, size: 38, kind: "label" },
      ],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep6_s5_twist_motion.mp4",
      narration: "핵심은 채권만이 아니야. 주식·채권 혼합형 상품도 안전자산으로 인정돼.",
      overlays: [
        { text: "주식 + 채권 혼합형도", x: 130, y: 1190, size: 38, kind: "label" },
        { text: "안전자산으로 인정", x: 130, y: 1270, size: 44, kind: "accent" },
      ],
    },
    {
      scene: 6,
      key: "s6_impact",
      role: "impact",
      video: "owl_ep6_s6_impact_motion.mp4",
      narration: "그래서 규정만 채권으로 오해하면 성장에 노출될 기회를 스스로 좁힐 수 있어.",
      overlays: [
        { text: "성장 기회 스스로 좁힘", x: 130, y: 1250, size: 36, kind: "alert" },
      ],
    },
    {
      scene: 7,
      key: "s7_action_a",
      role: "action",
      video: "owl_ep6_s7_action_a_motion.mp4",
      narration: "혼합형 ETF는 주식과 채권을 5대 5로 담아 매일 비율을 맞추는 상품이야.",
      overlays: [
        { text: "주식 5 : 채권 5", x: 130, y: 1250, size: 38, kind: "accent" },
      ],
    },
    {
      scene: 8,
      key: "s8_action_b",
      role: "action",
      video: "owl_ep6_s8_action_b_motion.mp4",
      narration: "IRP 계좌 안에서 상품 목록을 열어 혼합형 ETF를 오늘 검색해보자.",
      overlays: [
        { text: "IRP 상품 목록에서 검색", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
    {
      scene: 9,
      key: "s9_action_c",
      role: "action",
      video: "owl_ep6_s9_action_c_motion.mp4",
      narration: "이미 담은 상품이 있다면 자산 구성 비율부터 다시 확인해보자.",
      overlays: [
        { text: "자산 구성 비율 재확인", x: 130, y: 1250, size: 36, kind: "label" },
      ],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
