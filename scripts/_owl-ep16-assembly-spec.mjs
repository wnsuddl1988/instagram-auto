/**
 * 부엉이 쇼츠 조립 스펙 16편 — 2027년 최저임금 확정, 실업급여 하한액 연동.
 *
 * 16편 출처: 최저임금위원회 2026-07-14 제14차 전원회의 의결, 고용노동부
 * 2026-08-05 고시 확정. 2027년 최저임금 시간당 10,700원(2026년 10,320원
 * 대비 +380원, +3.7%), 2027-01-01 시행. 주 40시간 기준 월 환산액 223만
 * 6,300원. 실업급여 최저 지급액은 최저임금의 80%×8시간으로 연동 계산되므로
 * 최저임금이 오르면 자동으로 함께 오른다(15편 하한액과 직접 연계).
 *
 * 소재 선정 경위: 2026-09-24 세션에서 청년월세 특별지원 상시화(발표
 * 2025-09, 신선도 없음), 5세대 실손보험 개편(2026-05 출시, 신선도 없음)을
 * 검토했으나 전부 이미 지난 뉴스로 폐기. 최저임금 확정은 시행일이
 * 2027-01-01이라 유통기한이 길어 채택(15편 실업급여 개편과 동일한
 * "먼 시행일" 패턴).
 *
 * 대본 방향 시행착오: 최초 초안은 "실업급여 연동"과 "최저임금 미지급 문제
 * (276만 9천명, 8명 중 1명)" 두 반전을 한 영상에 다 넣으려다 흐름이
 * 부자연스러워짐(Owner 지적: "초반부랑 중반부 후반부가 자연스럽지 않아").
 * 미지급 문제를 완전히 제외하고 "실업급여 연동" 하나로만 끝까지 밀어붙이는
 * 구조로 재작성해 확정(A안). 15편을 회수하는 s9("15편에서 본 실업급여
 * 하한액, 이래서 매년 바뀌는 거였어")가 이 편의 클라이맥스.
 *
 * 대본 설계 원칙(6~15편에서 확정, 계승):
 *   - narration은 TTS 확정본(owl-ep16-tts-script.json)과 정확히 동일해야 한다.
 *   - 훅은 오프닝 반복이 아니라 궁금증·반전 프레이밍.
 *   - 숫자는 자막에 아라비아 숫자로 통일(한글 발음 표기 금지).
 *   - 부정 부사("못", "안") 뒤 자막 분할 금지(15편에서 발견, 공용 스크립트에
 *     이미 반영됨).
 *   - 씬 길이: 전 씬 TTS 실측(rawAudioDurationSec) 기준 8초 미만, 8초로
 *     요청(margin 충분). 특정 씬을 Gemini로 지정하지 않음 — 10초로 나와도
 *     여유가 넉넉해 문제없음([[feedback_gemini_veo_scene_assignment_always_10sec]]).
 *   - ★ 영상 생성 절대규칙(87씬 전수조사 확정, _ai/CURRENT_STANDARDS.md §0):
 *     이미지의 텍스트는 크고 짧게만(작은 설명문·다항목 목록 금지), 소품은
 *     감싸 쥐거나 바닥에 세우기(손끝 받침 금지), 화면에 크고 빈 면을 남기지
 *     않기. 이 스펙의 imageBrief는 전부 이 원칙에 맞춰 작성.
 *
 * 배경: 최저임금위원회 심의장 — 1~15편(사무실/거실/증권사 상담 라운지/
 * 홈트레이딩 데스크/증권사 트레이딩룸/은행 창구/국민연금공단 상담 창구/
 * 고용센터 상담 데스크/부동산 중개사무소/퇴직연금 고객센터/금융감독
 * 브리핑룸/고용노동부 정책 브리핑룸)과 겹치지 않는 새 배경. 둥근 회의
 * 테이블과 위원석 명패, 특정 기관 로고·마크 없이 일반적인 심의 회의장 톤.
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action
 * 장면에서 바로 끝내고 고정 CTA 클립을 조립 단계에서 이어붙인다.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-final-sep-minimum-wage-2027-unemployment-benefit-link",
  title: "최저임금 올랐다는데, 나랑 상관없다고?",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["2027년 최저임금 확정", "실업급여도 같이 오른다"],

  instagramCaptionHook: "최저임금 또 올랐다는데, 나랑 상관없다고 넘기면 오산이야",
  instagramCaptionPoints: [
    "내년 최저임금이 시간당 10,700원으로 확정됐어, 올해보다 380원 올랐어",
    "주 40시간 기준으로 환산하면 한 달에 223만 6천 원 정도야",
    "근데 이 숫자, 최저임금 받는 사람만의 얘기가 아니야 — 실업급여 최저 금액도 이 최저임금 기준으로 정해지거든",
    "그러니까 최저임금이 오르면, 나중에 내가 받을 실업급여 최저 금액도 같이 올라가는 거야",
    "지금 당장은 상관없어 보여도, 퇴사하거나 실직하면 이 숫자가 바로 내 얘기가 돼",
  ],
  instagramPriorityTags: [
    "최저임금",
    "실업급여",
    "고용보험",
    "노동정책",
    "정부정책",
    "재취업",
    "취업준비",
    "경제공부",
    "재테크",
    "경제뉴스",
  ],

  emphasisTerms: ["최저임금", "실업급여", "부엉박사"],

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
      video: "owl_ep16_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스 콕 집어 전해주는 부엉박사야! 오늘은 최저임금 얘기 해볼게.",
      imageBrief:
        "부엉이가 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 찬 진지한 " +
        "표정. 배경에 밝은 최저임금위원회 심의장을 배치해 오늘 주제를 예고 — 1~15편과 " +
        "겹치지 않는 새 배경. 특정 기관 로고·마크 없이 일반적인 심의 회의장 톤.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook",
      role: "hook",
      video: "owl_ep16_s2_hook_motion.mp4",
      narration: "최저임금 올랐다는데, \"난 상관없다\"고 생각하는 사람 많더라고.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '난 상관없다?'라는 큰 글자와 물음표 아이콘이 적힌 " +
        "카드를 한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_fact",
      role: "fact",
      video: "owl_ep16_s3_fact_motion.mp4",
      narration: "내년 최저임금이 시간당 10,700원으로 확정됐어, 올해보다 380원 올랐어.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '최저임금 10,700원 확정'이라는 큰 글자와 상승 화살표 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 담담하고 진지한 표정으로 설명하는 포즈.",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_fact",
      role: "fact",
      video: "owl_ep16_s4_fact_motion.mp4",
      narration: "주 40시간 기준으로 환산하면 한 달에 223만 6천 원 정도야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '월 223만 6천원'이라는 큰 글자와 계산기 아이콘이 적힌 " +
        "카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep16_s5_twist_motion.mp4",
      narration: "근데 이 숫자, 최저임금 받는 사람만의 얘기가 아니야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '나만의 얘기가 아니다?'라는 큰 글자와 물음표 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_evidence",
      role: "evidence",
      video: "owl_ep16_s6_evidence_motion.mp4",
      narration: "실업급여 최저 금액도 이 최저임금 기준으로 정해지거든.",
      imageBrief:
        "동일 배경 연속. 바닥에 세운 큰 보드에 '최저임금'과 '실업급여 최저 금액' 두 " +
        "글자 상자를 화살표로 잇는 도식을 그려 넣는다. 부엉이는 보드 옆에서 설명하듯 " +
        "한쪽 날개를 가볍게 드는 포즈.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_evidence",
      role: "evidence",
      video: "owl_ep16_s7_evidence_motion.mp4",
      narration: "그러니까 최저임금이 오르면, 나중에 내가 받을 실업급여 최저 금액도 같이 올라가는 거야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '실업급여 최저 금액도 UP'이라는 큰 글자와 상승 화살표 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 확신에 찬 표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_consequence",
      role: "consequence",
      video: "owl_ep16_s8_consequence_motion.mp4",
      narration: "지금 당장은 상관없어 보여도, 퇴사하거나 실직하면 이 숫자가 바로 내 얘기가 돼.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '퇴사·실직하면 내 얘기'라는 큰 글자와 사람 실루엣 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_recommendation",
      role: "recommendation",
      video: "owl_ep16_s9_recommendation_motion.mp4",
      narration: "15편에서 본 실업급여 하한액, 이래서 매년 바뀌는 거였어.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '15편 하한액의 비밀'이라는 큰 글자와 전구 아이콘이 " +
        "적힌 카드를 한쪽 날개로 감싸 쥐고 밝고 기대감 있는 표정으로 보여주는 포즈 — " +
        "은은한 미소 허용(해소감 톤).",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_action",
      role: "action",
      video: "owl_ep16_s10_action_motion.mp4",
      narration: "이렇게 하나만 알아두면, 나중에 실업급여 계산할 때 훨씬 수월해질 거야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '알아두면 쓸모있는 정보'라는 큰 글자가 적힌 카드를 " +
        "한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 포즈, 밝고 친근한 미소로 마무리.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
