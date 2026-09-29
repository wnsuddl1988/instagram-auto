/**
 * 부엉이 쇼츠 조립 스펙 15편(재고) — 실업급여 22년 만의 개편, 월급은 줄고
 * 기간은 늘어난다.
 *
 * 15편 출처: 고용노동부 실업급여(구직급여) 개편안, 2026-09-01 고용보험위원회
 * 심의·확정. 무급휴일을 제외한 "주 6일치" 계산 방식으로 변경(현행 "주
 * 7일치"), 월 수급액 하한 198만원 → 176만원, 지급기간 5개월 → 5.8개월로
 * 총액은 유지, 재취업 후 월소득 300만원 이상이면 조기재취업수당 제외 기준
 * 강화. 시행 목표는 2027년 1월이나, 아직 국회 통과 전 정부안 단계.
 * 출처: 서울신문(2026-09-02), 뉴스투데이(2026-09-02), 경향신문(2026-09-01),
 * 한국경제(2026-09-02).
 *
 * 소재 선정 경위: 2026-09-23 세션에서 한은 금융안정 경고(원래 15편 후보)와
 * 이 소재(원래 14편 후보) 중 시의성 비교 후, 한은 경고가 더 급해 순서를
 * 바꿔 먼저 제작(표시번호 9편, 파일명 ep14)했고, 이 실업급여 소재는 시행
 * 목표가 2027년으로 유통기한이 길어 "재고"로 분류(순서 유동적). 표시번호는
 * 배포 시점에 매핑표([[project_owl_episode_display_number_mapping]])
 * 갱신해 확정.
 *
 * 팩트체크 경위(2026-09-24, Agent 조사): "아직 국회 통과 전 정부안 단계"임을
 * 명확히 대본에 반영 — 정부 발표를 시행 확정으로 오해하게 쓰지 않는다
 * ([[feedback_gov_program_names_must_verify_current_status]] 원칙 적용).
 *
 * 대본 설계 원칙(6~14편에서 확정, 계승):
 *   - narration은 TTS 확정본(owl-ep15-tts-script.json)과 정확히 동일해야 한다.
 *   - 훅은 오프닝 반복이 아니라 궁금증·반전 프레이밍.
 *   - 수치 중복 금지, 연결어 확인, 문장 압축, 액션 어미 다양화.
 *   - 이미지에 정보를 직접 그려 넣는 방식 + 오버레이 병행(화살표·강조 문구).
 *   - 좌표는 1080x1920 기준.
 *   - 씬 길이: TTS 실측(rawAudioDurationSec) 기준 8초 미만이면 8초 티어,
 *     8초 이상 또는 여유가 빠듯하면 10초 티어. s6·s8·s9·s10은 Owner 지정으로
 *     Gemini 생성(항상 10초 고정, [[feedback_gemini_veo_scene_assignment_always_10sec]]).
 *   - ★ 영상 생성 절대규칙(87씬 전수조사 확정, _ai/CURRENT_STANDARDS.md §0):
 *     이미지의 텍스트는 크고 짧게만(작은 설명문·다항목 목록 금지), 소품은
 *     감싸 쥐거나 바닥에 세우기(손끝 받침 금지), 화면에 크고 빈 면을 남기지
 *     않기. 이 스펙의 imageBrief는 전부 이 원칙에 맞춰 작성.
 *
 * 배경: 고용노동부 정책 브리핑룸 — 1~14편(사무실/거실/증권사 상담 라운지/
 * 홈트레이딩 데스크/증권사 트레이딩룸/은행 창구/국민연금공단 상담 창구/
 * 고용센터 상담 데스크/부동산 중개사무소/퇴직연금 고객센터/금융감독
 * 브리핑룸)과 겹치지 않는 새 배경. 초록·네이비 톤 정책 발표 단상, 특정
 * 기관 로고·마크 없이 일반적인 정책 브리핑룸 톤.
 *
 * closing_disclaimer는 스펙에 넣지 않는다(3편부터 확정) — 마지막 action
 * 장면에서 바로 끝내고 고정 CTA 클립을 조립 단계에서 이어붙인다.
 */

export const OWL_ASSEMBLY_SPEC = Object.freeze({
  specVersion: "owl_assembly_spec_v1",
  sourceCandidate: "candidate-final-sep-unemployment-benefit-reform",
  title: "실업급여 22년 만의 대수술, 나한텐 이득일까 손해일까",
  channelName: "경제번역소",
  characterDisplayName: "부엉박사",
  headerTitle: ["실업급여 22년 만의 개편", "월급은 줄고 기간은 늘고"],

  instagramCaptionHook: "실업급여 22년 만에 바뀐다는데, 이거 나한테 이득이야 손해야?",
  instagramCaptionPoints: [
    "고용노동부가 이번 달, 실업급여 지급 방식을 22년 만에 손보겠다고 발표했어",
    "지금은 주말까지 포함해서 '주 7일치'로 계산하는데, 앞으로는 '주 6일치'로만 계산해",
    "그래서 매달 받는 돈은 최대 20만 원 넘게 줄어들어 — 198만 원이 176만 원으로",
    "대신 기간을 늘려서 총액은 맞춰준대 — 198만 원씩 5개월이던 게, 176만 원씩 5.8개월로 바뀌는 거야",
    "재취업하고 월급 300만 원 넘게 받으면 남은 실업급여 보너스도 못 받게 기준이 빡빡해졌어",
    "근데 이거, 아직 국회를 안 거친 정부안 단계야. 시행 목표는 2027년 1월이지만 확정된 건 아니야",
    "지금 실업급여 받고 있거나 곧 퇴사 예정이면, 국회 통과 소식 계속 확인해두는 게 좋아",
  ],
  instagramPriorityTags: [
    "실업급여",
    "구직급여",
    "고용보험",
    "퇴사",
    "재취업",
    "노동정책",
    "정부정책",
    "경제공부",
    "재테크",
    "취업준비",
  ],

  emphasisTerms: ["실업급여", "구직급여", "고용노동부", "부엉박사"],

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
      video: "owl_ep15_s1_opening_motion.mp4",
      narration: "안녕, 매일 경제 뉴스 콕 집어 전해주는 부엉박사야! 오늘은 실업급여가 22년 만에 확 바뀐다는 얘기야.",
      imageBrief:
        "부엉이가 정면을 보며 인사하듯 한쪽 날개를 살짝 드는 포즈, 확신에 찬 진지한 " +
        "표정. 배경에 밝은 고용노동부 정책 브리핑룸을 배치해 오늘 주제를 예고 — " +
        "1~14편과 겹치지 않는 새 배경. 특정 기관 로고·마크 없이 일반적인 정책 " +
        "브리핑룸 톤. 배경 소품에는 작은 설명문 대신 큰 글자 라벨만 사용(예: " +
        "'근로 지원' 배너, '정책 브리핑' 단상 안내), 빈 벽면이 크게 남지 않도록 " +
        "화분·의자·스크린 등으로 채운다.",
      overlays: [],
    },
    {
      scene: 2,
      key: "s2_hook",
      role: "hook",
      video: "owl_ep15_s2_hook_motion.mp4",
      narration: "그런데 이거, 돈이 줄어든다는 건지 늘어난다는 건지 헷갈리는 사람이 많더라고.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '줄어든다? 늘어난다?'라는 큰 글자와 물음표 " +
        "아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 고개를 갸웃하는 궁금한 표정으로 " +
        "보여주는 포즈. 카드에는 이 짧은 문구만 크게 그려 넣는다.",
      overlays: [],
    },
    {
      scene: 3,
      key: "s3_fact",
      role: "fact",
      video: "owl_ep15_s3_fact_motion.mp4",
      narration: "고용노동부가 이번 달, 실업급여 지급 방식을 22년 만에 손보겠다고 발표했어.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '실업급여 22년 만의 개편'이라는 큰 글자가 적힌 " +
        "카드를 한쪽 날개로 감싸 쥐고 담담하고 진지한 표정으로 설명하는 포즈.",
      overlays: [],
    },
    {
      scene: 4,
      key: "s4_mechanism",
      role: "situation",
      video: "owl_ep15_s4_mechanism_motion.mp4",
      narration: "지금은 주말까지 포함해서 '주 7일치'로 계산하는데, 앞으로는 '주 6일치'로만 계산해.",
      imageBrief:
        "동일 배경 연속. 바닥에 세운 큰 보드를 좌우로 나눠, 왼쪽엔 '주 7일치' 글자와 " +
        "달력 아이콘, 오른쪽엔 '주 6일치' 글자와 달력 아이콘을 그려 넣는다. 부엉이는 " +
        "보드 옆에서 설명하듯 한쪽 날개를 가볍게 드는 포즈, 보드는 바닥 거치라 " +
        "손으로 들지 않는다.",
      overlays: [],
    },
    {
      scene: 5,
      key: "s5_twist",
      role: "twist",
      video: "owl_ep15_s5_twist_motion.mp4",
      narration: "그래서 매달 받는 돈은 최대 20만 원 넘게 줄어들어 — 198만 원이 176만 원으로.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '월 지급액: 198만원 → 176만원 감소'라는 큰 글자와 " +
        "파란 하락 화살표가 적힌 카드를 한쪽 날개로 감싸 쥐고 놀란 표정으로 보여주는 " +
        "포즈.",
      overlays: [],
    },
    {
      scene: 6,
      key: "s6_consequence",
      role: "consequence",
      video: "owl_ep15_s6_consequence_motion.mp4",
      narration: "대신 기간을 늘려서 총액은 맞춰준대 — 198만 원씩 5개월이던 게, 176만 원씩 5.8개월로 바뀌는 거야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '지급 기간 5개월 → 5.8개월'이라는 큰 글자와 " +
        "달력·시계 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 담담하게 설명하는 " +
        "표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 7,
      key: "s7_evidence",
      role: "evidence",
      video: "owl_ep15_s7_evidence_motion.mp4",
      narration: "재취업하고 월급 300만 원 넘게 받으면 남은 실업급여 보너스도 못 받게 기준이 빡빡해졌어.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '재취업 월소득 300만원 이상 제외'라는 큰 글자와 " +
        "붉은 금지 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지한 표정으로 " +
        "보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 8,
      key: "s8_caveat",
      role: "caveat",
      video: "owl_ep15_s8_caveat_motion.mp4",
      narration: "근데 이거, 아직 국회를 안 거친 정부안 단계야. 시행 목표는 2027년 1월이지만 확정된 건 아니야.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '국회 통과 전, 아직 정부안'이라는 큰 글자와 노란 " +
        "경고 삼각형 아이콘이 적힌 클립보드형 카드를 한쪽 날개로 감싸 쥐고 심각한 " +
        "표정으로 보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 9,
      key: "s9_recommendation",
      role: "recommendation",
      video: "owl_ep15_s9_recommendation_motion.mp4",
      narration: "지금 실업급여 받고 있거나 곧 퇴사 예정이면, 국회 통과 소식 계속 확인해두는 게 좋아.",
      imageBrief:
        "동일 배경 연속. 부엉이가 '국회 통과 소식 확인하기'라는 큰 글자와 작은 정부 " +
        "청사 아이콘이 적힌 카드를 한쪽 날개로 감싸 쥐고 진지하지만 차분한 표정으로 " +
        "보여주는 포즈.",
      overlays: [],
    },
    {
      scene: 10,
      key: "s10_action",
      role: "action",
      video: "owl_ep15_s10_action_motion.mp4",
      narration: "확정되면 또 바로 알려줄게, 팔로우하고 기다려!",
      imageBrief:
        "동일 배경 연속. 부엉이가 '지금 바로 팔로우'라는 문구와 사람 추가 아이콘, " +
        "포인팅 커서 아이콘이 적힌 카드를 한쪽 날개로 확실히 감싸 쥔 채 들어 보이는 " +
        "포즈, 밝고 친근한 미소로 마무리.",
      overlays: [],
    },
  ]),
});

/** 장면 키로 스펙을 찾는다. */
export function findScene(key) {
  return OWL_ASSEMBLY_SPEC.scenes.find((s) => s.key === key) ?? null;
}
